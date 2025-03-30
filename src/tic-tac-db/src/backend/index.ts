export { db, schema } from './db/connection';
export { storeGameResult, getAllCompletedGames, getGameResultByHash } from './db/queries';
export { runDbMigrations } from './db/migration-runner';

export type { NewWinState, WinStateRecord } from './db/schema';
export type { Board, PlayerMarker } from 'tic-tac-types';
