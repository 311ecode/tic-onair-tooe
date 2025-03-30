export type PlayerMarker = 'X' | 'O';

export type Cell = PlayerMarker | null;

export type Board = Cell[][];

export interface Coordinate {
    x: number;

    y: number;
}

