import { describe, it, expect } from 'vitest';
import {
  placeAreaLocks,
} from '@/lib/sudoku/lockSystem';
import { posKey } from '@/lib/sudoku/utils';
import { generateSolution } from '@/lib/sudoku/generator';
import { createPuzzleFromSolution, hasUniqueSolution } from '@/lib/sudoku/solver';

// ─── placeAreaLocks with number-complete ─────────────
// 생성 기반 통합 테스트 (시간이 걸릴 수 있으므로 별도 파일)

describe('placeAreaLocks — number-complete', () => {
  it('number-complete만 허용하면 숫자 조건만 생성된다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeAreaLocks(puzzle, solution, 2, ['number-complete']);

    for (const lc of result.lockedCells) {
      for (const cond of lc.conditions) {
        expect(cond.type).toBe('number-complete');
      }
    }
  }, 15000);

  it('영역+숫자 혼합 허용 시 잠금 칸이 배치된다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 40);
    const allowed = ['row-complete', 'col-complete', 'box-complete', 'number-complete'] as const;
    const result = placeAreaLocks(puzzle, solution, 3, [...allowed]);

    // 최소 1개 이상 배치
    expect(result.lockedCells.length).toBeGreaterThanOrEqual(1);
    expect(result.lockedCells.length).toBeLessThanOrEqual(3);
  }, 15000);

  it('숫자 조건의 target은 1~9이다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeAreaLocks(puzzle, solution, 3, ['number-complete']);

    for (const lc of result.lockedCells) {
      for (const cond of lc.conditions) {
        expect(cond.target).toBeGreaterThanOrEqual(1);
        expect(cond.target).toBeLessThanOrEqual(9);
      }
    }
  }, 15000);

  it('잠금 포함 퍼즐이 여전히 유일해를 가진다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);
    const result = placeAreaLocks(
      puzzle, solution, 2, ['number-complete'],
    );

    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  }, 15000);

  it('잠금 칸끼리 위치가 중복되지 않는다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 40);
    const result = placeAreaLocks(
      puzzle, solution, 3, ['row-complete', 'col-complete', 'box-complete', 'number-complete'],
    );

    const keys = result.lockedCells.map((lc) => posKey(lc.position.row, lc.position.col));
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  }, 15000);

  it('조건 설명이 비어있지 않다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeAreaLocks(
      puzzle, solution, 2, ['number-complete'],
    );

    for (const lc of result.lockedCells) {
      for (const cond of lc.conditions) {
        expect(cond.description.length).toBeGreaterThan(0);
      }
    }
  }, 15000);
});
