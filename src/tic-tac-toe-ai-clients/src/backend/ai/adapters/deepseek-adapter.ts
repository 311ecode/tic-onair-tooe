import { Board, Coordinate, PlayerMarker } from 'tic-tac-types';
import { isValidBoardState } from 'tic-tac-valid';
import { BaseAIClient, Difficulty } from '../ai-client.js';
import { PromptProvider } from '../prompt-provider.js';
import { BasePromptProvider } from '../prompts/base-prompt.js';
interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface DeepSeekAdapterConfig {
  apiKey: string;
  model?: string;
  promptProvider?: PromptProvider;
}

export class DeepSeekAdapter extends BaseAIClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly promptProvider: PromptProvider;

  constructor(config: DeepSeekAdapterConfig) {
    super();
    this.apiKey = config.apiKey;
    this.model = config.model || 'deepseek-coder';
    this.promptProvider = config.promptProvider || new BasePromptProvider();
  }

    async getNextMove(
    board: Board,
    difficulty: Difficulty = 'medium'
  ): Promise<Coordinate> {
    this.validateBoard(board);

    const { aiMarker, humanMarker } = this.getMarkers(board);
    const validMoves = this.getValidMoves(board);

    if (validMoves.length === 0) {
      throw new Error('No valid moves available for AI');
    }

    if (validMoves.length === 1) {
      return validMoves[0];
    }

    try {
      const response = await this.getAIResponse(board, difficulty, aiMarker, humanMarker);
      return this.parseAIResponse(response, validMoves);
    } catch (error) {
      console.error('Error getting AI move from DeepSeek:', error);
      console.warn('Falling back to random move due to API error.');
      return this.getRandomMove(board);
    }
  }

  private validateBoard(board: Board): void {
    if (!isValidBoardState(board)) {
      throw new Error('Invalid board state provided to AI');
    }
  }

  private async getAIResponse(
    board: Board,
    difficulty: Difficulty,
    aiMarker: PlayerMarker,
    humanMarker: PlayerMarker
  ): Promise<string> {
    const prompt = this.createPrompt(board, difficulty, aiMarker, humanMarker);
    return this.callDeepSeekAPI(prompt);
  }

  private createPrompt(
    board: Board,
    difficulty: Difficulty,
    aiMarker: PlayerMarker,
    humanMarker: PlayerMarker
  ): string {
    return this.promptProvider.createPrompt(
      this.formatBoard(board),
      aiMarker,
      humanMarker,
      difficulty,
      board.length
    );
  }

  private async callDeepSeekAPI(prompt: string): Promise<string> {
    const response = await fetch('https:
      method: 'POST',
      headers: this.getAPIHeaders(),
      body: JSON.stringify(this.getAPIRequestBody(prompt))
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json() as DeepSeekResponse;
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
       throw new Error('Invalid response structure from DeepSeek API');
    }
    return data.choices[0].message.content.trim();
  }

  private getAPIHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  private getAPIRequestBody(prompt: string) {
    return {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a strategic Tic Tac Toe player. Respond with only the coordinates of your move in "x,y" format (0-based index).'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 10
    };
  }

  private parseAIResponse(response: string, validMoves: Coordinate[]): Coordinate {
    const match = response.match(/(\d+)\s*[,;:\s]\s*(\d+)/);

    if (match) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);

      const move = validMoves.find(m => m.x === x && m.y === y);
      if (move) {
          return move;
      } else {
          console.warn(`AI response "${response}" parsed to (${x},${y}), but it's not a valid move. Valid moves: ${JSON.stringify(validMoves)}`);
      }
    } else {
        console.warn(`Could not parse AI response "${response}" into coordinates.`);
    }

    console.warn('Falling back to random move due to parsing issue or invalid coordinate.');
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
}

