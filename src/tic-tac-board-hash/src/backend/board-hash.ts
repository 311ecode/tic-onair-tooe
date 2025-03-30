import objectHash from 'object-hash';
import { Board, PlayerMarker } from 'tic-tac-types';

export interface BoardHashOptions {
    algorithm?: 'sha1' | 'md5' | 'passthrough';

    encoding?: 'hex' | 'base64' | 'buffer' | 'binary';

    excludeValues?: boolean;

    normalize?: boolean;
}

export function hashBoard(board: Board, options: BoardHashOptions = {}): string | Buffer {
  const {
    algorithm = 'sha1',
    encoding = 'hex',
    excludeValues = false,
    normalize = false
  } = options;

  if (!board || !Array.isArray(board) || board.length === 0) {
    if (encoding === 'buffer') {
        return objectHash(null, { algorithm, encoding: 'buffer' });
    }
    return objectHash(null, { algorithm, encoding: encoding as 'hex' | 'base64' | 'binary' });
  }

  let boardToHash: Board | boolean[][] = board;

  if (excludeValues) {
    boardToHash = board.map(row => row.map(cell => cell !== null));
  }
  else if (normalize) {
    boardToHash = board.map(row =>
      [...row].sort((a, b) => (a || '').localeCompare(b || ''))
    ).sort((a, b) => a.join('').localeCompare(b.join('')));
  }

  return objectHash(boardToHash, {
    algorithm,
    encoding: encoding === 'buffer' ? 'buffer' : encoding,
    excludeValues: false,
    respectType: false,
    unorderedArrays: false,
    unorderedObjects: false
  });
}

export function hashBoardSHA1(board: Board): string {
  return hashBoard(board, { algorithm: 'sha1', encoding: 'hex' }) as string;
}

export function hashBoardMD5(board: Board): string {
  return hashBoard(board, { algorithm: 'md5', encoding: 'hex' }) as string;
}

export function hashBoardStructure(board: Board): string {
  return hashBoard(board, { excludeValues: true, encoding: 'hex' }) as string;
}

