// src/utils.ts
export interface CellCoord {
    q: number;
    r: number;
}

export const getNeighbors = (q: number, r: number): CellCoord[] => {
    return [
        { q: q + 1, r: r }, { q: q - 1, r: r },
        { q: q, r: r + 1 }, { q: q, r: r - 1 },
        { q: q + 1, r: r - 1 }, { q: q - 1, r: r + 1 }
    ];
};