import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { runDbMigrations } from 'tic-tac-db';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap-API3');

  if (process.env.TIC_TAC_DB_PATH) {
    const dbPath = process.env.TIC_TAC_DB_PATH;
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      logger.log(`Creating directory for database: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    process.env.DATABASE_PATH = dbPath;
    logger.log(`Using database at: ${dbPath}`);
  } else {
    logger.log('No TIC_TAC_DB_PATH defined. Using automatic database path generation.');
  }

  if (process.env.PRODUCTION !== 'true') {
    logger.log('Non-production environment detected. Attempting database migration via library function...');
    try {
      runDbMigrations();
      logger.log('Database migration via library successful.');
    } catch (error) {
      logger.error(`Database migration via library failed: ${error.message}`, error.stack);
      logger.error('Exiting due to failed migration.');
      process.exit(1);
    }
  } else {
    logger.log('PRODUCTION environment detected. Skipping automatic database migration.');
  }
  const app = await NestFactory.create(AppModule);

  app.enableCors();

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

  const port = process.env.TIC_TAC_PORT || 10101;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
