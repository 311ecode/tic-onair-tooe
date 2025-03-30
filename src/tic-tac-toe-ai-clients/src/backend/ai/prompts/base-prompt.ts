import { PlayerMarker } from 'tic-tac-types';
import { PromptProvider } from '../prompt-provider.js';

export class BasePromptProvider implements PromptProvider {
  createPrompt(
    formattedBoard: string,
    aiMarker: PlayerMarker,
    humanMarker: PlayerMarker,
    difficulty: string,
    size: number
  ): string {
    return `You are playing Tic Tac Toe on a ${size}x${size} board. You are ${aiMarker} and your opponent is ${humanMarker}.
The current board looks like this:

${formattedBoard}

You need to make the best move as ${aiMarker} with ${difficulty} difficulty.
If the difficulty is 'easy', you may make mistakes sometimes.
If the difficulty is 'medium', you should make decent moves but not perfect.
If the difficulty is 'hard', you should make the optimal move.

Analyze the board and respond with just a single valid move in the format: "x,y"
where x is the column (0-${size - 1}) and y is the row (0-${size - 1}) of your chosen move.
Ensure the move is valid (the cell is empty).`;
  }
}

