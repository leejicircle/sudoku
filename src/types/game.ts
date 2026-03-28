/**
 * 스도쿠 게임 공유 타입 정의
 * Engine, Frontend, Backend 에이전트 모두 참조하는 핵심 타입
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

// ─── 기본 타입 ────────────────────────────────────────

/** 1~9 숫자 */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 셀 값: 숫자 또는 빈 칸 */
export type CellValue = Digit | null;

/** 셀 위치 좌표 */
export interface Position {
  row: number;
  col: number;
}

// ─── 잠금 칸 시스템 ───────────────────────────────────

/** 잠금 조건 유형 */
export type LockConditionType =
  | 'row-complete'     // 해당 행의 모든 빈 칸 채우기
  | 'col-complete'     // 해당 열의 모든 빈 칸 채우기
  | 'box-complete'     // 해당 3×3 박스의 모든 빈 칸 채우기
  | 'number-complete'  // 특정 숫자를 보드에 모두 배치
  | 'cell-fill';       // 특정 셀에 값 입력

/** 잠금 해제 조건 */
export interface LockCondition {
  /** 조건 유형 */
  type: LockConditionType;
  /** 조건 대상 (행/열/박스 인덱스 또는 숫자) */
  target: number;
  /** 조건 설명 (UI 표시용) */
  description: string;
}

/** 잠금 칸 정보 */
export interface LockedCell {
  /** 잠금 칸 위치 */
  position: Position;
  /** 해제 조건 목록 (복합 조건: 모두 충족해야 해제) */
  conditions: LockCondition[];
  /** 연쇄 잠금 대상 (이 셀 해제 시 함께 해제되는 셀들) */
  chainUnlocks?: Position[];
}

// ─── 셀 & 보드 ────────────────────────────────────────

/** 개별 셀 */
export interface Cell {
  /** 현재 값 */
  value: CellValue;
  /** 초기 제공 숫자 여부 (수정 불가) */
  isGiven: boolean;
  /** 메모 (후보 숫자) */
  notes: Set<Digit>;
  /** 충돌 표시 */
  isError: boolean;
  /** 잠금 상태 (true면 값 입력 불가, 조건 충족 시 해제) */
  isLocked: boolean;
}

/** 9×9 보드 */
export type Board = Cell[][];

/** 숫자만 담은 9×9 그리드 (풀이/생성 내부용) */
export type Grid = CellValue[][];

/** 숫자만 담은 9×9 완성 그리드 (정답용) */
export type SolutionGrid = Digit[][];

// ─── 난이도 & 스테이지 ────────────────────────────────

/**
 * 50스테이지 난이도 설정
 *
 * | 스테이지 | 빈 칸   | 잠금 칸 | 조건 유형           |
 * |---------|--------|---------|-------------------|
 * | 1~10    | 28~37  | 0       | 없음               |
 * | 11~20   | 38~43  | 1~3     | 영역 조건만          |
 * | 21~30   | 44~49  | 3~5     | 영역+숫자 혼합        |
 * | 31~40   | 49~54  | 5~8     | 복합 조건            |
 * | 41~50   | 54~58  | 8~12    | 연쇄 잠금            |
 */
export interface StageConfig {
  /** 스테이지 번호 (1~50) */
  stage: number;
  /** 빈 칸 수 */
  emptyCells: number;
  /** 잠금 칸 수 */
  lockedCellCount: number;
  /** 허용되는 잠금 조건 유형들 */
  allowedLockTypes: LockConditionType[];
  /** 연쇄 잠금 허용 여부 */
  allowChainLocks: boolean;
}

/** 스테이지 구간 정의 */
export interface StageRange {
  /** 시작 스테이지 (inclusive) */
  startStage: number;
  /** 끝 스테이지 (inclusive) */
  endStage: number;
  /** 빈 칸 수 범위 */
  emptyRange: [min: number, max: number];
  /** 잠금 칸 수 범위 */
  lockRange: [min: number, max: number];
  /** 허용되는 잠금 조건 유형들 */
  allowedLockTypes: LockConditionType[];
  /** 연쇄 잠금 허용 여부 */
  allowChainLocks: boolean;
  /** 구간 표시명 */
  label: string;
}

/** 스테이지 구간 설정 */
export const STAGE_RANGES: StageRange[] = [
  {
    startStage: 1,
    endStage: 10,
    emptyRange: [28, 37],
    lockRange: [0, 0],
    allowedLockTypes: [],
    allowChainLocks: false,
    label: '입문',
  },
  {
    startStage: 11,
    endStage: 20,
    emptyRange: [38, 43],
    lockRange: [1, 3],
    allowedLockTypes: ['row-complete', 'col-complete', 'box-complete'],
    allowChainLocks: false,
    label: '초급',
  },
  {
    startStage: 21,
    endStage: 30,
    emptyRange: [44, 49],
    lockRange: [3, 5],
    allowedLockTypes: ['row-complete', 'col-complete', 'box-complete', 'number-complete'],
    allowChainLocks: false,
    label: '중급',
  },
  {
    startStage: 31,
    endStage: 40,
    emptyRange: [49, 54],
    lockRange: [5, 8],
    allowedLockTypes: ['row-complete', 'col-complete', 'box-complete', 'number-complete', 'cell-fill'],
    allowChainLocks: false,
    label: '고급',
  },
  {
    startStage: 41,
    endStage: 50,
    emptyRange: [54, 58],
    lockRange: [8, 12],
    allowedLockTypes: ['row-complete', 'col-complete', 'box-complete', 'number-complete', 'cell-fill'],
    allowChainLocks: true,
    label: '마스터',
  },
];

// ─── 게임 상태 ────────────────────────────────────────

/** 게임 상태 */
export interface GameState {
  /** 현재 보드 */
  board: Board;
  /** 정답 */
  solution: SolutionGrid;
  /** 현재 스테이지 */
  stage: number;
  /** 잠금 칸 정보 목록 */
  lockedCells: LockedCell[];
  /** 경과 시간 (초) */
  timer: number;
  /** 일시정지 여부 */
  isPaused: boolean;
  /** undo 히스토리 */
  history: Board[];
  /** 완료 여부 */
  isComplete: boolean;
}

// ─── 검증 ─────────────────────────────────────────────

/** 검증 결과 */
export interface ValidationResult {
  isValid: boolean;
  /** 충돌이 발생한 셀 위치들 */
  conflicts: Position[];
}

/** 데드락 검증 결과 */
export interface DeadlockCheckResult {
  /** 데드락 발생 여부 */
  hasDeadlock: boolean;
  /** 데드락 원인 설명 */
  reason?: string;
  /** 데드락에 관련된 잠금 셀들 */
  involvedCells?: Position[];
}

// ─── 풀이 ─────────────────────────────────────────────

/** 풀이 결과 (discriminated union) */
export type SolveResult =
  | { solved: true; grid: SolutionGrid; solutionCount: number }
  | { solved: false; grid: Grid; solutionCount: number };
