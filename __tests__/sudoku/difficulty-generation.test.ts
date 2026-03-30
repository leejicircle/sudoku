import { describe, it, expect } from 'vitest';
import { generatePuzzle } from '@/lib/sudoku/difficulty';
import { hasUniqueSolution } from '@/lib/sudoku/solver';
import { isValidSolution } from '@/lib/sudoku/generator';
import type { CellValue } from '@/types/game';

// ─── generatePuzzle ─────────────────────────────────
// 퍼즐 생성은 시간이 걸리므로 별도 파일로 분리

/** 퍼즐의 빈 칸 수를 센다 */
const countEmpty = (puzzle: CellValue[][]): number =>
  puzzle.flat().filter((v: CellValue) => v === null).length;

describe('generatePuzzle', () => {
  it('스테이지 1 퍼즐이 유효하다', () => {
    const result = generatePuzzle(1);

    // 정답이 유효한 솔루션인지 확인
    expect(isValidSolution(result.solution)).toBe(true);

    // 퍼즐에 빈 칸이 있는지 확인
    const emptyCells = countEmpty(result.puzzle);
    expect(emptyCells).toBe(result.config.emptyCells);

    // 스테이지 설정이 올바른지 확인
    expect(result.config.stage).toBe(1);
  }, 10000);

  it('스테이지 1 퍼즐은 유일해를 가진다', () => {
    const result = generatePuzzle(1);
    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  }, 10000);

  it('스테이지 5 퍼즐의 빈 칸 수가 범위 내이다', () => {
    const result = generatePuzzle(5);
    const emptyCells = countEmpty(result.puzzle);
    expect(emptyCells).toBeGreaterThanOrEqual(28);
    expect(emptyCells).toBeLessThanOrEqual(37);
  }, 10000);

  it('스테이지 10 퍼즐의 빈 칸이 기존 숫자와 일치한다', () => {
    const result = generatePuzzle(10);

    // 빈 칸이 아닌 셀의 값이 정답과 일치하는지 확인
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = result.puzzle[r][c];
        if (val !== null) {
          expect(val).toBe(result.solution[r][c]);
        }
      }
    }
  }, 10000);

  it('스테이지 1~10 퍼즐에는 잠금 칸이 없다', () => {
    const result = generatePuzzle(5);
    expect(result.lockedCells).toHaveLength(0);
  }, 10000);

  it('스테이지 15 퍼즐이 잠금 칸을 포함한다', () => {
    const result = generatePuzzle(15);
    expect(result.config.lockedCellCount).toBeGreaterThanOrEqual(1);
    expect(result.config.lockedCellCount).toBeLessThanOrEqual(3);

    // 잠금 칸이 실제로 배치됨
    expect(result.lockedCells.length).toBeGreaterThanOrEqual(1);
    expect(result.lockedCells.length).toBeLessThanOrEqual(result.config.lockedCellCount);

    const emptyCells = countEmpty(result.puzzle);
    expect(emptyCells).toBeGreaterThanOrEqual(38);
    expect(emptyCells).toBeLessThanOrEqual(43);
  }, 15000);

  it('스테이지 15 잠금 칸의 위치가 빈 칸이다', () => {
    const result = generatePuzzle(15);
    for (const lc of result.lockedCells) {
      expect(result.puzzle[lc.position.row][lc.position.col]).toBeNull();
    }
  }, 15000);

  it('높은 난이도(스테이지 25) 퍼즐도 유일해를 가진다', () => {
    const result = generatePuzzle(25);
    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  }, 30000);

  it('생성된 퍼즐과 정답의 크기가 9x9이다', () => {
    const result = generatePuzzle(3);
    expect(result.puzzle).toHaveLength(9);
    expect(result.solution).toHaveLength(9);
    result.puzzle.forEach((row: CellValue[]) => expect(row).toHaveLength(9));
    result.solution.forEach((row: number[]) => expect(row).toHaveLength(9));
  }, 10000);
});
