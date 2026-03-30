/**
 * 잠금 칸 시스템 — 영역 조건 + 숫자 조건
 * 특정 영역 완성 또는 숫자 완성 시 잠금 칸이 해제되는 시스템을 구현한다.
 *
 * @description
 * 1. 영역 조건: row-complete, col-complete, box-complete
 * 2. 숫자 조건: number-complete (특정 숫자 9개 모두 배치)
 * 3. 잠금 칸은 빈 칸 중에서 선택하여 조건을 부여
 * 4. 잠금 포함 상태에서도 퍼즐이 풀이 가능해야 함
 * 5. 순수 함수 — 사이드 이펙트 없음
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

import type {
  Grid,
  SolutionGrid,
  Position,
  LockedCell,
  LockCondition,
  LockConditionType,
  CellValue,
  Digit,
} from '@/types/game';
import { BOARD_SIZE, BOX_SIZE, DIGITS, cloneGrid, shuffle, posKey, getBoxIndex } from '@/lib/sudoku/utils';
import { hasUniqueSolution } from '@/lib/sudoku/solver';

// ─── 영역 조회 ──────────────────────────────────────

/**
 * 특정 행의 모든 셀 위치를 반환한다.
 */
const getRowPositions = (row: number): Position[] =>
  Array.from({ length: BOARD_SIZE }, (_, c) => ({ row, col: c }));

/**
 * 특정 열의 모든 셀 위치를 반환한다.
 */
const getColPositions = (col: number): Position[] =>
  Array.from({ length: BOARD_SIZE }, (_, r) => ({ row: r, col }));

/**
 * 특정 3×3 박스의 모든 셀 위치를 반환한다.
 * @param boxIndex - 박스 인덱스 (0~8, 좌→우 상→하)
 */
const getBoxPositions = (boxIndex: number): Position[] => {
  const boxRow = Math.floor(boxIndex / BOX_SIZE) * BOX_SIZE;
  const boxCol = (boxIndex % BOX_SIZE) * BOX_SIZE;
  const positions: Position[] = [];
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      positions.push({ row: r, col: c });
    }
  }
  return positions;
};

/**
 * 조건 유형에 따른 영역 셀 위치를 반환한다.
 */
const getAreaPositions = (
  type: 'row-complete' | 'col-complete' | 'box-complete',
  target: number,
): Position[] => {
  switch (type) {
    case 'row-complete': return getRowPositions(target);
    case 'col-complete': return getColPositions(target);
    case 'box-complete': return getBoxPositions(target);
  }
};

// ─── 조건 평가 ──────────────────────────────────────

/**
 * 영역의 빈 칸 수를 센다 (잠금 칸 제외).
 */
const countEmptyInArea = (
  grid: Grid,
  positions: Position[],
  lockedKeys: Set<string>,
): number => {
  let count = 0;
  for (const pos of positions) {
    if (grid[pos.row][pos.col] === null && !lockedKeys.has(posKey(pos.row, pos.col))) {
      count++;
    }
  }
  return count;
};

/**
 * 영역 조건이 충족되었는지 검사한다.
 * 해당 영역의 모든 빈 칸(잠금 칸 제외)이 채워졌으면 true.
 *
 * @param grid - 현재 보드 상태
 * @param condition - 검사할 조건
 * @param lockedKeys - 현재 잠겨 있는 셀 키 Set
 * @returns 조건 충족 여부
 */
export const isAreaConditionMet = (
  grid: Grid,
  condition: LockCondition,
  lockedKeys: Set<string>,
): boolean => {
  const { type, target } = condition;

  if (type === 'number-complete') {
    return isNumberConditionMet(grid, target as Digit, lockedKeys);
  }

  if (type !== 'row-complete' && type !== 'col-complete' && type !== 'box-complete') {
    return false; // 미지원 조건 유형
  }

  const positions = getAreaPositions(type, target);
  return countEmptyInArea(grid, positions, lockedKeys) === 0;
};

// ─── 숫자 조건 평가 ─────────────────────────────────

/**
 * 보드에서 특정 숫자가 나타나야 할 총 횟수(9) 대비 현재 채워진 수를 센다.
 * 잠금 칸은 제외한다.
 *
 * @param grid - 현재 보드
 * @param digit - 대상 숫자 (1~9)
 * @param lockedKeys - 잠금 칸 키 Set
 * @returns 해당 숫자가 채워진 횟수 (잠금 칸 제외)
 */
export const countDigitPlacements = (
  grid: Grid,
  digit: Digit,
  lockedKeys: Set<string>,
): number => {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (lockedKeys.has(posKey(r, c))) continue;
      if (grid[r][c] === digit) count++;
    }
  }
  return count;
};

/**
 * 숫자 완성 조건이 충족되었는지 검사한다.
 * 특정 숫자가 보드에 9번 모두 배치되면(잠금 칸 제외) true.
 *
 * @param grid - 현재 보드 상태
 * @param digit - 대상 숫자
 * @param lockedKeys - 잠금 칸 키 Set
 * @returns 조건 충족 여부
 */
export const isNumberConditionMet = (
  grid: Grid,
  digit: Digit,
  lockedKeys: Set<string>,
): boolean => {
  return countDigitPlacements(grid, digit, lockedKeys) >= BOARD_SIZE;
};

/**
 * 특정 위치에 대해 유효한 숫자 조건을 생성한다.
 * 잠금 칸이 가진 정답 숫자가 아닌, 보드에 아직 완성되지 않은 다른 숫자를 조건으로 선택.
 *
 * @param grid - 퍼즐 그리드
 * @param pos - 잠금 칸 위치
 * @param solution - 정답 그리드
 * @param lockedKeys - 이미 잠긴 셀 키 Set
 * @returns 유효한 숫자 조건 또는 null
 */
export const generateNumberCondition = (
  grid: Grid,
  pos: Position,
  solution: SolutionGrid,
  lockedKeys: Set<string>,
): LockCondition | null => {
  const updatedLockedKeys = new Set(lockedKeys);
  updatedLockedKeys.add(posKey(pos.row, pos.col));

  // 아직 보드에 9개 미만인 숫자 후보를 수집
  const candidates: Digit[] = [];
  for (const d of DIGITS) {
    const placed = countDigitPlacements(grid, d, updatedLockedKeys);
    // 이미 완성된 숫자는 제외, 최소 1개 이상 채워진 숫자만 선택 (너무 어렵지 않게)
    if (placed >= 1 && placed < BOARD_SIZE) {
      candidates.push(d);
    }
  }

  if (candidates.length === 0) return null;

  const digit = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    type: 'number-complete',
    target: digit,
    description: createConditionDescription('number-complete', digit),
  };
};

/**
 * 잠금 칸 목록에서 현재 해제 가능한 셀들을 찾는다.
 * 모든 조건이 충족된 잠금 칸을 반환한다.
 *
 * @param grid - 현재 보드 상태
 * @param lockedCells - 잠금 칸 목록
 * @returns 해제 가능한 잠금 칸들
 */
export const findUnlockableCells = (
  grid: Grid,
  lockedCells: LockedCell[],
): LockedCell[] => {
  const lockedKeys = new Set(
    lockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
  );

  return lockedCells.filter((lc) =>
    lc.conditions.every((cond) => isAreaConditionMet(grid, cond, lockedKeys)),
  );
};

// ─── 조건 생성 ──────────────────────────────────────

/** 영역 조건 유형 목록 */
const AREA_LOCK_TYPES: LockConditionType[] = ['row-complete', 'col-complete', 'box-complete'];

/**
 * 조건 설명 문자열을 생성한다.
 */
const createConditionDescription = (type: LockConditionType, target: number): string => {
  switch (type) {
    case 'row-complete': return `${target + 1}행을 완성하세요`;
    case 'col-complete': return `${target + 1}열을 완성하세요`;
    case 'box-complete': {
      const boxRow = Math.floor(target / 3) + 1;
      const boxCol = (target % 3) + 1;
      return `${boxRow}-${boxCol} 박스를 완성하세요`;
    }
    case 'number-complete': return `숫자 ${target}을(를) 모두 배치하세요`;
    default: return '';
  }
};

/**
 * 특정 위치에 대해 유효한 조건을 생성한다 (영역 + 숫자 조건 통합).
 * 허용된 유형 중에서 유효한 조건을 랜덤 선택.
 *
 * @param grid - 퍼즐 그리드
 * @param pos - 잠금 칸 위치
 * @param lockedKeys - 이미 잠긴 셀 키 Set
 * @param allowedTypes - 허용된 조건 유형
 * @param solution - 정답 그리드 (number-complete 조건 생성 시 필요)
 * @returns 유효한 조건 또는 null
 */
export const generateCondition = (
  grid: Grid,
  pos: Position,
  lockedKeys: Set<string>,
  allowedTypes: LockConditionType[],
  solution?: SolutionGrid,
): LockCondition | null => {
  const candidates: LockCondition[] = [];

  // 이 셀을 잠금 후보로 추가
  const updatedLockedKeys = new Set(lockedKeys);
  updatedLockedKeys.add(posKey(pos.row, pos.col));

  // 영역 조건 후보
  const areaTypes = allowedTypes.filter(
    (t): t is 'row-complete' | 'col-complete' | 'box-complete' => AREA_LOCK_TYPES.includes(t),
  );

  for (const type of areaTypes) {
    let target: number;
    switch (type) {
      case 'row-complete': target = pos.row; break;
      case 'col-complete': target = pos.col; break;
      case 'box-complete': target = getBoxIndex(pos.row, pos.col); break;
    }

    const positions = getAreaPositions(type, target);
    const emptyCount = countEmptyInArea(grid, positions, updatedLockedKeys);

    if (emptyCount >= 1) {
      candidates.push({
        type,
        target,
        description: createConditionDescription(type, target),
      });
    }
  }

  // 숫자 조건 후보
  if (allowedTypes.includes('number-complete') && solution) {
    for (const d of DIGITS) {
      const placed = countDigitPlacements(grid, d, updatedLockedKeys);
      if (placed >= 1 && placed < BOARD_SIZE) {
        candidates.push({
          type: 'number-complete',
          target: d,
          description: createConditionDescription('number-complete', d),
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * @deprecated generateCondition으로 대체. 하위 호환용.
 */
export const generateAreaCondition = (
  grid: Grid,
  pos: Position,
  lockedKeys: Set<string>,
  allowedTypes: LockConditionType[],
): LockCondition | null => {
  return generateCondition(grid, pos, lockedKeys, allowedTypes);
};

// ─── 풀이 가능성 검증 ───────────────────────────────

/**
 * 잠금 칸 포함 상태에서 퍼즐이 풀이 가능한지 검증한다.
 *
 * 검증 전략:
 * 잠금 칸의 정답값을 given으로 넣은 그리드를 만들고,
 * 나머지 빈 칸(플레이어가 채울 칸)이 유일해를 가지는지 확인.
 * → 유일해가 있으면 플레이어가 모든 빈 칸을 채울 수 있고,
 *   빈 칸이 채워지면 영역 조건이 충족되어 잠금 칸이 해제된다.
 *
 * @param puzzle - 퍼즐 그리드
 * @param solution - 정답 그리드
 * @param lockedCells - 잠금 칸 목록
 * @returns 풀이 가능 여부
 */
export const validateSolvabilityWithLocks = (
  puzzle: Grid,
  solution: SolutionGrid,
  lockedCells: LockedCell[],
): boolean => {
  if (lockedCells.length === 0) return true;

  // 잠금 칸의 정답값을 given으로 넣은 테스트 그리드
  // → 플레이어 관점: 잠금 칸은 "언젠가 공개될 값"
  // → 이 값을 미리 넣으면 나머지 빈 칸이 풀리는지 확인 가능
  const testGrid = cloneGrid(puzzle);

  for (const lc of lockedCells) {
    const { row, col } = lc.position;
    testGrid[row][col] = solution[row][col] as CellValue;
  }

  // 나머지 빈 칸이 유일해를 가지는지 확인
  return hasUniqueSolution(testGrid);
};

// ─── 잠금 배치 ──────────────────────────────────────

/**
 * 잠금 칸 배치 결과
 */
export interface LockPlacementResult {
  /** 배치된 잠금 칸 정보 */
  lockedCells: LockedCell[];
  /** 잠금 칸이 반영된 퍼즐 (잠금 칸은 null로 유지) */
  puzzle: Grid;
}

/**
 * 퍼즐에 영역 조건 기반 잠금 칸을 배치한다.
 * 잠금 포함 상태에서 풀이 가능성을 검증한다.
 *
 * @param puzzle - 원본 퍼즐 (빈 칸 포함)
 * @param solution - 정답 그리드
 * @param count - 배치할 잠금 칸 수
 * @param allowedTypes - 허용된 조건 유형
 * @returns 잠금 배치 결과 (잠금 칸 목록 + 검증된 퍼즐)
 *
 * @example
 * ```ts
 * const result = placeAreaLocks(puzzle, solution, 3, ['row-complete', 'col-complete', 'box-complete']);
 * console.log(result.lockedCells.length); // 최대 3
 * ```
 */
export const placeAreaLocks = (
  puzzle: Grid,
  solution: SolutionGrid,
  count: number,
  allowedTypes: LockConditionType[],
): LockPlacementResult => {
  if (count <= 0) {
    return { lockedCells: [], puzzle: cloneGrid(puzzle) };
  }

  // 빈 칸 위치 수집 + 셔플
  const emptyPositions: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (puzzle[r][c] === null) {
        emptyPositions.push({ row: r, col: c });
      }
    }
  }
  const shuffled = shuffle(emptyPositions);

  const lockedCells: LockedCell[] = [];
  const lockedKeys = new Set<string>();
  const workingPuzzle = cloneGrid(puzzle);

  for (const pos of shuffled) {
    if (lockedCells.length >= count) break;

    // 이 위치에 조건 생성 시도
    const condition = generateCondition(workingPuzzle, pos, lockedKeys, allowedTypes, solution);
    if (!condition) continue;

    // 잠금 추가
    const key = posKey(pos.row, pos.col);
    const candidateLocks = [...lockedCells, { position: pos, conditions: [condition] }];

    // 검증: 잠금 포함 상태에서 풀이 가능한지 확인
    if (validateSolvabilityWithLocks(workingPuzzle, solution, candidateLocks)) {
      lockedKeys.add(key);
      lockedCells.push({
        position: pos,
        conditions: [condition],
      });
    }
  }

  return {
    lockedCells,
    puzzle: workingPuzzle,
  };
};

/**
 * @internal 테스트 전용 export — 외부에서 직접 사용 금지
 * countDigitPlacements, isNumberConditionMet, generateNumberCondition은
 * 이미 export const로 선언되어 있으므로 여기에 중복하지 않음.
 */
export {
  getRowPositions,
  getColPositions,
  getBoxPositions,
  getAreaPositions,
  countEmptyInArea,
  createConditionDescription,
  AREA_LOCK_TYPES,
};
