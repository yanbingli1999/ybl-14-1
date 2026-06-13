import { Candy, Position, MatchResult, CandyType, SpecialCandyType, BOARD_SIZE, BASIC_CANDY_TYPES } from '@/types';
import { GAME_CONFIG } from '@/data/config';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getRandomCandyType(): CandyType {
  return BASIC_CANDY_TYPES[Math.floor(Math.random() * BASIC_CANDY_TYPES.length)];
}

export function createCandy(row: number, col: number, type?: CandyType): Candy {
  return {
    id: generateId(),
    type: type || getRandomCandyType(),
    row,
    col,
    isSpecial: false,
    specialType: null,
    isMatched: false,
    isFalling: false,
  };
}

export function createSpecialCandy(row: number, col: number, specialType: SpecialCandyType): Candy {
  let type: CandyType = 'strawberry';
  if (specialType === 'rainbow') type = 'rainbow';
  if (specialType === 'bomb') type = 'bomb';

  return {
    id: generateId(),
    type,
    row,
    col,
    isSpecial: true,
    specialType,
    isMatched: false,
    isFalling: false,
  };
}

export function createInitialBoard(): (Candy | null)[][] {
  const board: (Candy | null)[][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      let candy = createCandy(row, col);
      while (hasInitialMatch(board, candy, row, col)) {
        candy = createCandy(row, col);
      }
      board[row][col] = candy;
    }
  }

  return board;
}

function hasInitialMatch(board: (Candy | null)[][], candy: Candy, row: number, col: number): boolean {
  if (col >= 2) {
    const left1 = board[row][col - 1];
    const left2 = board[row][col - 2];
    if (left1 && left2 && left1.type === candy.type && left2.type === candy.type) {
      return true;
    }
  }

  if (row >= 2) {
    const up1 = board[row - 1][col];
    const up2 = board[row - 2][col];
    if (up1 && up2 && up1.type === candy.type && up2.type === candy.type) {
      return true;
    }
  }

  return false;
}

export function isAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function swapCandies(board: (Candy | null)[][], pos1: Position, pos2: Position): (Candy | null)[][] {
  const newBoard = board.map(row => [...row]);

  const candy1 = newBoard[pos1.row][pos1.col];
  const candy2 = newBoard[pos2.row][pos2.col];

  if (candy1 && candy2) {
    newBoard[pos1.row][pos1.col] = { ...candy2, row: pos1.row, col: pos1.col };
    newBoard[pos2.row][pos2.col] = { ...candy1, row: pos2.row, col: pos2.col };
  }

  return newBoard;
}

export function checkSwapHasSpecial(pos1: Position, pos2: Position, board: (Candy | null)[][]): {
  hasSpecial: boolean;
  specialPos: Position | null;
  normalPos: Position | null;
  specialType: SpecialCandyType;
  normalType: CandyType | null;
} {
  const c1 = board[pos1.row]?.[pos1.col];
  const c2 = board[pos2.row]?.[pos2.col];

  if (!c1 || !c2) {
    return { hasSpecial: false, specialPos: null, normalPos: null, specialType: null, normalType: null };
  }

  if (c1.isSpecial && !c2.isSpecial) {
    return {
      hasSpecial: true,
      specialPos: pos1,
      normalPos: pos2,
      specialType: c1.specialType,
      normalType: c2.type,
    };
  }

  if (c2.isSpecial && !c1.isSpecial) {
    return {
      hasSpecial: true,
      specialPos: pos2,
      normalPos: pos1,
      specialType: c2.specialType,
      normalType: c1.type,
    };
  }

  if (c1.isSpecial && c2.isSpecial) {
    return {
      hasSpecial: true,
      specialPos: pos1,
      normalPos: pos2,
      specialType: 'rainbow',
      normalType: null,
    };
  }

  return { hasSpecial: false, specialPos: null, normalPos: null, specialType: null, normalType: null };
}

export function triggerSpecialCandy(
  board: (Candy | null)[][],
  specialPos: Position,
  specialType: SpecialCandyType,
  normalType: CandyType | null
): MatchResult {
  const positions: Position[] = [];
  const candies: Candy[] = [];

  if (specialType === 'bomb') {
    const { row, col } = specialPos;
    for (let r = row - 2; r <= row + 2; r++) {
      for (let c = col - 2; c <= col + 2; c++) {
        const dr = Math.abs(r - row);
        const dc = Math.abs(c - col);
        if (dr + dc <= 2 && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          positions.push({ row: r, col: c });
          const cdy = board[r][c];
          if (cdy) candies.push(cdy);
        }
      }
    }
  }

  if (specialType === 'rainbow') {
    const targetType = normalType || BASIC_CANDY_TYPES[0];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cdy = board[r][c];
        if (cdy && (cdy.type === targetType || (cdy.isSpecial && cdy.specialType === 'bomb'))) {
          positions.push({ row: r, col: c });
          candies.push(cdy);
        }
      }
    }
  }

  return {
    candies,
    positions,
    matchType: 'special',
    specialGenerated: null,
    specialPosition: null,
  };
}

export function findAllMatches(board: (Candy | null)[][]): MatchResult[] {
  const matches: MatchResult[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    let matchStart = 0;
    let matchType: CandyType | null = null;
    let matchCount = 0;

    for (let col = 0; col < BOARD_SIZE; col++) {
      const candy = board[row][col];
      if (candy && !candy.isSpecial && candy.type === matchType) {
        matchCount++;
      } else {
        if (matchCount >= GAME_CONFIG.MATCH_MIN && matchType) {
          const positions: Position[] = [];
          const candies: Candy[] = [];
          for (let c = matchStart; c < matchStart + matchCount; c++) {
            positions.push({ row, col: c });
            const cdy = board[row][c];
            if (cdy) candies.push(cdy);
          }
          let specialGenerated: SpecialCandyType = null;
          let specialPosition: Position | null = null;
          if (matchCount >= 5) {
            specialGenerated = 'rainbow';
            specialPosition = { row, col: matchStart + Math.floor(matchCount / 2) };
          } else if (matchCount === 4) {
            specialGenerated = 'bomb';
            specialPosition = { row, col: matchStart + 1 };
          }
          matches.push({
            candies,
            positions,
            matchType: 'horizontal',
            specialGenerated,
            specialPosition,
          });
        }
        matchStart = col;
        matchType = candy && !candy.isSpecial ? candy.type : null;
        matchCount = candy && !candy.isSpecial ? 1 : 0;
      }
    }

    if (matchCount >= GAME_CONFIG.MATCH_MIN && matchType) {
      const positions: Position[] = [];
      const candies: Candy[] = [];
      for (let c = matchStart; c < matchStart + matchCount; c++) {
        positions.push({ row, col: c });
        const cdy = board[row][c];
        if (cdy) candies.push(cdy);
      }
      let specialGenerated: SpecialCandyType = null;
      let specialPosition: Position | null = null;
      if (matchCount >= 5) {
        specialGenerated = 'rainbow';
        specialPosition = { row, col: matchStart + Math.floor(matchCount / 2) };
      } else if (matchCount === 4) {
        specialGenerated = 'bomb';
        specialPosition = { row, col: matchStart + 1 };
      }
      matches.push({
        candies,
        positions,
        matchType: 'horizontal',
        specialGenerated,
        specialPosition,
      });
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let matchStart = 0;
    let matchType: CandyType | null = null;
    let matchCount = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      const candy = board[row][col];
      if (candy && !candy.isSpecial && candy.type === matchType) {
        matchCount++;
      } else {
        if (matchCount >= GAME_CONFIG.MATCH_MIN && matchType) {
          const positions: Position[] = [];
          const candies: Candy[] = [];
          for (let r = matchStart; r < matchStart + matchCount; r++) {
            positions.push({ row: r, col });
            const cdy = board[r][col];
            if (cdy) candies.push(cdy);
          }
          let specialGenerated: SpecialCandyType = null;
          let specialPosition: Position | null = null;
          if (matchCount >= 5) {
            specialGenerated = 'rainbow';
            specialPosition = { row: matchStart + Math.floor(matchCount / 2), col };
          } else if (matchCount === 4) {
            specialGenerated = 'bomb';
            specialPosition = { row: matchStart + 1, col };
          }
          matches.push({
            candies,
            positions,
            matchType: 'vertical',
            specialGenerated,
            specialPosition,
          });
        }
        matchStart = row;
        matchType = candy && !candy.isSpecial ? candy.type : null;
        matchCount = candy && !candy.isSpecial ? 1 : 0;
      }
    }

    if (matchCount >= GAME_CONFIG.MATCH_MIN && matchType) {
      const positions: Position[] = [];
      const candies: Candy[] = [];
      for (let r = matchStart; r < matchStart + matchCount; r++) {
        positions.push({ row: r, col });
        const cdy = board[r][col];
        if (cdy) candies.push(cdy);
      }
      let specialGenerated: SpecialCandyType = null;
      let specialPosition: Position | null = null;
      if (matchCount >= 5) {
        specialGenerated = 'rainbow';
        specialPosition = { row: matchStart + Math.floor(matchCount / 2), col };
      } else if (matchCount === 4) {
        specialGenerated = 'bomb';
        specialPosition = { row: matchStart + 1, col };
      }
      matches.push({
        candies,
        positions,
        matchType: 'vertical',
        specialGenerated,
        specialPosition,
      });
    }
  }

  return matches;
}

export function findSpecialMatches(board: (Candy | null)[][], matches: MatchResult[]): MatchResult[] {
  const specialMatches: MatchResult[] = [];
  const allMatchedPositions = new Set<string>();

  for (const match of matches) {
    for (const pos of match.positions) {
      allMatchedPositions.add(`${pos.row},${pos.col}`);
    }
  }

  const processedSpecials = new Set<string>();

  for (const match of matches) {
    for (const pos of match.positions) {
      const adjacents = [
        { row: pos.row - 1, col: pos.col },
        { row: pos.row + 1, col: pos.col },
        { row: pos.row, col: pos.col - 1 },
        { row: pos.row, col: pos.col + 1 },
        { row: pos.row, col: pos.col },
      ];

      for (const adj of adjacents) {
        if (adj.row < 0 || adj.row >= BOARD_SIZE || adj.col < 0 || adj.col >= BOARD_SIZE) continue;
        const key = `${adj.row},${adj.col}`;
        if (processedSpecials.has(key)) continue;

        const candy = board[adj.row][adj.col];
        if (candy && candy.isSpecial) {
          processedSpecials.add(key);

          if (candy.specialType === 'bomb') {
            const positions: Position[] = [];
            const candies: Candy[] = [];
            for (let r = adj.row - 2; r <= adj.row + 2; r++) {
              for (let c = adj.col - 2; c <= adj.col + 2; c++) {
                const dr = Math.abs(r - adj.row);
                const dc = Math.abs(c - adj.col);
                if (dr + dc <= 2 && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                  positions.push({ row: r, col: c });
                  const cdy = board[r][c];
                  if (cdy) candies.push(cdy);
                }
              }
            }
            specialMatches.push({
              candies,
              positions,
              matchType: 'special',
              specialGenerated: null,
              specialPosition: null,
            });
          }

          if (candy.specialType === 'rainbow') {
            const positions: Position[] = [];
            const candies: Candy[] = [];
            let targetType: CandyType | null = null;

            for (const m of matches) {
              for (const p of m.positions) {
                const cdy = board[p.row][p.col];
                if (cdy && !cdy.isSpecial) {
                  targetType = cdy.type;
                  break;
                }
              }
              if (targetType) break;
            }

            if (!targetType) {
              for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                  const cdy = board[r][c];
                  if (cdy && !cdy.isSpecial) {
                    targetType = cdy.type;
                    break;
                  }
                }
                if (targetType) break;
              }
            }

            if (targetType) {
              for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                  const cdy = board[r][c];
                  if (cdy && (cdy.type === targetType || (cdy.isSpecial && cdy.specialType === 'bomb'))) {
                    positions.push({ row: r, col: c });
                    candies.push(cdy);
                  }
                }
              }
            }

            specialMatches.push({
              candies,
              positions,
              matchType: 'special',
              specialGenerated: null,
              specialPosition: null,
            });
          }
        }
      }
    }
  }

  return specialMatches;
}

export function markMatched(board: (Candy | null)[][], matches: MatchResult[]): (Candy | null)[][] {
  const newBoard = board.map(row => row.map(c => c ? { ...c } : null));
  const matchedSet = new Set<string>();

  for (const match of matches) {
    for (const pos of match.positions) {
      matchedSet.add(`${pos.row},${pos.col}`);
    }
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (matchedSet.has(`${row},${col}`) && newBoard[row][col]) {
        newBoard[row][col]!.isMatched = true;
      }
    }
  }

  return newBoard;
}

export function removeMatched(board: (Candy | null)[][]): (Candy | null)[][] {
  const newBoard = board.map(row =>
    row.map(candy => (candy?.isMatched ? null : candy))
  );
  return newBoard;
}

export function applyGravity(board: (Candy | null)[][]): (Candy | null)[][] {
  const newBoard = board.map(row => [...row]);

  for (let col = 0; col < BOARD_SIZE; col++) {
    let writeRow = BOARD_SIZE - 1;

    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        if (row !== writeRow) {
          newBoard[writeRow][col] = {
            ...newBoard[row][col]!,
            row: writeRow,
            isFalling: true,
          };
          newBoard[row][col] = null;
        }
        writeRow--;
      }
    }
  }

  return newBoard;
}

export function fillEmptySpaces(board: (Candy | null)[][]): (Candy | null)[][] {
  const newBoard = board.map(row => [...row]);

  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = createCandy(row, col);
        newBoard[row][col]!.isFalling = true;
      }
    }
  }

  return newBoard;
}

export function placeSpecialCandies(board: (Candy | null)[][], matches: MatchResult[]): (Candy | null)[][] {
  const newBoard = board.map(row => [...row]);

  for (const match of matches) {
    if (match.specialGenerated && match.specialPosition) {
      const { row, col } = match.specialPosition;
      if (newBoard[row][col] === null) {
        newBoard[row][col] = createSpecialCandy(row, col, match.specialGenerated);
      } else {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && newBoard[nr][nc] === null) {
              newBoard[nr][nc] = createSpecialCandy(nr, nc, match.specialGenerated);
              break;
            }
          }
        }
      }
    }
  }

  return newBoard;
}

export function countClearedCandies(matches: MatchResult[]): Record<CandyType, number> {
  const counts: Record<string, number> = {};

  for (const match of matches) {
    for (const candy of match.candies) {
      if (!candy.isSpecial) {
        counts[candy.type] = (counts[candy.type] || 0) + 1;
      }
    }
  }

  return counts as Record<CandyType, number>;
}

export function calculateScore(matches: MatchResult[], combo: number): number {
  let score = 0;

  for (const match of matches) {
    if (match.matchType === 'special') {
      score += match.candies.length * 15;
    } else {
      const baseScore = match.candies.length * 10;
      const lengthBonus = match.candies.length > 3 ? (match.candies.length - 3) * 20 : 0;
      score += baseScore + lengthBonus;
    }
  }

  const comboMultiplier = 1 + combo * GAME_CONFIG.COMBO_BONUS_MULTIPLIER;
  score = Math.floor(score * comboMultiplier);

  return score;
}

export function hasValidMoves(board: (Candy | null)[][]): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const candy = board[row][col];

      if (col < BOARD_SIZE - 1) {
        const right = board[row][col + 1];
        if (candy?.isSpecial || right?.isSpecial) {
          return true;
        }
        const swapped = swapCandies(board, { row, col }, { row, col: col + 1 });
        if (findAllMatches(swapped).length > 0) {
          return true;
        }
      }
      if (row < BOARD_SIZE - 1) {
        const below = board[row + 1][col];
        if (candy?.isSpecial || below?.isSpecial) {
          return true;
        }
        const swapped = swapCandies(board, { row, col }, { row: row + 1, col });
        if (findAllMatches(swapped).length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}
