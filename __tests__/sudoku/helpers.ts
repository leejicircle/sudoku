/**
 * 스도쿠 엔진 테스트 공통 헬퍼
 * 여러 테스트 파일에서 재사용하는 고정 데이터와 유틸리티.
 */

import type { Board, Cell, Digit, SolutionGrid, Grid, LockedCell } from '@/types/game';

// ─── 고정 솔루션 ────────────────────────────────────

/** 테스트용 고정 솔루션 (유효한 9×9 완성 보드) */
export const TEST_SOLUTION: SolutionGrid = [
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

// ─── 팩토리 함수 ────────────────────────────────────

/** 고정 솔루션의 깊은 복사본을 반환한다 */
export const createTestSolution = (): SolutionGrid =>
  TEST_SOLUTION.map((row) => [...row]) as SolutionGrid;

/** 지정된 위치를 빈 칸으로 만든 퍼즐을 생성한다 */
export const createTestPuzzle = (
  solution: SolutionGrid,
  emptyPositions: [number, number][],
): Grid => {
  const grid: Grid = solution.map((row) => row.map((v) => v as Digit | null));
  for (const [r, c] of emptyPositions) {
    grid[r][c] = null;
  }
  return grid;
};

/** 단일 Cell 객체를 생성한다 */
export const makeCell = (
  value: Digit | null,
  overrides?: Partial<Cell>,
): Cell => ({
  value,
  isGiven: false,
  notes: new Set<Digit>(),
  isError: false,
  isLocked: false,
  ...overrides,
});

/** 빈 9×9 Board를 생성한다 */
export const makeEmptyBoard = (): Board =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => makeCell(null)),
  );

/** 고정 솔루션으로 채운 Board를 생성한다 */
export const makeSolvedBoard = (): Board =>
  TEST_SOLUTION.map((row) =>
    row.map((v) => makeCell(v, { isGiven: true })),
  );

/** 빈 9×9 Grid를 생성한다 */
export const makeEmptyGrid = (): Grid =>
  Array.from({ length: 9 }, () => Array(9).fill(null));

/** 퍼즐의 빈 칸 수를 센다 */
export const countEmpty = (grid: Grid): number =>
  grid.flat().filter((v) => v === null).length;

/** LockedCell 객체를 간편하게 생성한다 */
export const makeLockedCell = (
  row: number,
  col: number,
  conditions: LockedCell['conditions'],
  chainUnlocks?: LockedCell['chainUnlocks'],
): LockedCell => ({
  position: { row, col },
  conditions,
  ...(chainUnlocks ? { chainUnlocks } : {}),
});
