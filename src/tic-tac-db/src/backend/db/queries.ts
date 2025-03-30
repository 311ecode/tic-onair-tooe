import { eq, desc } from 'drizzle-orm';
import { db, schema } from './connection';
import { Board, PlayerMarker } from 'tic-tac-types';
import type { WinStateRecord, NewWinState } from './schema';

interface ManualNewWinState {
 boardHash: string;
 boardState: unknown;
 winner: PlayerMarker;
 winLength: number;
}
export async function storeGameResult(
  boardHash: string,
  boardState: Board,
  winner: PlayerMarker,
  winLength: number
): Promise<WinStateRecord | null> {
  try {
    const existingWinState = await db.query.win_states.findFirst({
      where: eq(schema.win_states.boardHash, boardHash),
    });

    if (existingWinState) {
       console.log(`Win state result with hash ${boardHash} already exists (winLength: ${existingWinState.winLength}). Skipping insertion.`);
      return existingWinState;
    }

    const newWinStateData:
    ManualNewWinState
    = {
      boardHash,
      boardState: boardState as any,
      winner,
      winLength,
    };

    const insertedWinStates = await db.insert(schema.win_states).values(newWinStateData).returning();

    if (insertedWinStates.length > 0) {
      console.log(`Stored new win state result with hash ${boardHash} (winLength: ${winLength})`);
      return insertedWinStates[0];
    } else {
      console.error(`Failed to insert win state result with hash ${boardHash}, but insert returned empty array.`);
       return await db.query.win_states.findFirst({ where: eq(schema.win_states.boardHash, boardHash) }) ?? null;
    }
  } catch (error) {
    console.error('Error storing win state result:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
       console.warn(`Attempted to insert duplicate hash ${boardHash} despite pre-check (likely race condition). Fetching existing.`);
       return await db.query.win_states.findFirst({ where: eq(schema.win_states.boardHash, boardHash) }) ?? null;
    }
    return null;
  }
}

export async function getAllCompletedGames(): Promise<WinStateRecord[]> {
  try {
    const winStates = await db.query.win_states.findMany({
        orderBy: (states, { desc }) => [
            desc(states.createdAt),
            desc(states.id)
        ],
    });
    console.log(`Retrieved ${winStates.length} completed game win states.`);
    return winStates;
  } catch (error) {
    console.error('Error retrieving completed game win states:', error);
    return [];
  }
}

export async function getGameResultByHash(boardHash: string): Promise<WinStateRecord | null> {
    try {
        const winState = await db.query.win_states.findFirst({
            where: eq(schema.win_states.boardHash, boardHash),
        });
        if (winState) {
            console.log(`Retrieved win state result by hash ${boardHash}`);
        } else {
            console.log(`No win state result found for hash ${boardHash}`);
        }
        return winState ?? null;
    } catch (error) {
        console.error(`Error retrieving win state result by hash ${boardHash}:`, error);
        return null;
    }
}

