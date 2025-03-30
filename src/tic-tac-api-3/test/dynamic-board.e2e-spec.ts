import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Board } from 'tic-tac-types';
import { db, schema, runDbMigrations } from 'tic-tac-db';

const logger = new Logger('DynamicBoardE2E_TestSetup');

describe('Dynamic Board Size Tests (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    logger.log('Running migrations before dynamic board test suite...');
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
    logger.log('NestJS app initialized for dynamic board tests.');
  });

  afterAll(async () => {
    logger.log('Closing NestJS application...');
    if (app) {
      await app.close();
    }
  });

  it('should detect win on 4x4 board with winLength=4', async () => {
    const board: Board = [
      ['X', 'X', 'X', 'X'],
      ['O', 'O', null, null],
      [null, null, null, null],
      [null, null, null, null]
    ];
    
    const payload = { board, winLength: 4 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('X');
    expect(response.body.winLength).toBe(4);
  });

  it('should detect win on 5x5 board with winLength=3', async () => {
    const board: Board = [
      ['X', 'X', 'X', null, null],
      ['O', 'O', null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ];
    
    const payload = { board, winLength: 3 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('X');
    expect(response.body.winLength).toBe(3);
  });

  it('should detect win on 5x5 board with winLength=5', async () => {
    const board: Board = [
      ['X', 'X', 'X', 'X', 'X'],
      ['O', 'O', 'O', 'O', null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ];
    
    const payload = { board, winLength: 5 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('X');
    expect(response.body.winLength).toBe(5);
  });

  it('should detect diagonal win on 5x5 board', async () => {
    const board: Board = [
      ['X', null, null, null, null],
      [null, 'X', null, null, null],
      [null, null, 'X', null, null],
      [null, null, null, 'X', null],
      [null, null, null, null, 'X']
    ];
    
    const payload = { board, winLength: 5 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('X');
  });

  it('should not detect a win with insufficient consecutive markers', async () => {
    const board: Board = [
      ['X', 'X', 'X', null, null],
      ['O', 'O', null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ];
    
    const payload = { board, winLength: 4 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ winner: null, stored: false });
  });

  it('should detect vertical win on 4x4 board', async () => {
    const board: Board = [
      ['O', null, null, null],
      ['O', null, null, null],
      ['O', null, null, null],
      ['O', 'X', 'X', 'X']
    ];
    
    const payload = { board, winLength: 4 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('O');
  });

  it('should detect anti-diagonal win on 4x4 board', async () => {
    const board: Board = [
      [null, null, null, 'O'],
      [null, null, 'O', null],
      [null, 'O', null, null],
      ['O', null, null, null]
    ];
    
    const payload = { board, winLength: 4 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('O');
  });

  it('should handle a full board with no winner (draw)', async () => {
    const board: Board = [
      ['X', 'O', 'X', 'O'],
      ['O', 'X', 'O', 'X'],
      ['X', 'O', 'X', 'O'],
      ['O', 'X', 'O', 'X']
    ];
    
    const payload = { board, winLength: 4 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ winner: null, stored: false });
  });

  it('should validate board consistency across all rows', async () => {
    const board: Board = [
      ['X', 'X', 'X', 'X', 'X'],
      ['O', 'O', 'O', 'O'],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ];
    
    const payload = { board, winLength: 5 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid board structure');
  });

  it('should reject non-square boards', async () => {
    const board: Board = [
      ['X', 'X', 'X', 'X', 'X'],
      ['O', 'O', 'O', 'O', 'O'],
      [null, null, null, null, null]
    ];
    
    const payload = { board, winLength: 5 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid board structure');
  });

  it('should handle large board (10x10) with small win length (3)', async () => {
    const board: Board = Array(10).fill(null).map(() => Array(10).fill(null));
    board[0][0] = 'X';
    board[0][1] = 'X';
    board[0][2] = 'X';
    
    const payload = { board, winLength: 3 };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('X');
  });

  it('should use the default winLength (3) if not specified', async () => {
    const board: Board = [
      ['X', 'X', 'X', null, null],
      ['O', 'O', null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ];
    
    const payload = { board };
    const response = await request(server)
      .post('/games/evaluate')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.winner).toBe('X');
    expect(response.body.winLength).toBe(3);
  });
});
