/**
 * 스도쿠 퍼즐 풀이기 (Solver)
 * 백트래킹 + MCV 휴리스틱으로 퍼즐을 풀고 유일해를 검증한다.
 *
 * @description
 * 1. MCV(Most Constrained Variable) 휴리스틱: 후보가 가장 적은 셀부터 탐색
 * 2. 유일해 검증: 2개 이상의 해가 발견되면 즉시 중단
 * 3. 퍼즐 생성 시 빈 칸을 제거하면서 유일해 보장에 사용
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

import type { CellValue, Digit, Grid, SolutionGrid, SolveResult } from '@/types/game';
import { BOARD_SIZE, BOX_SIZE, DIGITS } from '@/lib/sudoku/generator';

// ─── 내부 유틸 ──────────────────────────────────────

/**
 * Grid를 깊은 복사한다.
 */
const cloneGrid = (grid: Grid): Grid =>
  grid.map((row) => [...row]);

/**
 * 특정 위치에 숫자를 놓을 수 있는지 검사한다. (Grid 타입용)
 *
 * @todo generator.ts의 canPlace와 로직 중복 — 추후 공통 유틸로 통합 예정
 *       (현재는 Grid(CellValue[][]) vs number[][] 타입 차이로 분리)
 */
const canPlaceInGrid = (
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
 * 특정 셀의 후보 숫자 목록을 구한다.
 */
const getCandidates = (grid: Grid, row: number, col: number): Digit[] => {
  const candidates: Digit[] = [];
  for (const d of DIGITS) {
    if (canPlaceInGrid(grid, row, col, d)) {
      candidates.push(d);
    }
  }
  return candidates;
};

/**
 * MCV 휴리스틱: 후보가 가장 적은 빈 셀을 찾는다.
 * 후보가 0개인 셀이 있으면 즉시 null 반환 (백트래킹 필요).
 *
 * @returns [row, col, candidates] 또는 null(빈 셀 없음 = 완성) 또는 'dead-end'
 */
const findMostConstrainedCell = (
  grid: Grid,
): [number, number, Digit[]] | null | 'dead-end' => {
  let bestRow = -1;
  let bestCol = -1;
  let bestCandidates: Digit[] = [];
  let minCandidates = 10;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (grid[row][col] !== null) continue;

      const candidates = getCandidates(grid, row, col);

      if (candidates.length === 0) return 'dead-end';

      if (candidates.length < minCandidates) {
        minCandidates = candidates.length;
        bestRow = row;
        bestCol = col;
        bestCandidates = candidates;

        if (minCandidates === 1) break; // 최적: 후보 1개면 바로 선택
      }
    }
    if (minCandidates === 1) break;
  }

  if (bestRow === -1) return null; // 빈 셀 없음 → 완성

  return [bestRow, bestCol, bestCandidates];
};

// ─── 사전 검증 ──────────────────────────────────────

/**
 * 그리드에 이미 존재하는 값들 사이에 모순이 있는지 검사한다.
 * 행/열/3×3 박스에 같은 숫자가 중복되면 즉시 false 반환.
 * 백트래킹 전에 호출하여 명백한 모순을 빠르게 걸러낸다.
 *
 * @param grid - 검사할 그리드
 * @returns 모순이 없으면 true, 있으면 false
 */
const hasNoConflicts = (grid: Grid): boolean => {
  // 행 검사
  for (let r = 0; r < BOARD_SIZE; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < BOARD_SIZE; c++) {
      const val = grid[r][c];
      if (val === null) continue;
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // 열 검사
  for (let c = 0; c < BOARD_SIZE; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      const val = grid[r][c];
      if (val === null) continue;
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // 3×3 박스 검사
  for (let boxRow = 0; boxRow < BOARD_SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < BOARD_SIZE; boxCol += BOX_SIZE) {
      const seen = new Set<number>();
      for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
          const val = grid[r][c];
          if (val === null) continue;
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }

  return true;
};

// ─── 풀이 함수 ──────────────────────────────────────

/**
 * MCV + 백트래킹으로 퍼즐을 풀이한다.
 *
 * @param grid - 풀이할 그리드 (in-place 수정)
 * @returns 풀이 성공 여부
 */
const solveBacktrack = (grid: Grid): boolean => {
  const result = findMostConstrainedCell(grid);

  if (result === null) return true; // 완성
  if (result === 'dead-end') return false; // 막다른 길

  const [row, col, candidates] = result;

  for (const num of candidates) {
    grid[row][col] = num;
    if (solveBacktrack(grid)) return true;
    grid[row][col] = null;
  }

  return false;
};

/**
 * 퍼즐을 풀이하여 해를 반환한다.
 *
 * @param puzzle - 풀이할 퍼즐 (빈 칸은 null)
 * @returns SolveResult — 풀이 성공 시 SolutionGrid 포함
 *
 * @example
 * ```ts
 * const result = solve(puzzle);
 * if (result.solved) {
 *   console.log(result.grid); // 완성된 SolutionGrid
 * }
 * ```
 */
export const solve = (puzzle: Grid): SolveResult => {
  const grid = cloneGrid(puzzle);

  // 사전 모순 검출: 기존 값끼리 충돌하면 즉시 실패
  if (!hasNoConflicts(grid)) {
    return { solved: false, grid, solutionCount: 0 };
  }

  const solved = solveBacktrack(grid);

  if (solved) {
    return {
      solved: true,
      grid: grid as SolutionGrid,
      solutionCount: 1,
    };
  }

  return {
    solved: false,
    grid,
    solutionCount: 0,
  };
};

// ─── 유일해 검증 ────────────────────────────────────

/**
 * 해의 개수를 센다 (최대 maxCount까지만 탐색).
 *
 * @param grid - 풀이할 그리드 (in-place 수정 — 호출자가 복사 담당)
 * @param count - 현재까지 발견된 해 수 (참조 객체)
 * @param maxCount - 이 수 이상 발견되면 탐색 중단
 */
const countSolutions = (
  grid: Grid,
  count: { value: number },
  maxCount: number,
): void => {
  if (count.value >= maxCount) return;

  const result = findMostConstrainedCell(grid);

  if (result === null) {
    count.value++;
    return;
  }
  if (result === 'dead-end') return;

  const [row, col, candidates] = result;

  for (const num of candidates) {
    if (count.value >= maxCount) return;

    grid[row][col] = num;
    countSolutions(grid, count, maxCount);
    grid[row][col] = null;
  }
};

/**
 * 퍼즐이 유일해를 가지는지 검증한다.
 *
 * @param puzzle - 검증할 퍼즐 (빈 칸은 null)
 * @returns true면 유일해, false면 해 없음 또는 복수해
 *
 * @example
 * ```ts
 * if (hasUniqueSolution(puzzle)) {
 *   console.log('유일해 보장됨');
 * }
 * ```
 */
export const hasUniqueSolution = (puzzle: Grid): boolean => {
  const grid = cloneGrid(puzzle);

  // 사전 모순 검출
  if (!hasNoConflicts(grid)) return false;

  const count = { value: 0 };
  countSolutions(grid, count, 2);

  return count.value === 1;
};

/**
 * 퍼즐의 해 개수를 센다 (최대 maxCount까지).
 *
 * @param puzzle - 검증할 퍼즐
 * @param maxCount - 최대 탐색 개수 (기본 2 — 유일해 검증용)
 * @returns 발견된 해 개수 (maxCount 이상이면 maxCount 반환)
 */
export const countPuzzleSolutions = (puzzle: Grid, maxCount: number = 2): number => {
  const grid = cloneGrid(puzzle);

  // 사전 모순 검출
  if (!hasNoConflicts(grid)) return 0;

  const count = { value: 0 };
  countSolutions(grid, count, maxCount);

  return count.value;
};

// ─── 퍼즐 생성 보조 ─────────────────────────────────

/**
 * 완성된 솔루션에서 빈 칸을 만들어 퍼즐을 생성한다.
 * 유일해를 보장하면서 지정된 수만큼 셀을 제거한다.
 *
 * @param solution - 완성된 솔루션 그리드
 * @param emptyCellCount - 제거할 셀 수
 * @returns 유일해가 보장된 퍼즐 그리드
 *
 * @example
 * ```ts
 * const solution = generateSolution();
 * const puzzle = createPuzzleFromSolution(solution, 40);
 * // puzzle에는 최대 40개의 null 셀이 있고, 유일해가 보장됨
 * ```
 */
export const createPuzzleFromSolution = (
  solution: SolutionGrid,
  emptyCellCount: number,
): Grid => {
  const puzzle: Grid = solution.map((row) => row.map((v) => v as CellValue));

  // 모든 셀 위치를 셔플하여 랜덤 순서로 제거 시도
  const positions: [number, number][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push([row, col]);
    }
  }

  // Fisher-Yates 셔플
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let removed = 0;

  for (const [row, col] of positions) {
    if (removed >= emptyCellCount) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = null;

    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return puzzle;
};

/**
 * @internal 테스트 전용 export — 외부에서 직접 사용 금지
 */
export { cloneGrid, canPlaceInGrid, getCandidates, findMostConstrainedCell, countSolutions, hasNoConflicts };
