import { describe, it, expect } from 'vitest';
import {
  checkDeadlock,
  hasChainCycle,
} from '@/lib/sudoku/lockSystem';
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

// ─── hasChainCycle ──────────────────────────────────

describe('hasChainCycle', () => {
  it('체인이 없으면 순환 없음', () => {
    const cells: LockedCell[] = [
      { position: { row: 0, col: 0 }, conditions: [] },
      { position: { row: 1, col: 0 }, conditions: [] },
    ];
    expect(hasChainCycle(cells)).toBe(false);
  });

  it('단방향 체인은 순환 없음 (A→B)', () => {
    const cells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 1, col: 0 }],
      },
      { position: { row: 1, col: 0 }, conditions: [] },
    ];
    expect(hasChainCycle(cells)).toBe(false);
  });

  it('다단계 체인은 순환 없음 (A→B→C)', () => {
    const cells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 1, col: 0 }],
      },
      {
        position: { row: 1, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 2, col: 0 }],
      },
      { position: { row: 2, col: 0 }, conditions: [] },
    ];
    expect(hasChainCycle(cells)).toBe(false);
  });

  it('양방향 체인은 순환 (A→B, B→A)', () => {
    const cells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 1, col: 0 }],
      },
      {
        position: { row: 1, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 0, col: 0 }],
      },
    ];
    expect(hasChainCycle(cells)).toBe(true);
  });

  it('간접 순환 (A→B→C→A)', () => {
    const cells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 1, col: 0 }],
      },
      {
        position: { row: 1, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 2, col: 0 }],
      },
      {
        position: { row: 2, col: 0 },
        conditions: [],
        chainUnlocks: [{ row: 0, col: 0 }],
      },
    ];
    expect(hasChainCycle(cells)).toBe(true);
  });

  it('빈 목록은 순환 없음', () => {
    expect(hasChainCycle([])).toBe(false);
  });
});

// ─── checkDeadlock ──────────────────────────────────

describe('checkDeadlock', () => {
  it('잠금 칸이 없으면 데드락 없음', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [[0, 0], [0, 1]]);

    const result = checkDeadlock(puzzle, solution, []);
    expect(result.hasDeadlock).toBe(false);
  });

  it('단순 영역 조건은 데드락 없음', () => {
    const solution = createTestSolution();
    // 0행에서 몇 개 비우기
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], // row 0에 빈 칸
      [1, 0], // 잠금 대상
    ]);

    const lockedCells: LockedCell[] = [
      {
        position: { row: 1, col: 0 },
        conditions: [{
          type: 'row-complete',
          target: 0, // 0행 완성 시 해제
          description: '1행을 완성하세요',
        }],
      },
    ];

    // 플레이어가 (0,0), (0,1), (0,2)를 채우면 0행 완성 → 잠금 해제
    const result = checkDeadlock(puzzle, solution, lockedCells);
    expect(result.hasDeadlock).toBe(false);
  });

  it('같은 영역의 두 잠금 칸도 데드락 없음 (lockedKeys 제외)', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
    ]);

    // 두 셀 모두 row 0 완성 조건
    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [{
          type: 'row-complete',
          target: 0,
          description: '1행을 완성하세요',
        }],
      },
      {
        position: { row: 0, col: 1 },
        conditions: [{
          type: 'row-complete',
          target: 0,
          description: '1행을 완성하세요',
        }],
      },
    ];

    // (0,2), (0,3), (0,4) 채우면 → row 0의 비잠금 빈칸 모두 채워짐 → 둘 다 해제
    const result = checkDeadlock(puzzle, solution, lockedCells);
    expect(result.hasDeadlock).toBe(false);
  });

  it('점진적 해제: A 해제 후 B의 조건이 충족된다', () => {
    const solution = createTestSolution();
    // A=(0,0) row-complete(1)로 해제, B=(1,0) row-complete(0)으로 해제
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], // row 0 빈 칸
      [1, 0], [1, 1],         // row 1 빈 칸
    ]);

    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [{
          type: 'row-complete',
          target: 1, // row 1 완성 시 해제
          description: '2행을 완성하세요',
        }],
      },
      {
        position: { row: 1, col: 0 },
        conditions: [{
          type: 'row-complete',
          target: 0, // row 0 완성 시 해제
          description: '1행을 완성하세요',
        }],
      },
    ];

    // Wave 1: row 1의 비잠금 빈칸=(1,1) 채움 → row-complete(1) 충족 → (0,0) 해제
    // Wave 2: (0,0) 해제됨 → row 0 비잠금 빈칸=(0,1),(0,2) 채움 → row-complete(0) 충족 → (1,0) 해제
    const result = checkDeadlock(puzzle, solution, lockedCells);
    expect(result.hasDeadlock).toBe(false);
  });

  it('자기 숫자가 조건 대상이면 데드락 (number-complete 자기참조)', () => {
    const solution = createTestSolution();
    // (3,1)=5를 잠금, number-complete(5) 조건 → 카운트에서 자신 제외 → 최대 8 → 불충족
    const puzzle = createTestPuzzle(solution, [[3, 1]]);

    const lockedCells: LockedCell[] = [
      {
        position: { row: 3, col: 1 },
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
      },
    ];

    const result = checkDeadlock(puzzle, solution, lockedCells);
    expect(result.hasDeadlock).toBe(true);
  });

  it('해제 불가능한 number-complete는 데드락', () => {
    const solution = createTestSolution();
    // (0,0)=5를 잠금, 조건: number-complete(5)
    // 5가 다른 잠금 셀에도 있고 그 셀은 해제 불가 → 5가 9개 안 됨
    const puzzle = createTestPuzzle(solution, [
      [0, 0], // 5
      [3, 1], // 5
    ]);

    // 두 셀 모두 number-complete(5) 조건
    // 서로 잠겨있어서 5는 최대 7개(9-2) → 어느 쪽도 조건 충족 불가
    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
      },
      {
        position: { row: 3, col: 1 },
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
      },
    ];

    const result = checkDeadlock(puzzle, solution, lockedCells);
    expect(result.hasDeadlock).toBe(true);
    expect(result.involvedCells).toHaveLength(2);
    expect(result.reason).toContain('해제 불가능');
  });

  it('체인으로 연결되면 데드락이 해소된다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [
      [0, 0], [0, 1], [0, 2], // 빈 칸
      [3, 1], // 잠금: solution=5
    ]);

    // (0,0)은 row-complete(0)으로 해제 가능
    // (3,1)은 number-complete(5)인데, (0,0)=5가 잠겨있어 직접 해제 불가
    // → (0,0)이 체인으로 (3,1)을 해제
    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [{
          type: 'row-complete',
          target: 0,
          description: '1행을 완성하세요',
        }],
        chainUnlocks: [{ row: 3, col: 1 }],
      },
      {
        position: { row: 3, col: 1 },
        conditions: [{
          type: 'number-complete',
          target: 5,
          description: '숫자 5을(를) 모두 배치하세요',
        }],
      },
    ];

    const result = checkDeadlock(puzzle, solution, lockedCells);
    expect(result.hasDeadlock).toBe(false);
  });

  it('순환 체인은 데드락이다', () => {
    const solution = createTestSolution();
    const puzzle = createTestPuzzle(solution, [[0, 0], [1, 0]]);

    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [{
          type: 'number-complete',
          target: 9, // 아마 해제 불가
          description: '숫자 9을(를) 모두 배치하세요',
        }],
        chainUnlocks: [{ row: 1, col: 0 }],
      },
      {
        position: { row: 1, col: 0 },
        conditions: [{
          type: 'number-complete',
          target: 9,
          description: '숫자 9을(를) 모두 배치하세요',
        }],
        chainUnlocks: [{ row: 0, col: 0 }],
      },
    ];

    const result = checkDeadlock(puzzle, solution, lockedCells);
    expect(result.hasDeadlock).toBe(true);
    expect(result.reason).toContain('순환');
  });

  it('복합 조건 중 하나라도 충족 불가이면 데드락', () => {
    const solution = createTestSolution();
    // (0,0)=5 잠금, (3,1)=5 잠금
    const puzzle = createTestPuzzle(solution, [[0, 0], [3, 1]]);

    // (0,0): row-complete(0) + number-complete(5) 복합
    // row-complete(0)은 충족 가능 (빈칸 없음)
    // 하지만 number-complete(5)는 (3,1)도 잠겨있어 7개 뿐 → 미충족
    // → (0,0) 해제 불가 → (3,1)도 해제 불가
    const lockedCells: LockedCell[] = [
      {
        position: { row: 0, col: 0 },
        conditions: [
          { type: 'row-complete', target: 0, description: '1행을 완성하세요' },
          { type: 'number-complete', target: 5, description: '숫자 5을(를) 모두 배치하세요' },
        ],
      },
      {
        position: { row: 3, col: 1 },
        conditions: [{
          type: 'row-complete',
          target: 3,
          description: '4행을 완성하세요',
        }],
      },
    ];

    const result = checkDeadlock(puzzle, solution, lockedCells);
    // (0,0)은 number-complete(5) 때문에 해제 불가 (5가 7개)
    // (3,1)은 row-complete(3)이고 row 3에 빈칸이 (3,1) 자체뿐 → 비잠금 빈칸 0 → 충족 가능
    // → (3,1) 먼저 해제 → 5가 8개
    // → (0,0)의 number-complete(5): 8 < 9 → 여전히 미충족
    expect(result.hasDeadlock).toBe(true);
    expect(result.involvedCells?.length).toBe(1);
  });
});

// ─── checkDeadlock with generated puzzles ───────────

describe('checkDeadlock — 생성 기반', () => {
  it('placeLocks로 생성된 잠금은 데드락이 없다', async () => {
    const { generateSolution } = await import('@/lib/sudoku/generator');
    const { createPuzzleFromSolution } = await import('@/lib/sudoku/solver');
    const { placeLocks } = await import('@/lib/sudoku/lockSystem');

    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const lockResult = placeLocks(
      puzzle, solution, 3,
      ['row-complete', 'col-complete', 'box-complete', 'number-complete'],
      { allowComposite: true, allowChain: true },
    );

    const deadlock = checkDeadlock(puzzle, solution, lockResult.lockedCells);
    expect(deadlock.hasDeadlock).toBe(false);
  }, 15000);
});
