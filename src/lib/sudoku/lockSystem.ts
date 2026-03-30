/**
 * 잠금 칸 시스템 — 영역 조건 + 숫자 조건 + 복합 조건 + 연쇄 잠금
 * 특정 영역/숫자 완성 시 잠금 칸이 해제되는 시스템을 구현한다.
 *
 * @description
 * 1. 영역 조건: row-complete, col-complete, box-complete
 * 2. 숫자 조건: number-complete (특정 숫자 9개 모두 배치)
 * 3. 복합 조건: 하나의 잠금 칸에 2개 이상의 조건 (모두 충족 시 해제)
 * 4. 연쇄 잠금: 셀 A 해제 시 연결된 셀 B도 함께 해제 (캐스케이드)
 * 5. 잠금 포함 상태에서도 퍼즐이 풀이 가능해야 함
 * 6. 순수 함수 — 사이드 이펙트 없음
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
  DeadlockCheckResult,
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
 * 숫자 조건 후보를 수집한다.
 * 보드에 1개 이상 배치되었지만 9개 미만인 숫자만 반환한다.
 * 보드에 아예 없는 숫자(0개)는 제외 — 완전히 빈 숫자를 조건으로 쓰면
 * 플레이어가 해당 숫자를 처음부터 전부 채워야 하므로 난이도 조절상 제외한다.
 *
 * 잠금 셀 자체의 정답 숫자는 제외한다 — 자기 숫자가 조건 대상이 되면
 * 카운트에서 자신이 제외되어 조건 충족이 불가능하다 (데드락 원인).
 *
 * @param grid - 퍼즐 그리드
 * @param lockedKeys - 잠금 칸 키 Set (해당 셀 포함)
 * @param excludeDigit - 제외할 숫자 (잠금 셀 자체의 정답 숫자)
 * @returns 후보 숫자 배열
 */
const getNumberConditionCandidates = (
  grid: Grid,
  lockedKeys: Set<string>,
  excludeDigit?: Digit,
): Digit[] => {
  const candidates: Digit[] = [];
  for (const d of DIGITS) {
    if (d === excludeDigit) continue; // 자기 숫자 제외 (데드락 방지)
    const placed = countDigitPlacements(grid, d, lockedKeys);
    if (placed >= 1 && placed < BOARD_SIZE) {
      candidates.push(d);
    }
  }
  return candidates;
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

  const selfDigit = solution[pos.row][pos.col] as Digit;
  const candidates = getNumberConditionCandidates(grid, updatedLockedKeys, selfDigit);
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
  if (allowedTypes.includes('number-complete')) {
    if (!solution) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[lockSystem] number-complete 조건 생성에는 solution 파라미터가 필요합니다.');
      }
    } else {
      const selfDigit = solution[pos.row][pos.col] as Digit;
      const numberCandidates = getNumberConditionCandidates(grid, updatedLockedKeys, selfDigit);
      for (const d of numberCandidates) {
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

// ─── 복합 조건 생성 ──────────────────────────────────

/**
 * 특정 위치에 대해 복합 조건(최대 2개)을 생성한다.
 * 서로 다른 유형(또는 같은 유형이라도 다른 target)의 조건 2개를 반환한다.
 *
 * 후보가 부족하면 1개만 반환할 수 있다 — 이는 의도적 동작이다.
 * 허용 유형이 제한적이거나 영역에 빈 칸이 부족하면 2개 확보가 불가능하므로,
 * 1개라도 유효한 조건을 반환하여 잠금 배치 자체는 진행되도록 한다.
 *
 * @param grid - 퍼즐 그리드
 * @param pos - 잠금 칸 위치
 * @param lockedKeys - 이미 잠긴 셀 키 Set
 * @param allowedTypes - 허용된 조건 유형
 * @param solution - 정답 그리드
 * @returns 조건 배열 (1~2개) 또는 빈 배열 (후보 없음)
 */
export const generateCompositeConditions = (
  grid: Grid,
  pos: Position,
  lockedKeys: Set<string>,
  allowedTypes: LockConditionType[],
  solution: SolutionGrid,
): LockCondition[] => {
  const allCandidates: LockCondition[] = [];

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
      allCandidates.push({
        type,
        target,
        description: createConditionDescription(type, target),
      });
    }
  }

  // 숫자 조건 후보
  if (allowedTypes.includes('number-complete') && solution) {
    const selfDigit = solution[pos.row][pos.col] as Digit;
    const numberCandidates = getNumberConditionCandidates(grid, updatedLockedKeys, selfDigit);
    for (const d of numberCandidates) {
      allCandidates.push({
        type: 'number-complete',
        target: d,
        description: createConditionDescription('number-complete', d),
      });
    }
  }

  if (allCandidates.length === 0) return [];

  // 셔플 후 서로 다른 유형 2개 선택
  const shuffled = shuffle(allCandidates);
  const selected: LockCondition[] = [shuffled[0]];

  if (shuffled.length >= 2) {
    // 첫 번째와 다른 유형의 조건 찾기
    const different = shuffled.find((c) => c.type !== selected[0].type);
    if (different) {
      selected.push(different);
    } else {
      // 같은 유형이라도 target이 다르면 추가
      const sameTypeDiffTarget = shuffled.find(
        (c) => c !== selected[0] && c.target !== selected[0].target,
      );
      if (sameTypeDiffTarget) {
        selected.push(sameTypeDiffTarget);
      }
    }
  }

  return selected;
};

// ─── 연쇄 잠금 설정 ──────────────────────────────────

/**
 * 잠금 셀들 사이에 연쇄 관계를 설정한다.
 * chainCount개의 연쇄 링크를 생성하여 트리 구조를 만든다.
 * 순환 참조를 방지한다.
 *
 * @param lockedCells - 기존 잠금 셀 목록 (수정하지 않음)
 * @param chainCount - 생성할 연쇄 링크 수
 * @returns 연쇄 관계가 설정된 새 잠금 셀 목록
 */
export const setupChainLinks = (
  lockedCells: LockedCell[],
  chainCount: number,
): LockedCell[] => {
  if (lockedCells.length < 2 || chainCount <= 0) {
    return lockedCells.map((lc) => ({ ...lc }));
  }

  const result = lockedCells.map((lc) => ({
    ...lc,
    conditions: [...lc.conditions],
    chainUnlocks: lc.chainUnlocks ? [...lc.chainUnlocks] : undefined,
  }));

  // 연쇄 대상이 될 수 있는 셀 (아직 다른 셀의 체인 타겟이 아닌 셀)
  const chainTargetUsed = new Set<string>();
  // 연쇄 소스가 될 수 있는 셀
  const indices = Array.from({ length: result.length }, (_, i) => i);
  const shuffledIndices = shuffle(indices);

  let created = 0;

  for (const sourceIdx of shuffledIndices) {
    if (created >= chainCount) break;

    const source = result[sourceIdx];
    const sourceKey = posKey(source.position.row, source.position.col);

    // 이미 체인 타겟인 셀은 소스가 될 수 없음 (단방향 트리 보장)
    if (chainTargetUsed.has(sourceKey)) continue;

    // 타겟 후보: 아직 체인 타겟이 아닌 다른 셀
    for (let i = 0; i < result.length; i++) {
      if (i === sourceIdx) continue;
      if (created >= chainCount) break;

      const target = result[i];
      const targetKey = posKey(target.position.row, target.position.col);

      if (chainTargetUsed.has(targetKey)) continue;
      // 소스가 이미 타겟의 체인 대상이면 스킵 (역방향 방지)
      if (target.chainUnlocks?.some(
        (p) => posKey(p.row, p.col) === sourceKey,
      )) continue;

      // 연쇄 링크 생성
      if (!source.chainUnlocks) {
        source.chainUnlocks = [];
      }
      source.chainUnlocks.push({ ...target.position });
      chainTargetUsed.add(targetKey);
      created++;
    }
  }

  return result;
};

// ─── 연쇄 해제 처리 ──────────────────────────────────

/**
 * 연쇄 잠금을 포함하여 해제 가능한 셀들을 찾는다.
 * 1. 조건이 모두 충족된 셀을 찾는다.
 * 2. 해제된 셀의 chainUnlocks 타겟도 해제 대상에 추가한다.
 * 3. 캐스케이드를 재귀적으로 처리한다.
 *
 * @param grid - 현재 보드 상태
 * @param lockedCells - 잠금 칸 목록
 * @returns 해제 가능한 잠금 칸들 (조건 충족 + 연쇄 해제 포함)
 */
export const findUnlockableCellsWithChain = (
  grid: Grid,
  lockedCells: LockedCell[],
): LockedCell[] => {
  // 잠금 셀을 키로 빠르게 조회할 수 있는 맵
  const cellMap = new Map<string, LockedCell>();
  for (const lc of lockedCells) {
    cellMap.set(posKey(lc.position.row, lc.position.col), lc);
  }

  const lockedKeys = new Set(cellMap.keys());

  // 1단계: 조건 충족으로 직접 해제 가능한 셀
  const directUnlockable = new Set<string>();
  for (const lc of lockedCells) {
    if (lc.conditions.every((cond) => isAreaConditionMet(grid, cond, lockedKeys))) {
      directUnlockable.add(posKey(lc.position.row, lc.position.col));
    }
  }

  // 2단계: 연쇄 캐스케이드 (BFS)
  const allUnlockable = new Set(directUnlockable);
  const queue = [...directUnlockable];

  while (queue.length > 0) {
    const key = queue.shift()!;
    const cell = cellMap.get(key);
    if (!cell?.chainUnlocks) continue;

    for (const targetPos of cell.chainUnlocks) {
      const targetKey = posKey(targetPos.row, targetPos.col);
      if (allUnlockable.has(targetKey)) continue; // 이미 해제됨
      if (!cellMap.has(targetKey)) continue; // 잠금 셀이 아님

      allUnlockable.add(targetKey);
      queue.push(targetKey);
    }
  }

  // 결과 반환
  return lockedCells.filter((lc) =>
    allUnlockable.has(posKey(lc.position.row, lc.position.col)),
  );
};

// ─── 통합 잠금 배치 ──────────────────────────────────

/**
 * 잠금 배치 옵션
 */
export interface LockPlacementOptions {
  /** 복합 조건 허용 (하나의 잠금 칸에 2개 조건) */
  allowComposite: boolean;
  /** 연쇄 잠금 허용 */
  allowChain: boolean;
  /** 복합 조건 비율 (0.0~1.0, 기본 0.4) — 잠금 칸 중 복합 조건을 가질 비율 */
  compositeRatio?: number;
  /** 연쇄 링크 수 (기본: 잠금 칸 수의 30%) */
  chainRatio?: number;
}

/**
 * 퍼즐에 잠금 칸을 배치한다 (복합 조건 + 연쇄 잠금 지원).
 * 잠금 포함 상태에서 풀이 가능성을 검증한다.
 *
 * @param puzzle - 원본 퍼즐 (빈 칸 포함)
 * @param solution - 정답 그리드
 * @param count - 배치할 잠금 칸 수
 * @param allowedTypes - 허용된 조건 유형
 * @param options - 복합/연쇄 옵션
 * @returns 잠금 배치 결과
 *
 * @example
 * ```ts
 * // 단순 잠금 (Stage 11~20)
 * placeLocks(puzzle, solution, 2, ['row-complete'], { allowComposite: false, allowChain: false });
 *
 * // 복합 조건 (Stage 31~40)
 * placeLocks(puzzle, solution, 6, allTypes, { allowComposite: true, allowChain: false });
 *
 * // 연쇄 잠금 (Stage 41~50)
 * placeLocks(puzzle, solution, 10, allTypes, { allowComposite: true, allowChain: true });
 * ```
 */
export const placeLocks = (
  puzzle: Grid,
  solution: SolutionGrid,
  count: number,
  allowedTypes: LockConditionType[],
  options: LockPlacementOptions = { allowComposite: false, allowChain: false },
): LockPlacementResult => {
  if (count <= 0) {
    return { lockedCells: [], puzzle: cloneGrid(puzzle) };
  }

  const compositeRatio = options.compositeRatio ?? 0.4;
  const chainRatio = options.chainRatio ?? 0.3;

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

  // 복합 조건 대상 수 결정
  const compositeCount = options.allowComposite
    ? Math.round(count * compositeRatio)
    : 0;

  for (const pos of shuffled) {
    if (lockedCells.length >= count) break;

    const isComposite = options.allowComposite
      && lockedCells.length < compositeCount;

    let conditions: LockCondition[];

    if (isComposite) {
      conditions = generateCompositeConditions(
        workingPuzzle, pos, lockedKeys, allowedTypes, solution,
      );
    } else {
      const condition = generateCondition(
        workingPuzzle, pos, lockedKeys, allowedTypes, solution,
      );
      conditions = condition ? [condition] : [];
    }

    if (conditions.length === 0) continue;

    // 검증: 잠금 포함 상태에서 풀이 가능한지
    const candidateLocks = [...lockedCells, { position: pos, conditions }];
    if (validateSolvabilityWithLocks(workingPuzzle, solution, candidateLocks)) {
      lockedKeys.add(posKey(pos.row, pos.col));
      lockedCells.push({ position: pos, conditions });
    }
  }

  // 배치 부족 경고
  if (lockedCells.length < count && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[lockSystem] 잠금 칸 배치 부족: 요청 ${count}개, 실제 ${lockedCells.length}개. ` +
      `빈 칸 부족 또는 풀이 검증 실패가 원인일 수 있습니다.`,
    );
  }

  // 연쇄 잠금 설정 (잠금 수가 3개 이상일 때만 — 2개 이하에서는 체인 밀도가 과도)
  let finalLockedCells = lockedCells;
  if (options.allowChain && lockedCells.length >= 3) {
    const chainCount = Math.max(1, Math.round(lockedCells.length * chainRatio));
    finalLockedCells = setupChainLinks(lockedCells, chainCount);
  }

  // 최종 통합 검증: 풀이 가능성 + 데드락 검사
  if (finalLockedCells.length > 0) {
    const solvable = validateSolvabilityWithLocks(workingPuzzle, solution, finalLockedCells);
    const deadlockResult = checkDeadlock(workingPuzzle, solution, finalLockedCells);

    if (!solvable || deadlockResult.hasDeadlock) {
      if (process.env.NODE_ENV !== 'production') {
        const reason = !solvable ? '풀이 불가' : `데드락: ${deadlockResult.reason}`;
        console.warn(`[lockSystem] 최종 검증 실패 (${reason}) — 체인 없이 재시도합니다.`);
      }
      // 체인 제거 후 개별 검증 통과한 원본으로 fallback
      finalLockedCells = lockedCells;

      // fallback에서도 데드락 검사 → 원인 셀 제거
      const fallbackCheck = checkDeadlock(workingPuzzle, solution, finalLockedCells);
      if (fallbackCheck.hasDeadlock) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[lockSystem] fallback에서도 데드락 감지: ${fallbackCheck.reason} — 원인 셀을 제거합니다.`);
        }
        // 데드락 원인 셀을 제거하여 안전한 잠금 목록만 유지
        const involvedKeys = new Set(
          (fallbackCheck.involvedCells || []).map((p) => posKey(p.row, p.col)),
        );
        finalLockedCells = finalLockedCells.filter(
          (lc) => !involvedKeys.has(posKey(lc.position.row, lc.position.col)),
        );
      }
    }
  }

  return {
    lockedCells: finalLockedCells,
    puzzle: workingPuzzle,
  };
};

// ─── 데드락 검증 ────────────────────────────────────

/**
 * 체인 관계에 순환이 있는지 검사한다 (DFS 기반).
 *
 * @param lockedCells - 잠금 칸 목록
 * @returns 순환이 있으면 true
 */
export const hasChainCycle = (lockedCells: LockedCell[]): boolean => {
  // 인접 리스트 구축
  const adj = new Map<string, string[]>();
  for (const lc of lockedCells) {
    const key = posKey(lc.position.row, lc.position.col);
    if (lc.chainUnlocks && lc.chainUnlocks.length > 0) {
      adj.set(key, lc.chainUnlocks.map((p) => posKey(p.row, p.col)));
    }
  }

  // DFS 순환 탐지: 0=미방문, 1=진행중, 2=완료
  const state = new Map<string, number>();
  for (const lc of lockedCells) {
    state.set(posKey(lc.position.row, lc.position.col), 0);
  }

  const dfs = (key: string): boolean => {
    if (state.get(key) === 1) return true;  // 순환 발견
    if (state.get(key) === 2) return false; // 이미 검사 완료

    state.set(key, 1); // 진행중
    const neighbors = adj.get(key) || [];
    for (const next of neighbors) {
      if (dfs(next)) return true;
    }
    state.set(key, 2); // 완료
    return false;
  };

  for (const lc of lockedCells) {
    const key = posKey(lc.position.row, lc.position.col);
    if (state.get(key) === 0) {
      if (dfs(key)) return true;
    }
  }

  return false;
};

/**
 * 잠금 칸 조합의 데드락 여부를 검증한다.
 *
 * 시뮬레이션 방식:
 * 1. 모든 비잠금 빈 칸을 정답값으로 채운 그리드를 만든다.
 * 2. 잠금 칸은 null로 유지한다.
 * 3. 반복적으로 조건 충족된 잠금 칸 + 체인 캐스케이드를 해제한다.
 * 4. 해제된 셀의 정답값을 그리드에 반영하고, 다시 조건을 검사한다.
 * 5. 더 이상 해제할 셀이 없는데 잠금 셀이 남아있으면 데드락이다.
 *
 * @param puzzle - 퍼즐 그리드
 * @param solution - 정답 그리드
 * @param lockedCells - 잠금 칸 목록
 * @returns 데드락 검증 결과
 *
 * @example
 * ```ts
 * const result = checkDeadlock(puzzle, solution, lockedCells);
 * if (result.hasDeadlock) {
 *   console.log(result.reason);          // "2개의 잠금 칸이 해제 불가능합니다"
 *   console.log(result.involvedCells);   // [{row: 0, col: 3}, {row: 2, col: 5}]
 * }
 * ```
 */
export const checkDeadlock = (
  puzzle: Grid,
  solution: SolutionGrid,
  lockedCells: LockedCell[],
): DeadlockCheckResult => {
  if (lockedCells.length === 0) {
    return { hasDeadlock: false };
  }

  // 1. 순환 체인 검사
  if (hasChainCycle(lockedCells)) {
    return {
      hasDeadlock: true,
      reason: '체인 관계에 순환이 존재합니다',
      involvedCells: lockedCells.map((lc) => lc.position),
    };
  }

  // 2. 시뮬레이션 그리드: 비잠금 빈 칸을 정답으로 채움
  const simGrid = cloneGrid(puzzle);
  const lockedKeySet = new Set(
    lockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
  );
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (simGrid[r][c] === null && !lockedKeySet.has(posKey(r, c))) {
        simGrid[r][c] = solution[r][c] as CellValue;
      }
    }
  }

  // 3. 점진적 해제 시뮬레이션
  let remaining = [...lockedCells];
  let changed = true;

  while (changed && remaining.length > 0) {
    changed = false;
    const currentLockedKeys = new Set(
      remaining.map((lc) => posKey(lc.position.row, lc.position.col)),
    );

    // 조건 충족된 셀 찾기
    const directUnlockKeys = new Set<string>();
    for (const lc of remaining) {
      if (lc.conditions.every((cond) => isAreaConditionMet(simGrid, cond, currentLockedKeys))) {
        directUnlockKeys.add(posKey(lc.position.row, lc.position.col));
      }
    }

    // 체인 캐스케이드 (BFS)
    const allUnlockKeys = new Set(directUnlockKeys);
    const queue = [...directUnlockKeys];
    // 빠른 조회를 위한 맵
    const remainingMap = new Map(
      remaining.map((lc) => [posKey(lc.position.row, lc.position.col), lc]),
    );

    while (queue.length > 0) {
      const key = queue.shift()!;
      const cell = remainingMap.get(key);
      if (!cell?.chainUnlocks) continue;

      for (const target of cell.chainUnlocks) {
        const targetKey = posKey(target.row, target.col);
        if (!allUnlockKeys.has(targetKey) && currentLockedKeys.has(targetKey)) {
          allUnlockKeys.add(targetKey);
          queue.push(targetKey);
        }
      }
    }

    // 해제: 정답값 반영
    if (allUnlockKeys.size > 0) {
      for (const lc of remaining) {
        const key = posKey(lc.position.row, lc.position.col);
        if (allUnlockKeys.has(key)) {
          simGrid[lc.position.row][lc.position.col] = solution[lc.position.row][lc.position.col] as CellValue;
        }
      }
      remaining = remaining.filter(
        (lc) => !allUnlockKeys.has(posKey(lc.position.row, lc.position.col)),
      );
      changed = true;
    }
  }

  // 4. 결과 판정
  if (remaining.length === 0) {
    return { hasDeadlock: false };
  }

  return {
    hasDeadlock: true,
    reason: `${remaining.length}개의 잠금 칸이 해제 불가능합니다`,
    involvedCells: remaining.map((lc) => lc.position),
  };
};

/**
 * @internal 테스트 전용 export — 외부에서 직접 사용 금지
 */
export {
  getRowPositions,
  getColPositions,
  getBoxPositions,
  getAreaPositions,
  countEmptyInArea,
  createConditionDescription,
  getNumberConditionCandidates,
  AREA_LOCK_TYPES,
};
