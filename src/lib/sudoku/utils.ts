/**
 * 스도쿠 엔진 공통 유틸리티
 * generator, solver, lockSystem 등에서 공통으로 사용하는 함수들.
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

import type { Grid, Digit } from '@/types/game';

/** 보드 크기 */
export const BOARD_SIZE = 9;

/** 3×3 박스 크기 */
export const BOX_SIZE = 3;

/** 유효한 숫자 목록 */
export const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Grid를 깊은 복사한다.
 */
export const cloneGrid = (grid: Grid): Grid =>
  grid.map((row) => [...row]);

/**
 * 배열을 Fisher-Yates 알고리즘으로 셔플한다 (불변 — 새 배열 반환).
 */
export const shuffle = <T>(arr: readonly T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Position을 문자열 키로 변환한다.
 */
export const posKey = (row: number, col: number): string => `${row},${col}`;

/**
 * 특정 위치에 숫자를 놓을 수 있는지 검사한다 (Grid 타입용, null=빈칸).
 */
export const canPlaceInGrid = (
  grid: Grid,
  row: number,
  col: number,
  num: Digit,
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
 * 특정 위치에 숫자를 놓을 수 있는지 검사한다 (number[][] 타입용, 0=빈칸).
 * generator의 내부 그리드용.
 */
export const canPlaceInNumberGrid = (
  grid: number[][],
  row: number,
  col: number,
  num: number,
): boolean => {
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (grid[row][c] === num) return false;
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (grid[r][col] === num) return false;
  }
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
 * 셀이 속한 3×3 박스 인덱스를 반환한다.
 */
export const getBoxIndex = (row: number, col: number): number =>
  Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);
