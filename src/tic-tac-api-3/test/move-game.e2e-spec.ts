import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Board } from 'tic-tac-types';
import { db, schema, runDbMigrations } from 'tic-tac-db';

const logger = new Logger('MoveGameE2E_TestSetup');

describe('POST /games/move endpoint (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    logger.log('Running migrations before move game test suite...');
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
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();
    server = app.getHttpServer();
    logger.log('NestJS app initialized for move game tests.');
  });

  afterAll(async () => {
    logger.log('Closing NestJS application...');
    if (app) {
      await app.close();
    }
  });

  it('should make a valid move and return updated board', async () => {
    const board: Board = [
      ['X', null, null],
      [null, null, null],
      [null, null, null]
    ];
    const payload = { board, x: 1, y: 1, winLength: 3 };
    
    const response = await request(server)
      .post('/games/move')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.board[1][1]).toBe('O');
    expect(response.body.winner).toBeNull();
    expect(response.body.gameOver).toBe(false);
    expect(response.body.nextPlayer).toBe('X');
  });

  it('should detect a win after move', async () => {
    const board: Board = [
      ['X', 'X', null],
      ['O', 'O', null],
      [null, null, null]
    ];
    const payload = { board, x: 2, y: 0, winLength: 3 };
    
    const response = await request(server)
      .post('/games/move')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.board[0][2]).toBe('X');
    expect(response.body.winner).toBe('X');
    expect(response.body.gameOver).toBe(true);
  });

  it('should return 400 for invalid move', async () => {
    const board: Board = [
      ['X', null, null],
      [null, null, null],
      [null, null, null]
    ];
    const payload = { board, x: 0, y: 0, winLength: 3 };
    
    const response = await request(server)
      .post('/games/move')
      .send(payload);

    expect(response.status).toBe(400);
  });
});
