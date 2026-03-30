import { describe, it, expect } from 'vitest';
import {
  solve,
  hasUniqueSolution,
  countPuzzleSolutions,
  hasNoConflicts,
} from '@/lib/sudoku/solver';
import { generateSolution, isValidSolution } from '@/lib/sudoku/generator';
import type { Grid } from '@/types/game';

// ─── solve ──────────────────────────────────────────

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

  it('행 내 중복 → 사전 검증으로 즉시 실패', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 1;
    grid[0][1] = 1;
    const result = solve(grid);
    expect(result.solved).toBe(false);
    expect(result.solutionCount).toBe(0);
  });

  it('열 내 중복 → 즉시 실패', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 5;
    grid[3][0] = 5;
    const result = solve(grid);
    expect(result.solved).toBe(false);
  });

  it('3×3 박스 내 중복 → 즉시 실패', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 7;
    grid[2][2] = 7;
    const result = solve(grid);
    expect(result.solved).toBe(false);
  });
});

// ─── hasNoConflicts ─────────────────────────────────

describe('hasNoConflicts', () => {
  it('빈 그리드는 모순 없음', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    expect(hasNoConflicts(grid)).toBe(true);
  });

  it('유효한 솔루션은 모순 없음', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    expect(hasNoConflicts(grid)).toBe(true);
  });

  it('행 중복 감지', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[3][0] = 4;
    grid[3][5] = 4;
    expect(hasNoConflicts(grid)).toBe(false);
  });

  it('열 중복 감지', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[1][7] = 9;
    grid[8][7] = 9;
    expect(hasNoConflicts(grid)).toBe(false);
  });

  it('박스 중복 감지', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[6][6] = 2;
    grid[8][8] = 2;
    expect(hasNoConflicts(grid)).toBe(false);
  });
});

// ─── hasUniqueSolution ──────────────────────────────

describe('hasUniqueSolution', () => {
  it('빈 칸 1개 → true', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null;
    expect(hasUniqueSolution(grid)).toBe(true);
  });

  it('모순 있는 퍼즐 → false', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 1;
    grid[0][1] = 1;
    expect(hasUniqueSolution(grid)).toBe(false);
  });
});

// ─── countPuzzleSolutions ───────────────────────────

describe('countPuzzleSolutions', () => {
  it('모순 → 0', () => {
    const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(null));
    grid[0][0] = 1;
    grid[0][1] = 1;
    expect(countPuzzleSolutions(grid, 2)).toBe(0);
  });

  it('빈 칸 1개 → 1', () => {
    const solution = generateSolution();
    const grid: Grid = solution.map((row) => [...row]);
    grid[0][0] = null;
    expect(countPuzzleSolutions(grid, 2)).toBe(1);
  });
});
