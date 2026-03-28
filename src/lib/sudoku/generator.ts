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

/** 유효한 숫자 목록 */
const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 보드 크기 */
const BOARD_SIZE = 9;

/** 3×3 박스 크기 */
const BOX_SIZE = 3;

/**
 * 배열을 Fisher-Yates 알고리즘으로 셔플한다 (불변 — 새 배열 반환).
 */
const shuffle = <T>(arr: readonly T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 특정 위치에 숫자를 놓을 수 있는지 검사한다.
 *
 * @param grid - 현재 그리드 (number[][] — 0은 빈 칸)
 * @param row - 행 인덱스 (0~8)
 * @param col - 열 인덱스 (0~8)
 * @param num - 놓으려는 숫자 (1~9)
 * @returns 배치 가능 여부
 */
const canPlace = (
  grid: number[][],
  row: number,
  col: number,
  num: number,
): boolean => {
  // 행 검사
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (grid[row][c] === num) return false;
  }

  // 열 검사
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (grid[r][col] === num) return false;
  }

  // 3×3 박스 검사
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true;
};

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
        if (canPlace(grid, row, col, num)) {
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
 *
 * @param grid - 완성된 그리드 (1~9만 포함)
 * @returns SolutionGrid 타입의 그리드
 * @throws 유효하지 않은 값이 있으면 에러
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
  // 크기 검사
  if (grid.length !== BOARD_SIZE) return false;
  for (const row of grid) {
    if (row.length !== BOARD_SIZE) return false;
  }

  // 행 검사
  for (let r = 0; r < BOARD_SIZE; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < BOARD_SIZE; c++) {
      const val = grid[r][c];
      if (val < 1 || val > 9 || seen.has(val)) return false;
      seen.add(val);
    }
  }

  // 열 검사
  for (let c = 0; c < BOARD_SIZE; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      const val = grid[r][c];
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // 3×3 박스 검사
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
export { canPlace, shuffle, createEmptyGrid, fillGrid, BOARD_SIZE, BOX_SIZE, DIGITS };
