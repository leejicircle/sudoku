import { describe, it, expect } from 'vitest';
import {
  createPuzzleFromSolution,
  hasUniqueSolution,
  solve,
} from '@/lib/sudoku/solver';
import { generateSolution, isValidSolution } from '@/lib/sudoku/generator';

// ─── createPuzzleFromSolution ───────────────────────
// 퍼즐 생성은 시간이 걸리므로 별도 파일로 분리

describe('createPuzzleFromSolution', () => {
  it('생성된 퍼즐이 유일해를 가진다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);
    expect(hasUniqueSolution(puzzle)).toBe(true);
  }, 15000);

  it('제거된 셀 수가 요청값 이하이다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);
    const emptyCells = puzzle.flat().filter((v) => v === null).length;
    // 유일해 보장 때문에 요청값보다 적을 수 있음
    expect(emptyCells).toBeLessThanOrEqual(30);
    expect(emptyCells).toBeGreaterThan(0);
  }, 15000);

  it('빈 칸이 아닌 셀의 값이 원래 솔루션과 일치한다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 25);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== null) {
          expect(puzzle[r][c]).toBe(solution[r][c]);
        }
      }
    }
  }, 15000);

  it('풀이 결과가 원래 솔루션과 일치한다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 20);
    const result = solve(puzzle);

    expect(result.solved).toBe(true);
    if (result.solved) {
      expect(isValidSolution(result.grid)).toBe(true);
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(result.grid[r][c]).toBe(solution[r][c]);
        }
      }
    }
  }, 15000);

  it('emptyCellCount=0이면 빈 칸 없음', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 0);
    const emptyCells = puzzle.flat().filter((v) => v === null).length;
    expect(emptyCells).toBe(0);
  }, 5000);

  it('매우 많은 빈 칸 요청 시 유일해 유지하며 최대한 제거', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 60);
    // 60개 요청했지만 유일해 보장 때문에 실제 제거 수는 60 이하
    const emptyCells = puzzle.flat().filter((v) => v === null).length;
    expect(emptyCells).toBeLessThanOrEqual(60);
    expect(hasUniqueSolution(puzzle)).toBe(true);
  }, 30000);
});
