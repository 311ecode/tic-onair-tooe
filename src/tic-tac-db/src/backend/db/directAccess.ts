import { db, schema } from './connection';
import type { NewWinState, WinStateRecord } from './schema';
import { desc } from 'drizzle-orm';

export async function insertWinStateDirect(winStateData: NewWinState): Promise<WinStateRecord | null> {
    try {
        const dataToInsert = {
            ...winStateData,
            boardState: winStateData.boardState as any
        };

        const insertedRecords = await db
            .insert(schema.win_states)
            .values(dataToInsert)
            .returning();

        if (insertedRecords.length > 0) {
            console.log(`Directly inserted win state with hash ${winStateData.boardHash}`);
            return insertedRecords[0];
        } else {
            console.error(`Direct insertion failed for win state hash ${winStateData.boardHash}, but no error was thrown.`);
            return null;
        }
    } catch (error) {
        console.error(`Error during direct insertion of win state hash ${winStateData.boardHash}:`, error);
        throw error;
    }
}

export async function getAllWinStatesDirect(): Promise<WinStateRecord[]> {
    try {
        const winStates = await db.query.win_states.findMany({
             orderBy: (states, { desc }) => [
                 desc(states.createdAt),
                 desc(states.id)
             ],
        });
        console.log(`Directly retrieved ${winStates.length} win states.`);
        return winStates;
    } catch (error) {
        console.error('Error during direct retrieval of all win states:', error);
        return [];
    }
}
