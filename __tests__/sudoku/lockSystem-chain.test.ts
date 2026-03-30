import { describe, it, expect } from 'vitest';
import {
  generateCompositeConditions,
  setupChainLinks,
  findUnlockableCellsWithChain,
  findUnlockableCells,
} from '@/lib/sudoku/lockSystem';
import { posKey } from '@/lib/sudoku/utils';
import type { Grid, SolutionGrid, Digit, LockedCell } from '@/types/game';

// ─── 헬퍼 ──────────────────────────────────────────

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

// ─── generateCompositeConditions ────────────────────

describe('generateCompositeConditions', () => {
  it('빈 칸이 충분하면 2개 조건을 생성한다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1],
    ]);
    const lockedKeys = new Set<string>();
    const allTypes = ['row-complete', 'col-complete', 'box-complete', 'number-complete'] as const;

    // 여러 번 시도하여 2개가 나오는 경우 확인
    let gotTwo = false;
    for (let i = 0; i < 30; i++) {
      const conditions = generateCompositeConditions(
        puzzle, { row: 3, col: 0 }, lockedKeys, [...allTypes], solution,
      );
      if (conditions.length === 2) {
        gotTwo = true;
        break;
      }
    }
    expect(gotTwo).toBe(true);
  });

  it('조건 2개의 유형이 서로 다르다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], [0, 3],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1],
    ]);
    const lockedKeys = new Set<string>();
    const allTypes = ['row-complete', 'col-complete', 'box-complete', 'number-complete'] as const;

    for (let i = 0; i < 30; i++) {
      const conditions = generateCompositeConditions(
        puzzle, { row: 3, col: 0 }, lockedKeys, [...allTypes], solution,
      );
      if (conditions.length === 2) {
        // 유형이 다르거나, 같더라도 target이 달라야 함
        const isDifferent =
          conditions[0].type !== conditions[1].type ||
          conditions[0].target !== conditions[1].target;
        expect(isDifferent).toBe(true);
      }
    }
  });

  it('후보가 없으면 빈 배열을 반환한다', () => {
    const solution = createTestSolution();
    // 거의 완성된 보드 — 빈 칸 1개만
    const puzzle = createTestPuzzle(solution, [[0, 0]]);
    const lockedKeys = new Set<string>();

    // 빈 칸이 1개뿐이면 영역 조건 emptyCount=0이 되어 후보 없음
    // 단, number-complete는 가능할 수 있으므로 영역만 허용
    const conditions = generateCompositeConditions(
      puzzle, { row: 0, col: 0 }, lockedKeys, ['row-complete', 'col-complete', 'box-complete'], solution,
    );
    // 빈 칸이 자기 자신뿐이면 영역 조건 emptyCount=0 → 빈 배열
    expect(conditions).toHaveLength(0);
  });

  it('최소 1개는 항상 반환한다 (후보가 있을 때)', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1],
    ]);
    const lockedKeys = new Set<string>();

    const conditions = generateCompositeConditions(
      puzzle, { row: 2, col: 0 }, lockedKeys,
      ['row-complete', 'col-complete', 'box-complete', 'number-complete'], solution,
    );
    expect(conditions.length).toBeGreaterThanOrEqual(1);
  });

  it('조건 설명이 비어있지 않다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1],
    ]);
    const lockedKeys = new Set<string>();

    const conditions = generateCompositeConditions(
      puzzle, { row: 3, col: 0 }, lockedKeys,
      ['row-complete', 'col-complete', 'box-complete', 'number-complete'], solution,
    );
    for (const cond of conditions) {
      expect(cond.description.length).toBeGreaterThan(0);
    }
  });
});

// ─── setupChainLinks ────────────────────────────────

describe('setupChainLinks', () => {
  const makeLockedCells = (count: number): LockedCell[] =>
    Array.from({ length: count }, (_, i) => ({
      position: { row: i, col: 0 },
      conditions: [{
        type: 'row-complete' as const,
        target: i,
        description: `${i + 1}행을 완성하세요`,
      }],
    }));

  it('chainCount=0이면 체인 없이 반환한다', () => {
    const cells = makeLockedCells(5);
    const result = setupChainLinks(cells, 0);

    for (const lc of result) {
      expect(lc.chainUnlocks).toBeUndefined();
    }
  });

  it('요청된 수만큼 체인 링크를 생성한다', () => {
    const cells = makeLockedCells(5);
    const result = setupChainLinks(cells, 2);

    let totalChains = 0;
    for (const lc of result) {
      if (lc.chainUnlocks) {
        totalChains += lc.chainUnlocks.length;
      }
    }
    expect(totalChains).toBe(2);
  });

  it('셀이 2개 미만이면 체인을 생성하지 않는다', () => {
    const cells = makeLockedCells(1);
    const result = setupChainLinks(cells, 1);

    expect(result[0].chainUnlocks).toBeUndefined();
  });

  it('체인 타겟은 중복되지 않는다', () => {
    const cells = makeLockedCells(6);
    const result = setupChainLinks(cells, 3);

    const allTargets: string[] = [];
    for (const lc of result) {
      if (lc.chainUnlocks) {
        for (const pos of lc.chainUnlocks) {
          allTargets.push(posKey(pos.row, pos.col));
        }
      }
    }

    const uniqueTargets = new Set(allTargets);
    expect(uniqueTargets.size).toBe(allTargets.length);
  });

  it('원본 배열을 수정하지 않는다', () => {
    const cells = makeLockedCells(4);
    const originalStr = JSON.stringify(cells);
    setupChainLinks(cells, 2);
    expect(JSON.stringify(cells)).toBe(originalStr);
  });

  it('체인 타겟이 된 셀은 소스가 되지 않는다 (단방향 트리)', () => {
    const cells = makeLockedCells(6);
    const result = setupChainLinks(cells, 3);

    // 모든 체인 타겟 수집
    const targets = new Set<string>();
    for (const lc of result) {
      if (lc.chainUnlocks) {
        for (const pos of lc.chainUnlocks) {
          targets.add(posKey(pos.row, pos.col));
        }
      }
    }

    // 소스(chainUnlocks가 있는 셀)가 타겟에 포함되지 않아야 함
    for (const lc of result) {
      if (lc.chainUnlocks && lc.chainUnlocks.length > 0) {
        const sourceKey = posKey(lc.position.row, lc.position.col);
        expect(targets.has(sourceKey)).toBe(false);
      }
    }
  });
});

// ─── findUnlockableCellsWithChain ───────────────────

describe('findUnlockableCellsWithChain', () => {
  it('체인이 없으면 findUnlockableCells와 동일하게 동작한다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));

    const lockedCells: LockedCell[] = [
      {
        position: { row: 2, col: 4 },
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
      },
    ];

    const withChain = findUnlockableCellsWithChain(grid, lockedCells);
    const without = findUnlockableCells(grid, lockedCells);

    expect(withChain.length).toBe(without.length);
  });

  it('조건 충족된 셀의 체인 타겟도 해제된다', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
    // grid[2][4]=4, 5는 grid에 9개(모두 배치됨)

    const lockedCells: LockedCell[] = [
      {
        position: { row: 2, col: 4 }, // 4가 들어있음 (5 아님)
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
        chainUnlocks: [{ row: 3, col: 0 }], // 체인 타겟
      },
      {
        position: { row: 3, col: 0 },
        conditions: [{
          type: 'row-complete',
          target: 8, // 9행 — 완성 여부 상관없이 체인으로 해제
          description: '9행을 완성하세요',
        }],
      },
    ];

    const unlockable = findUnlockableCellsWithChain(grid, lockedCells);

    // (2,4)는 number-complete(5) 조건 충족 → 해제
    // (3,0)은 (2,4)의 체인 타겟 → 연쇄 해제
    expect(unlockable).toHaveLength(2);
    const keys = unlockable.map((lc) => posKey(lc.position.row, lc.position.col));
    expect(keys).toContain(posKey(2, 4));
    expect(keys).toContain(posKey(3, 0));
  });

  it('조건 미충족 셀의 체인 타겟은 해제되지 않는다', () => {
    const solution = createTestSolution();
    // 5를 하나 제거하여 number-complete(5) 미충족
    const puzzle = createTestPuzzle(solution, [[0, 0]]);

    const lockedCells: LockedCell[] = [
      {
        position: { row: 2, col: 4 },
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
        chainUnlocks: [{ row: 3, col: 0 }],
      },
      {
        position: { row: 3, col: 0 },
        conditions: [{
          type: 'row-complete',
          target: 0,
          description: '1행을 완성하세요',
        }],
      },
    ];

    const unlockable = findUnlockableCellsWithChain(puzzle, lockedCells);
    // 5가 8개뿐 → number-complete 미충족 → 체인도 작동 안 함
    expect(unlockable).toHaveLength(0);
  });

  it('다단계 연쇄 해제가 동작한다 (A→B→C)', () => {
    const solution = createTestSolution();
    const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));

    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 1 }, // solution[0][1]=3
        conditions: [{
          type: 'number-complete',
          target: 7, // 7은 grid에 9개 → 충족
          description: '숫자 7을(를) 모두 배치하세요',
        }],
        chainUnlocks: [{ row: 1, col: 0 }], // A → B
      },
      {
        position: { row: 1, col: 0 }, // B
        conditions: [{
          type: 'row-complete',
          target: 8, // 조건 자체는 미충족 가능하지만 체인으로 해제
          description: '9행을 완성하세요',
        }],
        chainUnlocks: [{ row: 2, col: 0 }], // B → C
      },
      {
        position: { row: 2, col: 0 }, // C
        conditions: [{
          type: 'row-complete',
          target: 7,
          description: '8행을 완성하세요',
        }],
      },
    ];

    const unlockable = findUnlockableCellsWithChain(grid, lockedCells);

    // A 조건 충족 → A 해제 → B 체인 해제 → C 체인 해제
    expect(unlockable).toHaveLength(3);
  });

  it('빈 목록이면 빈 결과를 반환한다', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    const unlockable = findUnlockableCellsWithChain(grid, []);
    expect(unlockable).toHaveLength(0);
  });
});
