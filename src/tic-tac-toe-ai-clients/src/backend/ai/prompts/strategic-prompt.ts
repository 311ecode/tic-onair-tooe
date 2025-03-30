import { PlayerMarker } from 'tic-tac-types';
import { PromptProvider } from '../prompt-provider.js';

export class StrategicPromptProvider implements PromptProvider {
  createPrompt(
    formattedBoard: string,
    aiMarker: PlayerMarker,
    humanMarker: PlayerMarker,
    difficulty: string,
    size: number
  ): string {
    const winLength = this.getWinConditionValue(size);
    return `Tic-Tac-Toe Strategy Assistant (${difficulty} mode)

Game Rules:
- Board: ${size}x${size} grid
- X always moves first
- Win by getting ${winLength} in a row (horizontally, vertically, or diagonally)
- You are playing as ${aiMarker}
- Your opponent is playing as ${humanMarker}

Current Board State:
\`\`\`
${formattedBoard}
\`\`\`

Analysis:
${this.getBoardAnalysis(aiMarker, humanMarker, size, winLength)}

Strategic Guidance (${difficulty}):
${this.getDifficultyTips(difficulty, aiMarker)}

Required Response Format:
Provide ONLY the coordinates of your optimal move for marker '${aiMarker}' in the format "x,y" (0-based indices). Choose an empty cell.
Example: "1,2" for column 1, row 2.`;
  }

  private getWinConditionValue(size: number): number {
    return size === 3 ? 3 : Math.min(size, 5);
  }

  private getBoardAnalysis(aiMarker: PlayerMarker, humanMarker: PlayerMarker, size: number, winLength: number): string {
    return `- Your marker: ${aiMarker}
- Opponent marker: ${humanMarker}
- Next turn: It's currently ${aiMarker}'s turn to move.
- Center control: ${this.getCenterImportance(size)} is strategically valuable.
- Corner importance: ${size <= 5 ? 'High' : 'Medium'} for board control.
- Win condition: ${winLength} in a row needed.`;
  }

  private getCenterImportance(size: number): string {
    return size % 2 === 1 ? 'Critical (single center square)' : 'Important (multiple central squares)';
  }

  private getDifficultyTips(difficulty: string, aiMarker: PlayerMarker): string {
    const baseTips = [
      `• Look for immediate winning moves for yourself (${aiMarker}).`,
      `• Block any immediate winning moves for the opponent.`,
    ];

    const difficultySpecificTips = {
      easy: [
        ...baseTips,
        `• May make random or less optimal moves occasionally.`,
        `• Focus on completing simple lines.`
      ],
      medium: [
        ...baseTips,
        `• Try to set up two-way threats (forks).`,
        `• Consider taking center or corners if available and safe.`,
        `• Look 1-2 moves ahead.`
      ],
      hard: [
        ...baseTips,
        `• Aim for perfect play; never make a move that allows the opponent to force a win.`,
        `• Prioritize creating forks and blocking opponent's forks.`,
        `• Control key positions (center, corners).`,
        `• Think several moves ahead, considering all opponent responses (like minimax).`
      ]
    };

    const tips = difficultySpecificTips[difficulty as keyof typeof difficultySpecificTips] || difficultySpecificTips.medium;
return tips.join('\n');
 }
}
