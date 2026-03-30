import { describe, it, expect } from 'vitest';
import { solve, hasUniqueSolution, countPuzzleSolutions } from '@/lib/sudoku/solver';
import { generateSolution, isValidSolution } from '@/lib/sudoku/generator';
import type { Grid } from '@/types/game';

describe('solve', () => {
  it('2개 빈 칸 퍼즐을 풀 수 있다', () => {
    const solution = generateSolution();
    const puzzle: Grid = solution.map((row) => [...row]);
    puzzle[0][0] = null;
    puzzle[4][4] = null;
    const result = solve(puzzle);
    expect(result.solved).toBe(true);
    if (result.solved) {
      expect(result.grid[0][0]).toBe(solution[0][0]);
      expect(isValidSolution(result.grid)).toBe(true);
    }
  });

  it('완성된 그리드도 처리한다', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    expect(solve(grid).solved).toBe(true);
  });

  it('풀이 불가능한 퍼즐 → solved: false', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 1;
    grid[0][1] = 1;
    expect(solve(grid).solved).toBe(false);
  });
});

describe('hasUniqueSolution', () => {
  it('빈 칸 1개 → true', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null;
    expect(hasUniqueSolution(grid)).toBe(true);
  });
});

describe('countPuzzleSolutions', () => {
  it('모순 → 0', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 1;
    grid[0][1] = 1;
    expect(countPuzzleSolutions(grid, 2)).toBe(0);
  });
});
