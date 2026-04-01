/**
 * 게임 스토어 타입 정의
 *
 * 모든 슬라이스 인터페이스와 공유 타입을 중앙 집중 관리한다.
 * 순환 의존성 방지를 위해 구현(slices)과 분리.
 *
 * @see GitHub Issue #5 — Epic: 게임 UI 개발
 */

import type { StateCreator } from 'zustand';
import type {
  Board,
  Digit,
  SolutionGrid,
  Position,
  LockedCell,
  StageConfig,
} from '@/types/game';

// ─── 공유 타입 ─────────────────────────────────────

/** Undo용 스냅샷 */
export interface HistoryEntry {
  board: Board;
  lockedCells: LockedCell[];
}

/** JSON 직렬화 가능한 Cell (notes: Digit[]) */
export interface SerializedCell {
  value: Digit | null;
  isGiven: boolean;
  notes: Digit[];
  isError: boolean;
  isLocked: boolean;
}

/** persist 직렬화 타입 */
export interface PersistedState {
  board: SerializedCell[][];
  solution: SolutionGrid | null;
  stage: number;
  config: StageConfig | null;
  lockedCells: LockedCell[];
  initialLockedCells: LockedCell[];
  timer: number;
  hintsUsed: number;
  history: { board: SerializedCell[][]; lockedCells: LockedCell[] }[];
  isStarted: boolean;
  isComplete: boolean;
}

// ─── 슬라이스 인터페이스 ──────────────────────────────

/** 게임 코어 슬라이스: 보드, 퍼즐, 히스토리, 게임 라이프사이클 */
export interface GameCoreSlice {
  // ── 상태 ──
  /** 현재 보드 */
  board: Board;
  /** 정답 (게임 시작 전에는 null) */
  solution: SolutionGrid | null;
  /** 현재 스테이지 */
  stage: number;
  /** 스테이지 설정 */
  config: StageConfig | null;
  /** 남은 잠금 칸 목록 (게임 진행 중 해제되면 줄어듦) */
  lockedCells: LockedCell[];
  /** 최초 잠금 칸 목록 (reset 시 복원용, 게임 중 변경되지 않음) */
  initialLockedCells: LockedCell[];
  /** Undo 스택 */
  history: HistoryEntry[];
  /** 게임 시작 여부 */
  isStarted: boolean;
  /** 게임 완료 여부 */
  isComplete: boolean;

  // ── 액션 ──
  /** 스테이지로 새 게임 시작 */
  initGame: (stage: number) => void;
  /** 현재 퍼즐을 초기 상태로 리셋 */
  reset: () => void;
  /** 셀에 숫자 입력 */
  setValue: (row: number, col: number, digit: Digit) => void;
  /** 셀 값 삭제 */
  clearValue: (row: number, col: number) => void;
  /** 메모 숫자 토글 */
  toggleNote: (row: number, col: number, digit: Digit) => void;
  /** 마지막 동작 되돌리기 */
  undo: () => void;
}

/** 타이머 슬라이스 */
export interface TimerSlice {
  /** 경과 시간 (초) */
  timer: number;
  /** 일시정지 여부 */
  isPaused: boolean;
  /** 1초 증가 */
  tick: () => void;
  /** 일시정지 */
  pause: () => void;
  /** 재개 */
  resume: () => void;
}

/** UI 슬라이스: 선택, 메모 모드, 힌트 사용 횟수 */
export interface UISlice {
  /** 선택된 셀 */
  selectedCell: Position | null;
  /** 메모 모드 */
  isNoteMode: boolean;
  /** 사용한 힌트 횟수 */
  hintsUsed: number;
  /** 셀 선택 */
  selectCell: (position: Position | null) => void;
  /** 메모 모드 토글 */
  toggleNoteMode: () => void;
}

// ─── 전체 스토어 타입 ────────────────────────────────

/** 게임 스토어 전체 (슬라이스 합집합) */
export type GameStore = GameCoreSlice & TimerSlice & UISlice;

/** 슬라이스 생성자 타입 헬퍼 */
export type SliceCreator<T> = StateCreator<GameStore, [], [], T>;
