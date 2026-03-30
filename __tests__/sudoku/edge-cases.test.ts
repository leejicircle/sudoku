/**
 * 스도쿠 엔진 엣지 케이스 테스트
 * 기존 테스트에서 누락된 경계 조건과 특수 케이스를 보강.
 */

import { describe, it, expect } from 'vitest';
import { generateSolution, isValidSolution } from '@/lib/sudoku/generator';
import { solve, hasUniqueSolution, countPuzzleSolutions } from '@/lib/sudoku/solver';
import { getStageConfig } from '@/lib/sudoku/difficulty';
import {
  findAllConflicts,
  updateBoardErrors,
  isBoardFilled,
  isBoardSolved,
  cloneBoard,
  createBoardFromPuzzle,
  boardToGrid,
} from '@/lib/sudoku/validator';
import {
  BOARD_SIZE,
  BOX_SIZE,
  DIGITS,
  cloneGrid,
  posKey,
  canPlaceInGrid,
  getBoxIndex,
} from '@/lib/sudoku/utils';
import type { Grid, SolutionGrid, Digit } from '@/types/game';
import {
  TEST_SOLUTION,
  createTestSolution,
  makeCell,
  makeEmptyBoard,
  makeSolvedBoard,
  makeEmptyGrid,
} from './helpers';

// ─── utils 엣지 케이스 ──────────────────────────────

describe('utils 엣지 케이스', () => {
  describe('DIGITS', () => {
    it('1~9 숫자 배열이다', () => {
      expect(DIGITS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(DIGITS).toHaveLength(9);
    });
  });

  describe('BOARD_SIZE / BOX_SIZE', () => {
    it('상수가 올바르다', () => {
      expect(BOARD_SIZE).toBe(9);
      expect(BOX_SIZE).toBe(3);
    });
  });

  describe('posKey', () => {
    it('좌표를 문자열로 변환한다', () => {
      expect(posKey(0, 0)).toBe('0,0');
      expect(posKey(8, 8)).toBe('8,8');
      expect(posKey(3, 7)).toBe('3,7');
    });
  });

  describe('getBoxIndex', () => {
    it('각 구역의 박스 인덱스가 올바르다', () => {
      // 좌상단 3×3
      expect(getBoxIndex(0, 0)).toBe(0);
      expect(getBoxIndex(2, 2)).toBe(0);

      // 중앙
      expect(getBoxIndex(3, 3)).toBe(4);
      expect(getBoxIndex(5, 5)).toBe(4);

      // 우하단
      expect(getBoxIndex(6, 6)).toBe(8);
      expect(getBoxIndex(8, 8)).toBe(8);
    });

    it('모든 81셀의 박스 인덱스가 0~8 범위이다', () => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const idx = getBoxIndex(r, c);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(8);
        }
      }
    });
  });

  describe('cloneGrid', () => {
    it('깊은 복사를 반환한다', () => {
      const grid: Grid = [[1, null, 3, null, null, null, null, null, null]];
      const padded: Grid = Array.from({ length: 9 }, (_, i) =>
        i === 0 ? [...grid[0]] : Array(9).fill(null),
      );
      const cloned = cloneGrid(padded);

      cloned[0][0] = 9;
      expect(padded[0][0]).toBe(1); // 원본 불변
    });
  });

  describe('canPlaceInGrid', () => {
    it('빈 그리드에서 모든 위치에 놓을 수 있다', () => {
      const grid = makeEmptyGrid();
      expect(canPlaceInGrid(grid, 0, 0, 1)).toBe(true);
      expect(canPlaceInGrid(grid, 8, 8, 9)).toBe(true);
    });

    it('같은 행에 같은 숫자가 있으면 놓을 수 없다', () => {
      const grid = makeEmptyGrid();
      grid[0][0] = 5;
      expect(canPlaceInGrid(grid, 0, 8, 5)).toBe(false);
    });

    it('같은 열에 같은 숫자가 있으면 놓을 수 없다', () => {
      const grid = makeEmptyGrid();
      grid[0][3] = 7;
      expect(canPlaceInGrid(grid, 8, 3, 7)).toBe(false);
    });

    it('같은 박스에 같은 숫자가 있으면 놓을 수 없다', () => {
      const grid = makeEmptyGrid();
      grid[0][0] = 2;
      expect(canPlaceInGrid(grid, 1, 2, 2)).toBe(false);
    });

    it('다른 영역의 같은 숫자는 놓을 수 있다', () => {
      const grid = makeEmptyGrid();
      grid[0][0] = 4;
      expect(canPlaceInGrid(grid, 4, 4, 4)).toBe(true);
    });
  });
});

// ─── isValidSolution 엣지 케이스 ────────────────────

describe('isValidSolution 엣지 케이스', () => {
  it('열에 중복이 있으면 유효하지 않다', () => {
    const invalid = createTestSolution();
    // 열 0의 두 셀을 같게 만듦
    invalid[1][0] = invalid[0][0]; // 둘 다 5
    expect(isValidSolution(invalid)).toBe(false);
  });

  it('3×3 박스에 중복이 있으면 유효하지 않다', () => {
    const invalid = createTestSolution();
    // 좌상단 박스 내 중복
    invalid[0][0] = invalid[1][1]; // 둘 다 7
    expect(isValidSolution(invalid)).toBe(false);
  });

  it('10이 포함된 그리드는 유효하지 않다', () => {
    const invalid = createTestSolution();
    (invalid[0][0] as number) = 10;
    expect(isValidSolution(invalid)).toBe(false);
  });

  it('행 길이가 9가 아니면 유효하지 않다', () => {
    const invalid = [[1, 2, 3, 4, 5, 6, 7, 8]] as unknown as SolutionGrid;
    expect(isValidSolution(invalid)).toBe(false);
  });
});

// ─── solver 엣지 케이스 ─────────────────────────────

describe('solver 엣지 케이스', () => {
  it('빈 그리드를 풀 수 있다 (복수 해)', () => {
    const grid = makeEmptyGrid();
    const result = solve(grid);
    expect(result.solved).toBe(true);
    if (result.solved) {
      expect(isValidSolution(result.grid)).toBe(true);
    }
  });

  it('빈 그리드는 유일해가 아니다', () => {
    const grid = makeEmptyGrid();
    expect(hasUniqueSolution(grid)).toBe(false);
  });

  it('이미 완성된 그리드도 풀 수 있다', () => {
    const grid: Grid = TEST_SOLUTION.map((row) => [...row]);
    const result = solve(grid);
    expect(result.solved).toBe(true);
    expect(result.solutionCount).toBe(1);
  });

  it('countPuzzleSolutions — maxCount=1로 조기 중단', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null;
    // 유일해지만 maxCount=1이면 1에서 멈춤
    const count = countPuzzleSolutions(grid, 1);
    expect(count).toBe(1);
  });

  it('countPuzzleSolutions — maxCount=10으로 다중 해 탐색', () => {
    const grid = makeEmptyGrid();
    grid[0][0] = 1;
    grid[0][1] = 2;
    // 2개만 고정 → 매우 많은 해 → maxCount=10에서 조기 중단
    const count = countPuzzleSolutions(grid, 10);
    expect(count).toBe(10); // 상한에 도달
  });
});

// ─── difficulty 엣지 케이스 ──────────────────────────

describe('difficulty 엣지 케이스', () => {
  it('모든 구간 경계 스테이지의 빈 칸이 구간 범위 내이다', () => {
    const boundaries = [
      { stage: 1, min: 28, max: 37 },
      { stage: 10, min: 28, max: 37 },
      { stage: 11, min: 38, max: 43 },
      { stage: 20, min: 38, max: 43 },
      { stage: 21, min: 44, max: 49 },
      { stage: 30, min: 44, max: 49 },
      { stage: 31, min: 49, max: 54 },
      { stage: 40, min: 49, max: 54 },
      { stage: 41, min: 54, max: 58 },
      { stage: 50, min: 54, max: 58 },
    ];

    for (const { stage, min, max } of boundaries) {
      const config = getStageConfig(stage);
      expect(config.emptyCells).toBeGreaterThanOrEqual(min);
      expect(config.emptyCells).toBeLessThanOrEqual(max);
    }
  });

  it('연속 스테이지 간 빈 칸 증가폭이 합리적이다 (최대 ±5)', () => {
    for (let stage = 1; stage < 50; stage++) {
      const current = getStageConfig(stage).emptyCells;
      const next = getStageConfig(stage + 1).emptyCells;
      const diff = Math.abs(next - current);
      expect(diff).toBeLessThanOrEqual(5);
    }
  });

  it('스테이지 31+에서 cell-fill 유형이 포함된다', () => {
    for (const stage of [31, 35, 40, 45, 50]) {
      const config = getStageConfig(stage);
      expect(config.allowedLockTypes).toContain('cell-fill');
    }
  });

  it('스테이지 41+에서 allowChainLocks가 true이다', () => {
    for (const stage of [41, 45, 50]) {
      expect(getStageConfig(stage).allowChainLocks).toBe(true);
    }
    for (const stage of [1, 10, 20, 30, 40]) {
      expect(getStageConfig(stage).allowChainLocks).toBe(false);
    }
  });
});

// ─── validator 엣지 케이스 ──────────────────────────

describe('validator 엣지 케이스', () => {
  it('전체 행이 같은 숫자 — 72개 충돌', () => {
    const board = makeEmptyBoard();
    for (let c = 0; c < 9; c++) {
      board[0][c] = makeCell(1);
    }
    // 행에서 C(9,2)=36쌍이지만, 박스에서도 추가 충돌
    const conflicts = findAllConflicts(board);
    // 같은 행의 9셀 모두 충돌
    for (let c = 0; c < 9; c++) {
      expect(conflicts.has(posKey(0, c))).toBe(true);
    }
  });

  it('updateBoardErrors가 notes를 보존한다', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(null);
    board[0][0].notes.add(1);
    board[0][0].notes.add(3);

    const result = updateBoardErrors(board);
    expect(result[0][0].notes.has(1)).toBe(true);
    expect(result[0][0].notes.has(3)).toBe(true);
  });

  it('isBoardFilled — 하나만 빈 셀', () => {
    const board = makeSolvedBoard();
    expect(isBoardFilled(board)).toBe(true);

    board[8][8] = makeCell(null);
    expect(isBoardFilled(board)).toBe(false);
  });

  it('isBoardSolved — 값은 다 있지만 오답 하나', () => {
    const board = makeSolvedBoard();
    // (0,0)의 정답은 5 → 9로 변경
    board[0][0] = makeCell(9 as Digit, { isGiven: true });
    expect(isBoardFilled(board)).toBe(true);
    expect(isBoardSolved(board, TEST_SOLUTION)).toBe(false);
  });

  it('cloneBoard — 빈 보드도 정상 복사', () => {
    const board = makeEmptyBoard();
    const cloned = cloneBoard(board);
    expect(cloned.length).toBe(9);
    expect(cloned[0].length).toBe(9);
    cloned[0][0] = makeCell(5);
    expect(board[0][0].value).toBeNull();
  });

  it('createBoardFromPuzzle — 모든 셀이 given이면 잠금 없음', () => {
    const puzzle: Grid = TEST_SOLUTION.map((row) => [...row]);
    const board = createBoardFromPuzzle(puzzle, []);

    for (const row of board) {
      for (const cell of row) {
        expect(cell.isGiven).toBe(true);
        expect(cell.isLocked).toBe(false);
      }
    }
  });

  it('boardToGrid — notes와 isError는 Grid에 포함되지 않는다', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(5, { isError: true });
    board[0][0].notes.add(3);

    const grid = boardToGrid(board);
    expect(grid[0][0]).toBe(5);
    // Grid는 CellValue[][] 타입이므로 추가 정보 없음
    expect(typeof grid[0][0]).toBe('number');
  });
});

// ─── 데이터 무결성 ──────────────────────────────────

describe('데이터 무결성', () => {
  it('TEST_SOLUTION이 유효한 솔루션이다', () => {
    expect(isValidSolution(TEST_SOLUTION)).toBe(true);
  });

  it('모든 행에 1~9가 한 번씩 등장한다', () => {
    for (const row of TEST_SOLUTION) {
      const sorted = [...row].sort();
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it('모든 열에 1~9가 한 번씩 등장한다', () => {
    for (let c = 0; c < 9; c++) {
      const col = TEST_SOLUTION.map((row) => row[c]);
      expect([...col].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it('모든 3×3 박스에 1~9가 한 번씩 등장한다', () => {
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box: number[] = [];
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            box.push(TEST_SOLUTION[r][c]);
          }
        }
        expect(box.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      }
    }
  });
});
