/**
 * 스도쿠 퍼즐 생성기
 * 백트래킹 알고리즘으로 완성된 9×9 보드를 생성한다.
 *
 * @description
 * 1. 빈 그리드에서 시작하여 백트래킹으로 완성된 솔루션 생성
 * 2. 셔플을 통해 매번 다른 퍼즐 생성
 * 3. 순수 함수 — 사이드 이펙트 없음
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

import type { Digit, SolutionGrid } from '@/types/game';
import {
  BOARD_SIZE,
  BOX_SIZE,
  DIGITS,
  shuffle,
  canPlaceInNumberGrid,
} from '@/lib/sudoku/utils';

/**
 * 빈 9×9 그리드를 생성한다 (0으로 채움).
 */
const createEmptyGrid = (): number[][] =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

/**
 * 백트래킹으로 그리드를 완성한다 (in-place 수정).
 *
 * @param grid - 채울 그리드 (0은 빈 칸)
 * @returns 완성 성공 여부
 */
const fillGrid = (grid: number[][]): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (grid[row][col] !== 0) continue;

      const candidates = shuffle(DIGITS);
      for (const num of candidates) {
        if (canPlaceInNumberGrid(grid, row, col, num)) {
          grid[row][col] = num;
          if (fillGrid(grid)) return true;
          grid[row][col] = 0;
        }
      }
      return false; // 백트래킹
    }
  }
  return true; // 모든 셀 채움
};

/**
 * number[][] 그리드를 SolutionGrid(Digit[][])로 변환한다.
 */
const toSolutionGrid = (grid: number[][]): SolutionGrid => {
  return grid.map((row) =>
    row.map((val) => {
      if (val < 1 || val > 9) {
        throw new Error(`Invalid digit in grid: ${val}`);
      }
      return val as Digit;
    }),
  );
};

/**
 * 완성된 스도쿠 솔루션 그리드를 생성한다.
 *
 * @returns 유효한 9×9 완성 그리드 (SolutionGrid)
 *
 * @example
 * ```ts
 * const solution = generateSolution();
 * // solution[0] → [5, 3, 4, 6, 7, 8, 9, 1, 2] (예시)
 * ```
 */
export const generateSolution = (): SolutionGrid => {
  const grid = createEmptyGrid();
  const success = fillGrid(grid);

  if (!success) {
    throw new Error('Failed to generate a valid sudoku solution');
  }

  return toSolutionGrid(grid);
};

/**
 * 주어진 그리드가 유효한 스도쿠 솔루션인지 검증한다.
 *
 * @param grid - 검증할 9×9 그리드
 * @returns 유효 여부
 */
export const isValidSolution = (grid: SolutionGrid): boolean => {
  if (grid.length !== BOARD_SIZE) return false;
  for (const row of grid) {
    if (row.length !== BOARD_SIZE) return false;
  }

  for (let r = 0; r < BOARD_SIZE; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < BOARD_SIZE; c++) {
      const val = grid[r][c];
      if (val < 1 || val > 9 || seen.has(val)) return false;
      seen.add(val);
    }
  }

  for (let c = 0; c < BOARD_SIZE; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      const val = grid[r][c];
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < BOARD_SIZE; boxCol += BOX_SIZE) {
      const seen = new Set<number>();
      for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
          const val = grid[r][c];
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }

  return true;
};

/**
 * @internal 테스트 전용 export — 외부에서 직접 사용 금지
 * fillGrid는 grid를 in-place 수정하므로 주의 필요
 */
export { createEmptyGrid, fillGrid, BOARD_SIZE, BOX_SIZE, DIGITS };

/**
 * @deprecated 테스트 호환용 re-export — 새 코드에서는 utils에서 직접 import
 */
export { shuffle, canPlaceInNumberGrid as canPlace } from '@/lib/sudoku/utils';
