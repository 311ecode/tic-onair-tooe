import { IsInt, Min, Max, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Board } from 'tic-tac-types';

export class MakeMoveDto {
  @IsNotEmpty()
  board: Board;

  @IsInt()
  @Min(0)
  x: number;

  @IsInt()
  @Min(0)
  y: number;

  @IsInt()
  @Min(3)
  winLength?: number = 3;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'], { 
    message: 'difficulty must be one of: easy, medium, hard'
  })
  difficulty?: 'easy' | 'medium' | 'hard';
  
  @IsOptional()
  @IsBoolean()
  withAI?: boolean = false;
}
