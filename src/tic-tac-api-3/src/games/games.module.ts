import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GameManager } from './game-manager';

@Module({
  controllers: [GamesController],
  providers: [GamesService, GameManager],
})
export class GamesModule {}
