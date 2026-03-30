/**
 * 스도쿠 엔진 통합 테스트
 * 생성 → 풀이 → 난이도 → 잠금 → 검증의 전체 파이프라인을 E2E로 검증.
 */

import { describe, it, expect } from 'vitest';
import { generatePuzzle, getStageConfig } from '@/lib/sudoku/difficulty';
import { generateSolution, isValidSolution } from '@/lib/sudoku/generator';
import { solve, hasUniqueSolution, createPuzzleFromSolution } from '@/lib/sudoku/solver';
import { findUnlockableCellsWithChain, checkDeadlock } from '@/lib/sudoku/lockSystem';
import {
  createBoardFromPuzzle,
  updateBoardErrors,
  isGameComplete,
  boardToGrid,
} from '@/lib/sudoku/validator';
import { posKey } from '@/lib/sudoku/utils';
import type { Digit, Grid, Board, Cell } from '@/types/game';
import { countEmpty } from './helpers';

// ─── 전체 파이프라인 ────────────────────────────────

describe('전체 파이프라인: 생성 → 풀이 → 완성', () => {
  it('생성된 퍼즐을 정답으로 채우면 게임이 완료된다', () => {
    const result = generatePuzzle(1);
    const board = createBoardFromPuzzle(result.puzzle, result.lockedCells);

    // 빈 셀을 정답으로 채움
    const filledBoard: Board = board.map((row, r) =>
      row.map((cell, c): Cell => {
        if (cell.value === null) {
          return { ...cell, value: result.solution[r][c], notes: new Set() };
        }
        return { ...cell, notes: new Set(cell.notes) };
      }),
    );

    expect(isGameComplete(filledBoard, result.solution)).toBe(true);
  }, 10000);

  it('생성된 퍼즐은 유일해를 가진다', () => {
    const result = generatePuzzle(5);
    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  }, 10000);

  it('풀이 결과가 원래 정답과 일치한다', () => {
    const result = generatePuzzle(3);
    const solveResult = solve(result.puzzle);

    expect(solveResult.solved).toBe(true);
    if (solveResult.solved) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(solveResult.grid[r][c]).toBe(result.solution[r][c]);
        }
      }
    }
  }, 10000);

  it('충돌 검증이 정답 보드에서 에러를 표시하지 않는다', () => {
    const result = generatePuzzle(1);
    const board = createBoardFromPuzzle(result.puzzle, []);

    // 정답으로 모두 채움
    const filledBoard: Board = board.map((row, r) =>
      row.map((cell, c): Cell => ({
        ...cell,
        value: result.solution[r][c],
        notes: new Set(),
      })),
    );

    const validated = updateBoardErrors(filledBoard);
    for (const row of validated) {
      for (const cell of row) {
        expect(cell.isError).toBe(false);
      }
    }
  }, 10000);
});

// ─── 50 스테이지 전수 검사 ──────────────────────────

describe('50 스테이지 전수 검사', () => {
  // 구간 대표 스테이지: 경계값 + 중간값
  const REPRESENTATIVE_STAGES = [1, 5, 10, 11, 15, 20, 21, 25, 30, 31, 35, 40, 41, 45, 50];

  it.each(REPRESENTATIVE_STAGES)(
    '스테이지 %d — 유효한 퍼즐 생성',
    (stage) => {
      const result = generatePuzzle(stage);
      const config = getStageConfig(stage);

      // 정답이 유효한 솔루션
      expect(isValidSolution(result.solution)).toBe(true);

      // 빈 칸 수가 설정 범위 내 (유일해 보장으로 요청값 이하일 수 있음)
      const empty = countEmpty(result.puzzle);
      expect(empty).toBeLessThanOrEqual(config.emptyCells);
      expect(empty).toBeGreaterThan(0);

      // 비어있지 않은 셀이 정답과 일치
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (result.puzzle[r][c] !== null) {
            expect(result.puzzle[r][c]).toBe(result.solution[r][c]);
          }
        }
      }

      // 잠금 칸이 빈 칸에 위치
      for (const lc of result.lockedCells) {
        expect(result.puzzle[lc.position.row][lc.position.col]).toBeNull();
      }
    },
    30000,
  );

  it('입문 구간(1~10)은 잠금 칸이 없다', () => {
    for (const stage of [1, 5, 10]) {
      const result = generatePuzzle(stage);
      expect(result.lockedCells).toHaveLength(0);
    }
  }, 30000);

  it('초급 이상(11+)은 잠금 칸이 있다', () => {
    for (const stage of [15, 25, 35, 45]) {
      const result = generatePuzzle(stage);
      expect(result.lockedCells.length).toBeGreaterThanOrEqual(1);
    }
  }, 60000);

  it('마스터 구간(41~50)의 잠금 칸에 조건이 존재한다', () => {
    const result = generatePuzzle(45);
    for (const lc of result.lockedCells) {
      expect(lc.conditions.length).toBeGreaterThanOrEqual(1);
      for (const cond of lc.conditions) {
        expect(cond.description.length).toBeGreaterThan(0);
      }
    }
  }, 30000);
});

// ─── 잠금 해제 E2E ──────────────────────────────────

describe('잠금 해제 E2E', () => {
  it('잠금 포함 퍼즐에서 조건 충족 시 잠금이 해제된다', () => {
    const result = generatePuzzle(15);
    if (result.lockedCells.length === 0) return; // 잠금 없으면 스킵

    // 정답으로 모두 채운 Grid
    const fullGrid: Grid = result.solution.map((row) =>
      row.map((v) => v as Digit | null),
    );

    // 완전히 채운 상태에서 모든 잠금이 해제 가능해야 함
    const unlockable = findUnlockableCellsWithChain(fullGrid, result.lockedCells);
    expect(unlockable.length).toBe(result.lockedCells.length);
  }, 15000);

  it('잠금 포함 퍼즐에 데드락이 없다', () => {
    const result = generatePuzzle(25);
    if (result.lockedCells.length === 0) return;

    const deadlock = checkDeadlock(result.puzzle, result.solution, result.lockedCells);
    expect(deadlock.hasDeadlock).toBe(false);
  }, 30000);

  it('고난도(스테이지 35) 잠금 포함 퍼즐에 데드락이 없다', () => {
    const result = generatePuzzle(35);
    if (result.lockedCells.length === 0) return;

    const deadlock = checkDeadlock(result.puzzle, result.solution, result.lockedCells);
    expect(deadlock.hasDeadlock).toBe(false);
  }, 30000);

  it('마스터(스테이지 45) 연쇄 잠금 퍼즐에 데드락이 없다', () => {
    const result = generatePuzzle(45);
    if (result.lockedCells.length === 0) return;

    const deadlock = checkDeadlock(result.puzzle, result.solution, result.lockedCells);
    expect(deadlock.hasDeadlock).toBe(false);
  }, 30000);

  it('잠금 포함 퍼즐에서 점진적 해제가 동작한다', () => {
    const result = generatePuzzle(20);
    if (result.lockedCells.length === 0) return;

    // 비잠금 빈 칸만 정답으로 채움
    const lockedKeys = new Set(
      result.lockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
    );

    const partialGrid: Grid = result.puzzle.map((row, r) =>
      row.map((val, c) => {
        if (val === null && !lockedKeys.has(posKey(r, c))) {
          return result.solution[r][c]; // 비잠금 빈 칸만 채움
        }
        return val;
      }),
    );

    // 비잠금 빈 칸을 모두 채운 후 일부 잠금이 해제되어야 함
    const unlockable = findUnlockableCellsWithChain(partialGrid, result.lockedCells);
    expect(unlockable.length).toBeGreaterThanOrEqual(1);
  }, 15000);
});

// ─── Board ↔ Grid 왕복 ──────────────────────────────

describe('Board ↔ Grid 변환 왕복', () => {
  it('puzzle → Board → Grid 왕복 시 값이 보존된다', () => {
    const result = generatePuzzle(5);
    const board = createBoardFromPuzzle(result.puzzle, result.lockedCells);
    const grid = boardToGrid(board);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(grid[r][c]).toBe(result.puzzle[r][c]);
      }
    }
  }, 10000);

  it('잠금 셀이 Board에 올바르게 반영된다', () => {
    const result = generatePuzzle(15);
    const board = createBoardFromPuzzle(result.puzzle, result.lockedCells);

    const lockedKeys = new Set(
      result.lockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
    );

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (lockedKeys.has(posKey(r, c))) {
          expect(board[r][c].isLocked).toBe(true);
          expect(board[r][c].isGiven).toBe(false);
          expect(board[r][c].value).toBeNull();
        }
      }
    }
  }, 15000);
});

// ─── 성능 ───────────────────────────────────────────

describe('성능', () => {
  it('입문 퍼즐(스테이지 1) 생성이 1초 이내', () => {
    const start = Date.now();
    generatePuzzle(1);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('중급 퍼즐(스테이지 25) 생성이 5초 이내', () => {
    const start = Date.now();
    generatePuzzle(25);
    expect(Date.now() - start).toBeLessThan(5000);
  }, 10000);

  it('마스터 퍼즐(스테이지 45) 생성이 10초 이내', () => {
    const start = Date.now();
    generatePuzzle(45);
    expect(Date.now() - start).toBeLessThan(10000);
  }, 15000);

  it('솔루션 생성 10회가 1초 이내', () => {
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      generateSolution();
    }
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it('풀이(solve)가 500ms 이내', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 45);
    const start = Date.now();
    solve(puzzle);
    expect(Date.now() - start).toBeLessThan(500);
  }, 10000);
});
