import {
  IsInt,
  IsOptional,
  Min,
  Allow,
} from 'class-validator';
import { Board } from 'tic-tac-types';

export class EvaluateGameDto {

  @Allow()
  board: Board;

  @IsOptional()
  @IsInt()
  @Min(3)
  winLength?: number = 3;
}
