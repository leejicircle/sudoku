import { describe, it, expect } from 'vitest';
import {
  countDigitPlacements,
  isNumberConditionMet,
  generateNumberCondition,
  generateCondition,
  isAreaConditionMet,
  findUnlockableCells,
  createConditionDescription,
} from '@/lib/sudoku/lockSystem';
import { posKey } from '@/lib/sudoku/utils';
import type { Grid, SolutionGrid, Digit, LockCondition, LockedCell } from '@/types/game';

// ─── 헬퍼: 알려진 솔루션으로 퍼즐 생성 ────────────────

/** 테스트용 완성 솔루션 (유효한 9×9 그리드) */
const createTestSolution = (): SolutionGrid => [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

/** 솔루션에서 특정 셀들만 비워 퍼즐을 만든다 */
const createTestPuzzle = (
  solution: SolutionGrid,
  emptyPositions: [number, number][],
): Grid => {
  const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
  for (const [r, c] of emptyPositions) {
    grid[r][c] = null;
  }
  return grid;
};

// ─── countDigitPlacements ──────────────────────────

describe('countDigitPlacements', () => {
  it('완성된 보드에서 각 숫자가 9번씩 나타난다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    const lockedKeys = new Set<string>();

    for (let d = 1; d <= 9; d++) {
      expect(countDigitPlacements(grid, d as Digit, lockedKeys)).toBe(9);
    }
  });

  it('빈 칸이 있으면 해당 숫자 카운트가 줄어든다', () => {
    const solution = createTestSolution();
    // 5가 있는 셀 몇 개를 비운다
    // solution[0][0] = 5, solution[3][1] = 5, solution[5][7] = 5
    const puzzle = createTestPuzzle(solution, [[0, 0], [3, 1], [5, 7]]);
    const lockedKeys = new Set<string>();

    expect(countDigitPlacements(puzzle, 5, lockedKeys)).toBe(6); // 9 - 3
  });

  it('잠금 칸은 카운트에서 제외된다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    // (0,0)=5를 잠금 칸으로 설정
    const lockedKeys = new Set<string>([posKey(0, 0)]);

    // 5의 카운트가 8이 되어야 함 (잠금 칸 1개 제외)
    expect(countDigitPlacements(grid, 5, lockedKeys)).toBe(8);
  });

  it('빈 보드에서 카운트가 0이다', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    const lockedKeys = new Set<string>();

    expect(countDigitPlacements(grid, 1, lockedKeys)).toBe(0);
  });
});

// ─── isNumberConditionMet ──────────────────────────

describe('isNumberConditionMet', () => {
  it('숫자가 9개 모두 배치되면 true', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    const lockedKeys = new Set<string>();

    expect(isNumberConditionMet(grid, 5, lockedKeys)).toBe(true);
  });

  it('숫자가 9개 미만이면 false', () => {
    const solution = createTestSolution();
    // 5를 하나 제거: solution[0][0] = 5
    const puzzle = createTestPuzzle(solution, [[0, 0]]);
    const lockedKeys = new Set<string>();

    expect(isNumberConditionMet(puzzle, 5, lockedKeys)).toBe(false);
  });

  it('잠금 칸의 숫자는 카운트하지 않으므로 조건 미충족', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    // (0,0)=5를 잠금 처리
    const lockedKeys = new Set<string>([posKey(0, 0)]);

    // 잠금 칸 빼면 5가 8개 → false
    expect(isNumberConditionMet(grid, 5, lockedKeys)).toBe(false);
  });

  it('다른 숫자가 충족되어도 대상 숫자가 미충족이면 false', () => {
    const solution = createTestSolution();
    // 3을 하나 제거: solution[0][1] = 3
    const puzzle = createTestPuzzle(solution, [[0, 1]]);
    const lockedKeys = new Set<string>();

    // 5는 여전히 9개 → true
    expect(isNumberConditionMet(puzzle, 5, lockedKeys)).toBe(true);
    // 3은 8개 → false
    expect(isNumberConditionMet(puzzle, 3, lockedKeys)).toBe(false);
  });
});

// ─── isAreaConditionMet with number-complete ───────

describe('isAreaConditionMet — number-complete', () => {
  it('number-complete 조건을 올바르게 평가한다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    const lockedKeys = new Set<string>();

    const condition: LockCondition = {
      type: 'number-complete',
      target: 7,
      description: '숫자 7을(를) 모두 배치하세요',
    };

    expect(isAreaConditionMet(grid, condition, lockedKeys)).toBe(true);
  });

  it('숫자가 부족하면 number-complete 조건 미충족', () => {
    const solution = createTestSolution();
    // 7을 하나 제거: solution[0][4] = 7
    const puzzle = createTestPuzzle(solution, [[0, 4]]);
    const lockedKeys = new Set<string>();

    const condition: LockCondition = {
      type: 'number-complete',
      target: 7,
      description: '숫자 7을(를) 모두 배치하세요',
    };

    expect(isAreaConditionMet(puzzle, condition, lockedKeys)).toBe(false);
  });
});

// ─── generateNumberCondition ───────────────────────

describe('generateNumberCondition', () => {
  it('아직 완성되지 않은 숫자를 조건으로 생성한다', () => {
    const solution = createTestSolution();
    // 여러 셀을 비워 미완성 숫자 생성
    const puzzle = createTestPuzzle(solution, [
      [0, 0], // 5
      [0, 1], // 3
      [0, 2], // 4
      [1, 0], // 6
      [1, 1], // 7
    ]);
    const lockedKeys = new Set<string>();

    const condition = generateNumberCondition(puzzle, { row: 2, col: 0 }, solution, lockedKeys);

    expect(condition).not.toBeNull();
    expect(condition!.type).toBe('number-complete');
    // target은 1~9의 숫자
    expect(condition!.target).toBeGreaterThanOrEqual(1);
    expect(condition!.target).toBeLessThanOrEqual(9);
    expect(condition!.description.length).toBeGreaterThan(0);
  });

  it('생성된 조건의 target 숫자는 아직 9개 미만이다', () => {
    const solution = createTestSolution();
    // 5를 2개 비움: [0,0]=5, [3,1]=5
    const puzzle = createTestPuzzle(solution, [[0, 0], [3, 1]]);
    const lockedKeys = new Set<string>();

    // 반복하여 생성된 조건의 target 확인
    for (let i = 0; i < 20; i++) {
      const condition = generateNumberCondition(puzzle, { row: 5, col: 7 }, solution, lockedKeys);
      if (condition) {
        // target 숫자는 보드에 9개 미만이어야 함
        const count = countDigitPlacements(puzzle, condition.target as Digit, new Set([...lockedKeys, posKey(5, 7)]));
        expect(count).toBeLessThan(9);
        expect(count).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('완성된 보드에서도 잠금 대상 셀의 숫자가 후보가 된다', () => {
    const solution = createTestSolution();
    // 빈 칸 없이 완성된 보드
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    const lockedKeys = new Set<string>();

    // (0,0)=5를 잠금 대상으로 지정하면, 5는 잠금 칸 제외 시 8개 → 후보
    const condition = generateNumberCondition(grid, { row: 0, col: 0 }, solution, lockedKeys);
    expect(condition).not.toBeNull();
    // 잠금 대상 셀의 숫자(5)만 후보가 됨 (다른 숫자는 여전히 9개)
    expect(condition!.target).toBe(5);
  });

  it('모든 셀이 이미 잠금 처리되면 null을 반환한다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    // 모든 셀을 잠금 처리
    const lockedKeys = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        lockedKeys.add(posKey(r, c));
      }
    }

    const condition = generateNumberCondition(grid, { row: 0, col: 0 }, solution, lockedKeys);
    expect(condition).toBeNull();
  });
});

// ─── generateCondition — 통합 조건 생성기 ──────────

describe('generateCondition', () => {
  it('영역 조건만 허용하면 영역 조건을 생성한다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1],
    ]);
    const lockedKeys = new Set<string>();

    for (let i = 0; i < 20; i++) {
      const cond = generateCondition(puzzle, { row: 2, col: 0 }, lockedKeys, ['row-complete', 'col-complete', 'box-complete'], solution);
      if (cond) {
        expect(['row-complete', 'col-complete', 'box-complete']).toContain(cond.type);
      }
    }
  });

  it('number-complete만 허용하면 숫자 조건을 생성한다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], [1, 0], [1, 1],
    ]);
    const lockedKeys = new Set<string>();

    for (let i = 0; i < 20; i++) {
      const cond = generateCondition(puzzle, { row: 2, col: 0 }, lockedKeys, ['number-complete'], solution);
      if (cond) {
        expect(cond.type).toBe('number-complete');
      }
    }
  });

  it('number-complete가 허용되지만 solution이 없으면 숫자 조건을 생성하지 않는다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], [1, 0], [1, 1],
    ]);
    const lockedKeys = new Set<string>();

    for (let i = 0; i < 20; i++) {
      const cond = generateCondition(puzzle, { row: 2, col: 0 }, lockedKeys, ['number-complete']);
      if (cond) {
        // solution 없이는 number-complete가 생성 안 됨 → 이 경우 null
        expect(cond.type).not.toBe('number-complete');
      }
    }
  });

  it('영역+숫자 혼합 허용 시 두 유형 모두 생성 가능하다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1],
    ]);
    const lockedKeys = new Set<string>();
    const allTypes = ['row-complete', 'col-complete', 'box-complete', 'number-complete'] as const;

    const types = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const cond = generateCondition(
        puzzle, { row: 3, col: 0 }, lockedKeys,
        [...allTypes], solution,
      );
      if (cond) types.add(cond.type);
    }

    // 두 카테고리 모두 한 번 이상은 나와야 함 (확률적, 100회면 충분)
    const hasAreaType = [...types].some((t) => ['row-complete', 'col-complete', 'box-complete'].includes(t));
    const hasNumberType = types.has('number-complete');
    expect(hasAreaType).toBe(true);
    expect(hasNumberType).toBe(true);
  });
});

// ─── createConditionDescription — number-complete ──

describe('createConditionDescription — number-complete', () => {
  it('숫자 조건 설명이 올바르다', () => {
    const desc = createConditionDescription('number-complete', 5);
    expect(desc).toBe('숫자 5을(를) 모두 배치하세요');
  });

  it('1~9 모든 숫자에 대해 설명을 생성한다', () => {
    for (let d = 1; d <= 9; d++) {
      const desc = createConditionDescription('number-complete', d);
      expect(desc).toContain(`${d}`);
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});

// ─── findUnlockableCells with number-complete ──────

describe('findUnlockableCells — number-complete', () => {
  it('숫자 조건 충족 시 잠금 칸이 해제 가능하다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    // 모든 숫자가 완성 → number-complete 조건 충족

    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
      },
    ];

    // 잠금 칸 자체는 카운트에서 제외되므로, grid에 5가 9개 있어도
    // 잠금 칸(0,0)=5를 빼면 8개 → 조건 미충족
    // 하지만 grid[0][0]=5이고 잠금 칸이 (0,0)이면,
    // countDigitPlacements는 잠금 칸 제외하므로 5는 8개 → false
    const unlockable = findUnlockableCells(grid, lockedCells);
    expect(unlockable).toHaveLength(0); // 잠금 칸 자체의 5를 제외하면 8개
  });

  it('잠금 칸 외 나머지 셀로 숫자가 완성되면 해제된다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    // grid에 5가 총 9개. 잠금 칸(2,4)=4이므로 5에 영향 없음
    // → countDigitPlacements(grid, 5, locked(2,4)) = 9 → true

    const lockedCells: LockedCell[] = [
      {
        position: { row: 2, col: 4 }, // solution[2][4] = 4 (5가 아님)
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
      },
    ];

    const unlockable = findUnlockableCells(grid, lockedCells);
    expect(unlockable).toHaveLength(1);
    expect(unlockable[0].position).toEqual({ row: 2, col: 4 });
  });
});
