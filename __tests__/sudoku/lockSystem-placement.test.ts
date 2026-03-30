import { describe, it, expect } from 'vitest';
import {
  placeAreaLocks,
  posKey,
} from '@/lib/sudoku/lockSystem';
import { generateSolution } from '@/lib/sudoku/generator';
import { createPuzzleFromSolution, hasUniqueSolution } from '@/lib/sudoku/solver';

// ─── placeAreaLocks ─────────────────────────────────
// 배치 테스트는 시간이 걸릴 수 있으므로 별도 파일

describe('placeAreaLocks', () => {
  it('count=0이면 빈 잠금 목록을 반환한다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);
    const result = placeAreaLocks(puzzle, solution, 0, ['row-complete']);
    expect(result.lockedCells).toHaveLength(0);
  }, 10000);

  it('요청된 수만큼 잠금 칸을 배치한다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeAreaLocks(
      puzzle, solution, 2, ['row-complete', 'col-complete', 'box-complete'],
    );
    // 최대 2개 배치 (조건에 따라 그보다 적을 수 있음)
    expect(result.lockedCells.length).toBeGreaterThanOrEqual(1);
    expect(result.lockedCells.length).toBeLessThanOrEqual(2);
  }, 15000);

  it('잠금 칸의 위치가 원래 빈 칸이다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeAreaLocks(
      puzzle, solution, 3, ['row-complete', 'col-complete', 'box-complete'],
    );

    for (const lc of result.lockedCells) {
      const { row, col } = lc.position;
      // 원래 퍼즐에서 빈 칸이었어야 함
      expect(puzzle[row][col]).toBeNull();
    }
  }, 15000);

  it('잠금 칸의 조건 유형이 허용된 유형이다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const allowed = ['row-complete', 'col-complete', 'box-complete'] as const;
    const result = placeAreaLocks(puzzle, solution, 3, [...allowed]);

    for (const lc of result.lockedCells) {
      for (const cond of lc.conditions) {
        expect(allowed).toContain(cond.type);
      }
    }
  }, 15000);

  it('잠금 포함 퍼즐이 여전히 유일해를 가진다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);
    const result = placeAreaLocks(
      puzzle, solution, 2, ['row-complete', 'col-complete', 'box-complete'],
    );

    // 원본 퍼즐은 변경되지 않음 (잠금 칸은 여전히 null)
    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  }, 15000);

  it('잠금 칸끼리 위치가 중복되지 않는다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 40);
    const result = placeAreaLocks(
      puzzle, solution, 3, ['row-complete', 'col-complete', 'box-complete'],
    );

    const keys = result.lockedCells.map((lc) => posKey(lc.position.row, lc.position.col));
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  }, 15000);

  it('조건 설명이 비어있지 않다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeAreaLocks(
      puzzle, solution, 2, ['row-complete', 'col-complete', 'box-complete'],
    );

    for (const lc of result.lockedCells) {
      for (const cond of lc.conditions) {
        expect(cond.description.length).toBeGreaterThan(0);
      }
    }
  }, 15000);

  it('row-complete만 허용하면 행 조건만 생성된다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeAreaLocks(puzzle, solution, 2, ['row-complete']);

    for (const lc of result.lockedCells) {
      expect(lc.conditions[0].type).toBe('row-complete');
    }
  }, 15000);
});
