import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Board } from 'tic-tac-types';
import { db, schema, runDbMigrations } from 'tic-tac-db';

const logger = new Logger('EvaluateGameE2E_TestSetup');

describe('POST /games/evaluate endpoint (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
     logger.log('Running migrations before POST /games/evaluate test suite...');
     try {
       runDbMigrations();
       logger.log('Migrations function executed.');
     } catch (error) {
       logger.error(`Migration failed during test setup: ${error.message}`, error.stack);
       throw error;
     }

     logger.log('Clearing win_states table...');
     try {
       await db.delete(schema.win_states);
       logger.log('win_states table cleared.');
     } catch (e) {
       logger.error('Failed to clear win_states table:', e);
       throw e;
     }

     logger.log('Setting up NestJS testing module...');
     const moduleFixture: TestingModule = await Test.createTestingModule({
       imports: [AppModule],
     }).compile();

     app = moduleFixture.createNestApplication();
     app.useGlobalPipes(new ValidationPipe({
         whitelist: true, forbidNonWhitelisted: true, transform: true,
         transformOptions: { enableImplicitConversion: true },
     }));
     await app.init();
     server = app.getHttpServer();
     logger.log('NestJS app initialized for POST /games/evaluate tests.');
  });

  afterAll(async () => {
    logger.log('Closing NestJS application...');
    if (app) {
        await app.close();
    }
  });

  it('invalid board structure (not array) should return 400', async () => {
    const invalidPayload = { board: 'not-an-array', winLength: 3 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(invalidPayload);

    expect(response.status).toBe(400);
    const message = response.body.message;
    expect(
        (typeof message === 'string' && message.includes('Invalid board structure')) ||
        (Array.isArray(message) && message.some(m => typeof m === 'string' && (m.includes('board must be an array') || m.includes('Invalid board structure'))))
    ).toBe(true);
  });

  it('invalid board structure (not square) should return 400', async () => {
    const invalidPayload: { board: any, winLength: number } = { board: [['X', null], [null, 'O'], [null, null]], winLength: 3 };
    const response = await request(server)
        .post('/games/evaluate')
        .send(invalidPayload);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid board structure');
  });

  it('invalid board structure (cell content) should return 400', async () => {
    const invalidPayload: { board: any, winLength: number } = { board: [['X', null, 'Z'], [null, 'O', null], [null, null, 'X']], winLength: 3 };
    const response = await request(server)
        .post('/games/evaluate')
        .send(invalidPayload);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid cell value found');
  });

  it('board with no winner should return { winner: null, stored: false }', async () => {
    const board: Board = [
      ['X', 'O', 'X'],
      ['O', 'X', 'O'],
      ['O', 'X', null],
    ];
    const payload = { board: board, winLength: 3 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ winner: null, stored: false });
  });

  it('board with X winning should return winner details and store result', async () => {
     await db.delete(schema.win_states);

    const winningBoard: Board = [
      ['X', 'X', 'X'],
      ['O', 'O', null],
      [null, null, null],
    ];
    const payload = { board: winningBoard, winLength: 3 };

    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.winner).toBe('X');
    expect(response.body.winLength).toBe(3);
    expect(response.body.boardState).toEqual(winningBoard);

    const dbRecord = await db.query.win_states.findFirst({ where: (states, { eq }) => eq(states.id, response.body.id) });
    expect(dbRecord).toBeDefined();
    expect(dbRecord?.winner).toBe('X');
  });

   it('duplicate winning board should return existing result, not store again', async () => {
     await db.delete(schema.win_states);

     const winningBoard: Board = [
      ['O', null, null],
      ['O', 'X', 'X'],
      ['O', null, null],
    ];
    const payload = { board: winningBoard, winLength: 3 };

    const firstResponse = await request(server)
      .post('/games/evaluate')
      .send(payload);
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.id).toBeDefined();
    const firstId = firstResponse.body.id;
    const boardHash = firstResponse.body.boardHash;

    const secondResponse = await request(server)
      .post('/games/evaluate')
      .send(payload);
     expect(secondResponse.status).toBe(200);
     expect(secondResponse.body.id).toBeDefined();
     expect(secondResponse.body.id).toBe(firstId);

     const dbRecords = await db.query.win_states.findMany({ where: (states, { eq }) => eq(states.boardHash, boardHash) });
     expect(dbRecords).toHaveLength(1);
   });
});
