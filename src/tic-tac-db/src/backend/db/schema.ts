import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { PlayerMarker } from 'tic-tac-types';

export const win_states = sqliteTable('win_states', {
  id: integer('id').primaryKey({ autoIncrement: true }),
    boardHash: text('board_hash').notNull(),
    boardState: text('board_state', { mode: 'json' }).notNull(),
    winner: text('winner').$type<PlayerMarker>().notNull(),
    winLength: integer('win_length').notNull().default(3),
    createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => {
  return {
    boardHashIdx: uniqueIndex('boardHash_idx').on(table.boardHash),
  };
});

export type NewWinState = typeof win_states.$inferInsert;
export type WinStateRecord = typeof win_states.$inferSelect;

