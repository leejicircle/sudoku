/**
 * 스도쿠 난이도 시스템
 * 50스테이지 기반 난이도 설정을 관리하고, 스테이지별 퍼즐을 생성한다.
 *
 * @description
 * 1. 스테이지 번호(1~50)에 따라 빈 칸 수, 잠금 칸 수, 조건 유형 결정
 * 2. 구간 내에서 스테이지가 올라갈수록 선형 보간으로 난이도 증가
 * 3. generateSolution + createPuzzleFromSolution 파이프라인으로 퍼즐 생성
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

import type { StageConfig, StageRange, Grid, SolutionGrid } from '@/types/game';
import { STAGE_RANGES } from '@/types/game';
import { generateSolution } from '@/lib/sudoku/generator';
import { createPuzzleFromSolution } from '@/lib/sudoku/solver';

// ─── 상수 ───────────────────────────────────────────

/** 최소 스테이지 */
const MIN_STAGE = 1;

/** 최대 스테이지 */
const MAX_STAGE = 50;

// ─── 스테이지 구간 조회 ─────────────────────────────

/**
 * 스테이지 번호에 해당하는 구간(StageRange)을 찾는다.
 *
 * @param stage - 스테이지 번호 (1~50)
 * @returns 해당 구간 설정
 * @throws 유효하지 않은 스테이지 번호
 */
export const getStageRange = (stage: number): StageRange => {
  if (!Number.isInteger(stage) || stage < MIN_STAGE || stage > MAX_STAGE) {
    throw new Error(`Invalid stage number: ${stage}. Must be between ${MIN_STAGE} and ${MAX_STAGE}.`);
  }

  const range = STAGE_RANGES.find(
    (r) => stage >= r.startStage && stage <= r.endStage,
  );

  if (!range) {
    throw new Error(`No stage range found for stage ${stage}.`);
  }

  return range;
};

// ─── 선형 보간 ──────────────────────────────────────

/**
 * 구간 내에서 스테이지 위치에 따라 값을 선형 보간한다.
 * 스테이지가 구간 시작이면 min, 끝이면 max를 반환.
 *
 * @param stage - 스테이지 번호
 * @param range - 구간 설정
 * @param valueRange - [min, max] 범위
 * @returns 보간된 정수 값
 */
const interpolate = (
  stage: number,
  range: StageRange,
  valueRange: [number, number],
): number => {
  const [min, max] = valueRange;

  // 구간 내 상대 위치 (0.0 ~ 1.0)
  const span = range.endStage - range.startStage;
  if (span === 0) return min;

  const progress = (stage - range.startStage) / span;
  return Math.round(min + progress * (max - min));
};

// ─── StageConfig 생성 ───────────────────────────────

/**
 * 스테이지 번호에 해당하는 StageConfig를 생성한다.
 *
 * @param stage - 스테이지 번호 (1~50)
 * @returns 해당 스테이지의 설정 (빈 칸 수, 잠금 칸 수, 조건 유형 등)
 *
 * @example
 * ```ts
 * const config = getStageConfig(15);
 * // { stage: 15, emptyCells: 40, lockedCellCount: 2,
 * //   allowedLockTypes: ['row-complete', 'col-complete', 'box-complete'],
 * //   allowChainLocks: false }
 * ```
 */
export const getStageConfig = (stage: number): StageConfig => {
  const range = getStageRange(stage);

  return {
    stage,
    emptyCells: interpolate(stage, range, range.emptyRange),
    lockedCellCount: interpolate(stage, range, range.lockRange),
    allowedLockTypes: [...range.allowedLockTypes],
    allowChainLocks: range.allowChainLocks,
  };
};

// ─── 퍼즐 생성 파이프라인 ────────────────────────────

/**
 * 스테이지별 퍼즐 생성 결과
 */
export interface PuzzleGenerationResult {
  /** 빈 칸이 포함된 퍼즐 그리드 */
  puzzle: Grid;
  /** 완성된 정답 그리드 */
  solution: SolutionGrid;
  /** 적용된 스테이지 설정 */
  config: StageConfig;
}

/**
 * 스테이지 번호에 맞는 퍼즐을 생성한다.
 * 유일해가 보장된 퍼즐을 반환한다.
 *
 * @param stage - 스테이지 번호 (1~50)
 * @returns 퍼즐, 정답, 스테이지 설정
 *
 * @example
 * ```ts
 * const result = generatePuzzle(25);
 * console.log(result.config.emptyCells); // 44~49 범위
 * console.log(result.puzzle);            // 빈 칸이 포함된 Grid
 * console.log(result.solution);          // 완성된 SolutionGrid
 * ```
 */
export const generatePuzzle = (stage: number): PuzzleGenerationResult => {
  const config = getStageConfig(stage);
  const solution = generateSolution();
  const puzzle = createPuzzleFromSolution(solution, config.emptyCells);

  // TODO: 잠금 칸 생성 로직 — feat/engine-lock-area, lock-number, lock-chain PR에서 구현 예정
  // config.lockedCellCount > 0인 스테이지(11+)에서 잠금 칸을 배치하고
  // 잠금 포함 상태에서도 풀이 가능성을 보장해야 함

  return {
    puzzle,
    solution,
    config,
  };
};

/**
 * 모든 스테이지(1~50)의 StageConfig 목록을 반환한다.
 * 주로 UI에서 스테이지 선택 화면을 렌더링할 때 사용.
 *
 * @returns 50개 StageConfig 배열
 */
export const getAllStageConfigs = (): StageConfig[] => {
  return Array.from({ length: MAX_STAGE }, (_, i) => getStageConfig(i + 1));
};

/**
 * 스테이지의 구간 라벨을 반환한다.
 *
 * @param stage - 스테이지 번호 (1~50)
 * @returns 구간 라벨 (예: '입문', '초급', '중급', '고급', '마스터')
 */
export const getStageLabel = (stage: number): string => {
  return getStageRange(stage).label;
};

/**
 * @internal 테스트 전용 export — 외부에서 직접 사용 금지
 */
export { interpolate, MIN_STAGE, MAX_STAGE };
