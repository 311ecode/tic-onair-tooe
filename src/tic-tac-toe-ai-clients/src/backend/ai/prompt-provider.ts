import { PlayerMarker } from 'tic-tac-types';

export interface PromptProvider {
    createPrompt(
    formattedBoard: string,
    aiMarker: PlayerMarker,
    humanMarker: PlayerMarker,
    difficulty: string,
    size: number
  ): string;
}

