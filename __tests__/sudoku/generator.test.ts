import { describe, it, expect } from 'vitest';
import {
  generateSolution,
  isValidSolution,
  createEmptyGrid,
  fillGrid,
  BOARD_SIZE,
} from '@/lib/sudoku/generator';
import { shuffle, canPlaceInNumberGrid as canPlace } from '@/lib/sudoku/utils';
import type { SolutionGrid } from '@/types/game';

describe('generator', () => {
  describe('shuffle', () => {
    it('셔플된 배열은 원본과 같은 길이를 가진다', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result).toHaveLength(arr.length);
    });

    it('셔플된 배열은 원본과 같은 요소를 가진다', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const result = shuffle(arr);
      expect(result.sort()).toEqual(arr.sort());
    });

    it('원본 배열을 수정하지 않는다 (불변성)', () => {
      const arr = [1, 2, 3, 4, 5];
      const copy = [...arr];
      shuffle(arr);
      expect(arr).toEqual(copy);
    });
  });

  describe('createEmptyGrid', () => {
    it('9×9 빈 그리드를 생성한다', () => {
      const grid = createEmptyGrid();
      expect(grid).toHaveLength(BOARD_SIZE);
      for (const row of grid) {
        expect(row).toHaveLength(BOARD_SIZE);
        expect(row.every((v) => v === 0)).toBe(true);
      }
    });
  });

  describe('canPlace', () => {
    it('빈 그리드에서 아무 숫자나 놓을 수 있다', () => {
      const grid = createEmptyGrid();
      expect(canPlace(grid, 0, 0, 1)).toBe(true);
      expect(canPlace(grid, 4, 4, 5)).toBe(true);
    });

    it('같은 행에 같은 숫자를 놓을 수 없다', () => {
      const grid = createEmptyGrid();
      grid[0][0] = 5;
      expect(canPlace(grid, 0, 8, 5)).toBe(false);
    });

    it('같은 열에 같은 숫자를 놓을 수 없다', () => {
      const grid = createEmptyGrid();
      grid[0][0] = 3;
      expect(canPlace(grid, 8, 0, 3)).toBe(false);
    });

    it('같은 3×3 박스에 같은 숫자를 놓을 수 없다', () => {
      const grid = createEmptyGrid();
      grid[0][0] = 7;
      expect(canPlace(grid, 1, 1, 7)).toBe(false);
      expect(canPlace(grid, 2, 2, 7)).toBe(false);
    });

    it('다른 행/열/박스에 같은 숫자를 놓을 수 있다', () => {
      const grid = createEmptyGrid();
      grid[0][0] = 1;
      // 다른 행, 다른 열, 다른 박스
      expect(canPlace(grid, 3, 3, 1)).toBe(true);
    });
  });

  describe('fillGrid', () => {
    it('빈 그리드를 완성할 수 있다', () => {
      const grid = createEmptyGrid();
      const result = fillGrid(grid);
      expect(result).toBe(true);
    });

    it('완성된 그리드의 모든 셀이 1~9 값을 가진다', () => {
      const grid = createEmptyGrid();
      fillGrid(grid);
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          expect(grid[r][c]).toBeGreaterThanOrEqual(1);
          expect(grid[r][c]).toBeLessThanOrEqual(9);
        }
      }
    });
  });

  describe('generateSolution', () => {
    it('유효한 9×9 솔루션을 생성한다', () => {
      const solution = generateSolution();
      expect(solution).toHaveLength(BOARD_SIZE);
      for (const row of solution) {
        expect(row).toHaveLength(BOARD_SIZE);
      }
      expect(isValidSolution(solution)).toBe(true);
    });

    it('매번 다른 솔루션을 생성한다 (랜덤성)', () => {
      const s1 = generateSolution();
      const s2 = generateSolution();
      // 같을 확률이 극히 낮으므로 다름을 확인
      const isSame = s1.every((row, r) =>
        row.every((val, c) => val === s2[r][c]),
      );
      expect(isSame).toBe(false);
    });

    it('생성 성능: 1초 이내에 완료된다', () => {
      const start = Date.now();
      generateSolution();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('연속 10회 생성 모두 유효하다', () => {
      for (let i = 0; i < 10; i++) {
        const solution = generateSolution();
        expect(isValidSolution(solution)).toBe(true);
      }
    });
  });

  describe('isValidSolution', () => {
    it('유효한 솔루션을 유효하다고 판별한다', () => {
      const solution = generateSolution();
      expect(isValidSolution(solution)).toBe(true);
    });

    it('행에 중복이 있으면 유효하지 않다', () => {
      const solution = generateSolution();
      const invalid: SolutionGrid = solution.map((row) => [...row]);
      // 첫 행의 0,1번째 값을 같게 만듦
      invalid[0][1] = invalid[0][0];
      expect(isValidSolution(invalid)).toBe(false);
    });

    it('크기가 맞지 않으면 유효하지 않다', () => {
      const invalid = [[1, 2, 3]] as unknown as SolutionGrid;
      expect(isValidSolution(invalid)).toBe(false);
    });

    it('범위 밖의 숫자가 있으면 유효하지 않다', () => {
      const solution = generateSolution();
      const invalid = solution.map((row) => [...row]) as unknown as SolutionGrid;
      (invalid[0][0] as number) = 0;
      expect(isValidSolution(invalid)).toBe(false);
    });
  });
});
