import { describe, it, expect } from 'vitest';
import {
  placeLocks,
} from '@/lib/sudoku/lockSystem';
import { posKey } from '@/lib/sudoku/utils';
import { generateSolution } from '@/lib/sudoku/generator';
import { createPuzzleFromSolution, hasUniqueSolution } from '@/lib/sudoku/solver';

// ─── placeLocks — 통합 잠금 배치 ─────────────────────
// 생성 기반 통합 테스트 (시간이 걸릴 수 있으므로 별도 파일)

describe('placeLocks — 단순 모드', () => {
  it('allowComposite=false이면 각 셀에 조건 1개만 부여된다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeLocks(
      puzzle, solution, 3,
      ['row-complete', 'col-complete', 'box-complete'],
      { allowComposite: false, allowChain: false },
    );

    for (const lc of result.lockedCells) {
      expect(lc.conditions).toHaveLength(1);
    }
  }, 15000);
});

describe('placeLocks — 복합 조건 모드', () => {
  it('allowComposite=true이면 일부 셀에 2개 조건이 부여된다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 40);
    const allTypes = ['row-complete', 'col-complete', 'box-complete', 'number-complete'] as const;

    // 여러 번 시도하여 복합 조건이 한 번이라도 나오는지 확인
    let gotComposite = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = placeLocks(
        puzzle, solution, 6, [...allTypes],
        { allowComposite: true, allowChain: false, compositeRatio: 0.5 },
      );
      if (result.lockedCells.some((lc) => lc.conditions.length >= 2)) {
        gotComposite = true;
        break;
      }
    }
    expect(gotComposite).toBe(true);
  }, 30000);

  it('복합 조건 포함 퍼즐이 여전히 유일해를 가진다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeLocks(
      puzzle, solution, 4,
      ['row-complete', 'col-complete', 'box-complete', 'number-complete'],
      { allowComposite: true, allowChain: false },
    );

    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  }, 15000);
});

describe('placeLocks — 연쇄 잠금 모드', () => {
  it('allowChain=true이면 체인 링크가 생성된다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 40);
    const allTypes = ['row-complete', 'col-complete', 'box-complete', 'number-complete'] as const;

    let hasChain = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = placeLocks(
        puzzle, solution, 6, [...allTypes],
        { allowComposite: true, allowChain: true, chainRatio: 0.5 },
      );
      if (result.lockedCells.some((lc) => lc.chainUnlocks && lc.chainUnlocks.length > 0)) {
        hasChain = true;
        break;
      }
    }
    expect(hasChain).toBe(true);
  }, 30000);

  it('잠금 칸 위치가 중복되지 않는다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 40);
    const result = placeLocks(
      puzzle, solution, 5,
      ['row-complete', 'col-complete', 'box-complete', 'number-complete'],
      { allowComposite: true, allowChain: true },
    );

    const keys = result.lockedCells.map((lc) => posKey(lc.position.row, lc.position.col));
    expect(new Set(keys).size).toBe(keys.length);
  }, 15000);

  it('체인 타겟은 실제 잠금 셀이다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 40);
    const result = placeLocks(
      puzzle, solution, 6,
      ['row-complete', 'col-complete', 'box-complete', 'number-complete'],
      { allowComposite: true, allowChain: true, chainRatio: 0.5 },
    );

    const lockedKeySet = new Set(
      result.lockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
    );

    for (const lc of result.lockedCells) {
      if (lc.chainUnlocks) {
        for (const target of lc.chainUnlocks) {
          expect(lockedKeySet.has(posKey(target.row, target.col))).toBe(true);
        }
      }
    }
  }, 15000);

  it('연쇄 포함 퍼즐이 여전히 유일해를 가진다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 35);
    const result = placeLocks(
      puzzle, solution, 5,
      ['row-complete', 'col-complete', 'box-complete', 'number-complete'],
      { allowComposite: true, allowChain: true },
    );

    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  }, 15000);

  it('count=0이면 빈 결과를 반환한다', () => {
    const solution = generateSolution();
    const puzzle = createPuzzleFromSolution(solution, 30);
    const result = placeLocks(
      puzzle, solution, 0,
      ['row-complete'],
      { allowComposite: false, allowChain: false },
    );

    expect(result.lockedCells).toHaveLength(0);
  }, 10000);
});
