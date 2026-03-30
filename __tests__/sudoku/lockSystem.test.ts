import { describe, it, expect } from 'vitest';
import {
  isAreaConditionMet,
  findUnlockableCells,
  generateAreaCondition,
  validateSolvabilityWithLocks,
  posKey,
  getRowPositions,
  getColPositions,
  getBoxPositions,
  getBoxIndex,
  getAreaPositions,
  countEmptyInArea,
  createConditionDescription,
} from '@/lib/sudoku/lockSystem';
import { generateSolution } from '@/lib/sudoku/generator';
import { createPuzzleFromSolution } from '@/lib/sudoku/solver';
import type { Grid, LockedCell, LockCondition } from '@/types/game';

// ─── posKey ─────────────────────────────────────────

describe('posKey', () => {
  it('좌표를 문자열로 변환한다', () => {
    expect(posKey(3, 7)).toBe('3,7');
    expect(posKey(0, 0)).toBe('0,0');
  });
});

// ─── 영역 조회 ──────────────────────────────────────

describe('getRowPositions', () => {
  it('9개 위치를 반환한다', () => {
    const positions = getRowPositions(3);
    expect(positions).toHaveLength(9);
    positions.forEach((p) => expect(p.row).toBe(3));
  });
});

describe('getColPositions', () => {
  it('9개 위치를 반환한다', () => {
    const positions = getColPositions(5);
    expect(positions).toHaveLength(9);
    positions.forEach((p) => expect(p.col).toBe(5));
  });
});

describe('getBoxPositions', () => {
  it('9개 위치를 반환한다', () => {
    const positions = getBoxPositions(0);
    expect(positions).toHaveLength(9);
    // 박스 0 = (0,0)~(2,2)
    for (const p of positions) {
      expect(p.row).toBeGreaterThanOrEqual(0);
      expect(p.row).toBeLessThanOrEqual(2);
      expect(p.col).toBeGreaterThanOrEqual(0);
      expect(p.col).toBeLessThanOrEqual(2);
    }
  });

  it('박스 8은 (6,6)~(8,8)이다', () => {
    const positions = getBoxPositions(8);
    for (const p of positions) {
      expect(p.row).toBeGreaterThanOrEqual(6);
      expect(p.col).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('getBoxIndex', () => {
  it.each([
    [0, 0, 0], [1, 2, 0], [0, 3, 1], [0, 8, 2],
    [3, 0, 3], [4, 4, 4], [5, 8, 5],
    [6, 0, 6], [7, 5, 7], [8, 8, 8],
  ])('(%d, %d) → 박스 %d', (row, col, expected) => {
    expect(getBoxIndex(row, col)).toBe(expected);
  });
});

describe('getAreaPositions', () => {
  it('row-complete는 행 위치를 반환한다', () => {
    expect(getAreaPositions('row-complete', 0)).toHaveLength(9);
  });

  it('col-complete는 열 위치를 반환한다', () => {
    expect(getAreaPositions('col-complete', 0)).toHaveLength(9);
  });

  it('box-complete는 박스 위치를 반환한다', () => {
    expect(getAreaPositions('box-complete', 4)).toHaveLength(9);
  });
});

// ─── countEmptyInArea ───────────────────────────────

describe('countEmptyInArea', () => {
  it('모든 셀이 채워지면 0이다', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    const positions = getRowPositions(0);
    expect(countEmptyInArea(grid, positions, new Set())).toBe(0);
  });

  it('빈 칸을 정확히 센다', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null;
    grid[0][3] = null;
    grid[0][7] = null;
    const positions = getRowPositions(0);
    expect(countEmptyInArea(grid, positions, new Set())).toBe(3);
  });

  it('잠금 칸은 빈 칸에서 제외한다', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null;
    grid[0][3] = null;
    grid[0][7] = null;
    const lockedKeys = new Set(['0,0']);
    const positions = getRowPositions(0);
    expect(countEmptyInArea(grid, positions, lockedKeys)).toBe(2);
  });
});

// ─── isAreaConditionMet ─────────────────────────────

describe('isAreaConditionMet', () => {
  it('행이 완성되면 true', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    const condition: LockCondition = { type: 'row-complete', target: 0, description: '' };
    expect(isAreaConditionMet(grid, condition, new Set())).toBe(true);
  });

  it('행에 빈 칸이 있으면 false', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][5] = null;
    const condition: LockCondition = { type: 'row-complete', target: 0, description: '' };
    expect(isAreaConditionMet(grid, condition, new Set())).toBe(false);
  });

  it('잠금 칸은 빈 칸에서 제외하여 평가한다', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][5] = null; // 이 칸이 잠금 칸
    const condition: LockCondition = { type: 'row-complete', target: 0, description: '' };
    const lockedKeys = new Set(['0,5']); // 잠금 칸으로 등록
    // 잠금 칸 제외하면 행은 완성
    expect(isAreaConditionMet(grid, condition, lockedKeys)).toBe(true);
  });

  it('영역 조건이 아닌 유형은 false를 반환한다', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(1));
    const condition: LockCondition = { type: 'number-complete', target: 1, description: '' };
    expect(isAreaConditionMet(grid, condition, new Set())).toBe(false);
  });
});

// ─── findUnlockableCells ────────────────────────────

describe('findUnlockableCells', () => {
  it('조건이 충족된 잠금 칸을 반환한다', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null; // 잠금 칸

    const lockedCells: LockedCell[] = [{
      position: { row: 0, col: 0 },
      conditions: [{ type: 'row-complete', target: 0, description: '' }],
    }];

    // 행 0의 나머지는 모두 채워져 있으므로 해제 가능
    const unlockable = findUnlockableCells(grid, lockedCells);
    expect(unlockable).toHaveLength(1);
  });

  it('조건 미충족 시 빈 배열을 반환한다', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null; // 잠금 칸
    grid[0][5] = null; // 다른 빈 칸

    const lockedCells: LockedCell[] = [{
      position: { row: 0, col: 0 },
      conditions: [{ type: 'row-complete', target: 0, description: '' }],
    }];

    // 행 0에 빈 칸(0,5)이 있어 조건 미충족
    const unlockable = findUnlockableCells(grid, lockedCells);
    expect(unlockable).toHaveLength(0);
  });
});

// ─── createConditionDescription ─────────────────────

describe('createConditionDescription', () => {
  it('행 조건 설명', () => {
    expect(createConditionDescription('row-complete', 0)).toBe('1행을 완성하세요');
    expect(createConditionDescription('row-complete', 8)).toBe('9행을 완성하세요');
  });

  it('열 조건 설명', () => {
    expect(createConditionDescription('col-complete', 2)).toBe('3열을 완성하세요');
  });

  it('박스 조건 설명', () => {
    expect(createConditionDescription('box-complete', 0)).toBe('1-1 박스를 완성하세요');
    expect(createConditionDescription('box-complete', 4)).toBe('2-2 박스를 완성하세요');
    expect(createConditionDescription('box-complete', 8)).toBe('3-3 박스를 완성하세요');
  });
});

// ─── generateAreaCondition ──────────────────────────

describe('generateAreaCondition', () => {
  it('빈 칸이 충분한 영역에 조건을 생성한다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);
    const emptyPos = { row: -1, col: -1 };

    // 빈 칸 찾기
    outer:
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] === null) {
          emptyPos.row = r;
          emptyPos.col = c;
          break outer;
        }
      }
    }

    const condition = generateAreaCondition(
      puzzle, emptyPos, new Set(), ['row-complete', 'col-complete', 'box-complete'],
    );
    expect(condition).not.toBeNull();
    expect(['row-complete', 'col-complete', 'box-complete']).toContain(condition!.type);
  });

  it('허용되지 않은 유형은 생성하지 않는다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] === null) {
          const condition = generateAreaCondition(
            puzzle, { row: r, col: c }, new Set(), ['number-complete'],
          );
          // number-complete는 영역 조건이 아니므로 null
          expect(condition).toBeNull();
          return;
        }
      }
    }
  });

  it('빈 타입 배열이면 null을 반환한다', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    const condition = generateAreaCondition(grid, { row: 0, col: 0 }, new Set(), []);
    expect(condition).toBeNull();
  });
});

// ─── validateSolvabilityWithLocks ───────────────────

describe('validateSolvabilityWithLocks', () => {
  it('잠금 없으면 항상 true', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 20);
    expect(validateSolvabilityWithLocks(puzzle, solution, [])).toBe(true);
  });

  it('유효한 잠금 배치는 true', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);

    // 빈 칸 하나를 잠금으로 설정
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] === null) {
          const lockedCells: LockedCell[] = [{
            position: { row: r, col: c },
            conditions: [{ type: 'row-complete', target: r, description: '' }],
          }];
          const result = validateSolvabilityWithLocks(puzzle, solution, lockedCells);
          expect(result).toBe(true);
          return;
        }
      }
    }
  });
});
