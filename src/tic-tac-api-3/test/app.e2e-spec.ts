import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { runDbMigrations } from 'tic-tac-db';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    try {
      runDbMigrations();
      console.log('Migrations applied successfully for e2e tests');
    } catch (error) {
      console.error('Failed to run migrations:', error);
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/games (GET) should return an array', () => {
    return request(app.getHttpServer())
      .get('/games')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/games/evaluate (POST) with invalid data should return 400', () => {
    return request(app.getHttpServer())
      .post('/games/evaluate')
      .send({ invalidKey: 'invalid' })
      .expect(400);
  });

  it('/games/evaluate (POST) with valid no-winner board should return correct response', () => {
    const noWinnerBoard = {
      board: [
        ['X', 'O', 'X'],
        ['X', 'O', 'O'],
        ['O', 'X', 'X']
      ],
      winLength: 3
    };

    return request(app.getHttpServer())
      .post('/games/evaluate')
      .send(noWinnerBoard)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ winner: null, stored: false });
      });
  });

});
