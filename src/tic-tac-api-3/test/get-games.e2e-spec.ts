import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { db, schema, storeGameResult, runDbMigrations } from 'tic-tac-db';
import { hashBoardSHA1 } from 'tic-tac-board-hash';
import { Board } from 'tic-tac-types';

const logger = new Logger('GetGamesE2E_TestSetup');

describe('GET /games endpoint (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    logger.log('Running migrations before GET /games test suite...');
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
    logger.log('NestJS app initialized for GET /games tests.');
  });

  afterAll(async () => {
    logger.log('Closing NestJS application...');
    if (app) {
        await app.close();
    }
  });

  it('should return an empty array when no games are stored', async () => {
    await db.delete(schema.win_states);
    const response = await request(server).get('/games');

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(0);
  });

  it('should return stored games in reverse chronological order', async () => {
    await db.delete(schema.win_states);

    const board1: Board = [['X', 'X', 'X'], [null, null, null], [null, null, null]];
    const hash1 = hashBoardSHA1(board1);
    const game1 = await storeGameResult(hash1, board1, 'X', 3);
    expect(game1).toBeDefined();

    await new Promise(resolve => setTimeout(resolve, 50));

    const board2: Board = [['O', 'O', 'O'], [null, null, null], ['X', 'X', null]];
    const hash2 = hashBoardSHA1(board2);
    const game2 = await storeGameResult(hash2, board2, 'O', 3);
    expect(game2).toBeDefined();

    const response = await request(server).get('/games');

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);

    expect(response.body[0].id).toBe(game2!.id);
    expect(response.body[0].winner).toBe('O');
    expect(response.body[1].id).toBe(game1!.id);
    expect(response.body[1].winner).toBe('X');
  });
});
