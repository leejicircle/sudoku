/**
 * 스도쿠 게임 상태 관리 (Zustand Store)
 *
 * @description
 * 1. 스테이지 기반 퍼즐 생성 및 초기화
 * 2. 셀 값 입력/삭제, 메모(후보 숫자) 토글
 * 3. 실시간 충돌 검증 (행/열/박스)
 * 4. 잠금 칸 조건 충족 시 자동 해제 (연쇄 포함)
 * 5. Undo (최대 50단계)
 * 6. 타이머 (초 단위)
 * 7. localStorage 자동 저장/복원 (persist)
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Board,
  Cell,
  Digit,
  SolutionGrid,
  Position,
  LockedCell,
  StageConfig,
} from '@/types/game';
import { generatePuzzle } from '@/lib/sudoku/difficulty';
import { findUnlockableCellsWithChain } from '@/lib/sudoku/lockSystem';
import {
  updateBoardErrors,
  isGameComplete,
  boardToGrid,
  cloneBoard,
  createBoardFromPuzzle,
} from '@/lib/sudoku/validator';
import { posKey } from '@/lib/sudoku/utils';

// ─── 상수 ────────────────────────────────────────────

/** Undo 히스토리 최대 크기 */
const MAX_HISTORY = 50;

// ─── 히스토리 엔트리 ────────────────────────────────

/** Undo용 스냅샷 */
interface HistoryEntry {
  board: Board;
  lockedCells: LockedCell[];
}

// ─── 직렬화 타입 ────────────────────────────────────

/** JSON 직렬화 가능한 Cell (notes: Digit[]) */
interface SerializedCell {
  value: Digit | null;
  isGiven: boolean;
  notes: Digit[];
  isError: boolean;
  isLocked: boolean;
}

// ─── 스토어 타입 ─────────────────────────────────────

/** 게임 스토어 상태 */
interface GameStoreState {
  // ── 게임 데이터 ──
  /** 현재 보드 */
  board: Board;
  /** 정답 */
  solution: SolutionGrid;
  /** 현재 스테이지 */
  stage: number;
  /** 스테이지 설정 */
  config: StageConfig | null;
  /** 남은 잠금 칸 목록 */
  lockedCells: LockedCell[];

  // ── UI 상태 ──
  /** 선택된 셀 */
  selectedCell: Position | null;
  /** 메모 모드 */
  isNoteMode: boolean;

  // ── 타이머 ──
  /** 경과 시간 (초) */
  timer: number;
  /** 일시정지 여부 */
  isPaused: boolean;

  // ── 히스토리 ──
  /** Undo 스택 */
  history: HistoryEntry[];

  // ── 게임 상태 ──
  /** 게임 시작 여부 */
  isStarted: boolean;
  /** 게임 완료 여부 */
  isComplete: boolean;
}

/** 게임 스토어 액션 */
interface GameStoreActions {
  // ── 게임 라이프사이클 ──
  /** 스테이지로 새 게임 시작 */
  initGame: (stage: number) => void;
  /** 현재 퍼즐을 초기 상태로 리셋 */
  reset: () => void;

  // ── 셀 액션 ──
  /** 셀에 숫자 입력 */
  setValue: (row: number, col: number, digit: Digit) => void;
  /** 셀 값 삭제 */
  clearValue: (row: number, col: number) => void;
  /** 메모 숫자 토글 */
  toggleNote: (row: number, col: number, digit: Digit) => void;

  // ── Undo ──
  /** 마지막 동작 되돌리기 */
  undo: () => void;

  // ── 타이머 ──
  /** 1초 증가 */
  tick: () => void;
  /** 일시정지 */
  pause: () => void;
  /** 재개 */
  resume: () => void;

  // ── 선택 ──
  /** 셀 선택 */
  selectCell: (position: Position | null) => void;
  /** 메모 모드 토글 */
  toggleNoteMode: () => void;
}

export type GameStore = GameStoreState & GameStoreActions;

// ─── 초기 상태 ──────────────────────────────────────

const EMPTY_BOARD: Board = [];
const EMPTY_SOLUTION: SolutionGrid = [] as unknown as SolutionGrid;

const initialState: GameStoreState = {
  board: EMPTY_BOARD,
  solution: EMPTY_SOLUTION,
  stage: 0,
  config: null,
  lockedCells: [],
  selectedCell: null,
  isNoteMode: false,
  timer: 0,
  isPaused: false,
  history: [],
  isStarted: false,
  isComplete: false,
};

// ─── 내부 헬퍼 ──────────────────────────────────────

/**
 * 히스토리에 현재 상태를 스냅샷으로 저장한다.
 * MAX_HISTORY를 초과하면 가장 오래된 항목을 제거.
 */
const pushHistory = (
  history: HistoryEntry[],
  board: Board,
  lockedCells: LockedCell[],
): HistoryEntry[] => {
  const entry: HistoryEntry = {
    board: cloneBoard(board),
    lockedCells: lockedCells.map((lc) => ({ ...lc, conditions: [...lc.conditions] })),
  };
  const newHistory = [...history, entry];
  if (newHistory.length > MAX_HISTORY) {
    return newHistory.slice(newHistory.length - MAX_HISTORY);
  }
  return newHistory;
};

/**
 * 잠금 해제를 수행한다.
 * 현재 보드 상태를 Grid로 변환 → findUnlockableCellsWithChain → 보드 갱신.
 */
const processUnlocks = (
  board: Board,
  lockedCells: LockedCell[],
): { board: Board; lockedCells: LockedCell[] } => {
  if (lockedCells.length === 0) return { board, lockedCells };

  const grid = boardToGrid(board);
  const unlockable = findUnlockableCellsWithChain(grid, lockedCells);

  if (unlockable.length === 0) return { board, lockedCells };

  // 해제 가능한 셀 키 Set
  const unlockKeys = new Set(
    unlockable.map((lc) => posKey(lc.position.row, lc.position.col)),
  );

  // 보드에서 isLocked 해제
  const newBoard = board.map((row, r) =>
    row.map((cell, c): Cell => {
      if (unlockKeys.has(posKey(r, c))) {
        return { ...cell, notes: new Set(cell.notes), isLocked: false };
      }
      return { ...cell, notes: new Set(cell.notes) };
    }),
  );

  // lockedCells에서 해제된 셀 제거
  const newLockedCells = lockedCells.filter(
    (lc) => !unlockKeys.has(posKey(lc.position.row, lc.position.col)),
  );

  return { board: newBoard, lockedCells: newLockedCells };
};

// ─── Board 직렬화 (persist용) ───────────────────────

/** @internal 테스트 전용 — 외부에서 직접 사용 금지 */
export const serializeCell = (cell: Cell): SerializedCell => ({
  value: cell.value,
  isGiven: cell.isGiven,
  notes: Array.from(cell.notes),
  isError: cell.isError,
  isLocked: cell.isLocked,
});

/** @internal 테스트 전용 — 외부에서 직접 사용 금지 */
export const deserializeCell = (data: SerializedCell): Cell => ({
  ...data,
  notes: new Set(data.notes),
});

/** @internal 테스트 전용 — 외부에서 직접 사용 금지 */
export const serializeBoard = (board: Board): SerializedCell[][] =>
  board.map((row) => row.map(serializeCell));

/** @internal 테스트 전용 — 외부에서 직접 사용 금지 */
export const deserializeBoard = (data: SerializedCell[][]): Board =>
  data.map((row) => row.map(deserializeCell));

/** @internal 테스트 전용 — 외부에서 직접 사용 금지 */
export const serializeHistory = (history: HistoryEntry[]): { board: SerializedCell[][]; lockedCells: LockedCell[] }[] =>
  history.map((entry) => ({
    board: serializeBoard(entry.board),
    lockedCells: entry.lockedCells,
  }));

/** @internal 테스트 전용 — 외부에서 직접 사용 금지 */
export const deserializeHistory = (data: { board: SerializedCell[][]; lockedCells: LockedCell[] }[]): HistoryEntry[] =>
  data.map((entry) => ({
    board: deserializeBoard(entry.board),
    lockedCells: entry.lockedCells,
  }));

// ─── persist 직렬화 타입 ────────────────────────────

interface PersistedState {
  board: SerializedCell[][];
  solution: SolutionGrid;
  stage: number;
  config: StageConfig | null;
  lockedCells: LockedCell[];
  timer: number;
  history: { board: SerializedCell[][]; lockedCells: LockedCell[] }[];
  isStarted: boolean;
  isComplete: boolean;
}

// ─── 스토어 생성 ────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── initGame ──
      initGame: (stage: number) => {
        const result = generatePuzzle(stage);
        const board = createBoardFromPuzzle(result.puzzle, result.lockedCells);

        set({
          board,
          solution: result.solution,
          stage,
          config: result.config,
          lockedCells: result.lockedCells,
          selectedCell: null,
          isNoteMode: false,
          timer: 0,
          isPaused: false,
          history: [],
          isStarted: true,
          isComplete: false,
        });
      },

      // ── reset ──
      reset: () => {
        const { stage, config } = get();
        if (!config || stage === 0) return;

        // 초기 보드를 히스토리에서 복원하지 않고, 현재 보드의 given 셀만 유지
        const currentBoard = get().board;
        const resetBoard: Board = currentBoard.map((row) =>
          row.map((cell): Cell => {
            if (cell.isGiven) {
              return { ...cell, notes: new Set(), isError: false };
            }
            return {
              value: null,
              isGiven: false,
              notes: new Set(),
              isError: false,
              isLocked: cell.isLocked, // 원래 잠금 상태는 유지하지 않고 재계산
            };
          }),
        );

        // 잠금 칸은 initGame 시 원래 목록으로 복원
        // 현재 config에서 재생성하면 랜덤이 달라지므로, 원래 보드의 given을 기반으로 재구성
        // → 심플하게: initGame과 동일한 효과를 위해 원래 solution/puzzle에서 재생성
        const result = get();
        const originalLockedCells = result.lockedCells;

        // 잠금 칸을 원래 목록으로 복원하고, 보드에서도 잠금 표시
        const lockedKeys = new Set(
          originalLockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
        );

        const finalBoard: Board = resetBoard.map((row, r) =>
          row.map((cell, c): Cell => ({
            ...cell,
            notes: new Set(),
            isLocked: lockedKeys.has(posKey(r, c)) ? true : cell.isLocked,
          })),
        );

        // given 셀만으로 이미 충족되는 잠금 조건을 재검사
        const unlockResult = processUnlocks(finalBoard, originalLockedCells);

        set({
          board: unlockResult.board,
          lockedCells: unlockResult.lockedCells,
          selectedCell: null,
          isNoteMode: false,
          timer: 0,
          isPaused: false,
          history: [],
          isComplete: false,
        });
      },

      // ── setValue ──
      setValue: (row: number, col: number, digit: Digit) => {
        const { board, solution, lockedCells, history, isComplete } = get();
        if (isComplete) return;

        const cell = board[row]?.[col];
        if (!cell || cell.isGiven || cell.isLocked) return;

        // 히스토리 저장
        const newHistory = pushHistory(history, board, lockedCells);

        // 셀 값 설정 + 메모 초기화
        const newBoard = board.map((r, ri) =>
          r.map((c, ci): Cell => {
            if (ri === row && ci === col) {
              return {
                ...c,
                value: digit,
                notes: new Set<Digit>(),
                isError: false,
              };
            }
            return { ...c, notes: new Set(c.notes) };
          }),
        );

        // 충돌 검증
        const validatedBoard = updateBoardErrors(newBoard);

        // 잠금 해제 검사
        const unlockResult = processUnlocks(validatedBoard, lockedCells);

        // 완료 검사
        const complete = isGameComplete(unlockResult.board, solution);

        set({
          board: unlockResult.board,
          lockedCells: unlockResult.lockedCells,
          history: newHistory,
          isComplete: complete,
          isPaused: complete ? true : get().isPaused,
        });
      },

      // ── clearValue ──
      clearValue: (row: number, col: number) => {
        const { board, lockedCells, history, isComplete } = get();
        if (isComplete) return;

        const cell = board[row]?.[col];
        if (!cell || cell.isGiven || cell.isLocked || cell.value === null) return;

        // 히스토리 저장
        const newHistory = pushHistory(history, board, lockedCells);

        // 셀 값 삭제
        const newBoard = board.map((r, ri) =>
          r.map((c, ci): Cell => {
            if (ri === row && ci === col) {
              return { ...c, value: null, notes: new Set<Digit>(), isError: false };
            }
            return { ...c, notes: new Set(c.notes) };
          }),
        );

        // 충돌 검증 (다른 셀의 에러가 해소될 수 있음)
        const validatedBoard = updateBoardErrors(newBoard);

        // 잠금은 단방향(해제만 가능) — clearValue로 조건이 미충족되어도 재잠금하지 않음
        set({
          board: validatedBoard,
          history: newHistory,
          isComplete: false,
        });
      },

      // ── toggleNote ──
      toggleNote: (row: number, col: number, digit: Digit) => {
        const { board, lockedCells, history, isComplete } = get();
        if (isComplete) return;

        const cell = board[row]?.[col];
        if (!cell || cell.isGiven || cell.isLocked || cell.value !== null) return;

        // 히스토리 저장
        const newHistory = pushHistory(history, board, lockedCells);

        // 메모 토글
        const newBoard = board.map((r, ri) =>
          r.map((c, ci): Cell => {
            if (ri === row && ci === col) {
              const newNotes = new Set(c.notes);
              if (newNotes.has(digit)) {
                newNotes.delete(digit);
              } else {
                newNotes.add(digit);
              }
              return { ...c, notes: newNotes };
            }
            return { ...c, notes: new Set(c.notes) };
          }),
        );

        set({
          board: newBoard,
          history: newHistory,
        });
      },

      // ── undo ──
      undo: () => {
        const { history, isComplete } = get();
        if (isComplete || history.length === 0) return;

        const newHistory = [...history];
        const lastEntry = newHistory.pop()!;

        // 복원된 보드에서 잠금 해제 조건 재검사
        const unlockResult = processUnlocks(lastEntry.board, lastEntry.lockedCells);

        set({
          board: unlockResult.board,
          lockedCells: unlockResult.lockedCells,
          history: newHistory,
        });
      },

      // ── tick ──
      tick: () => {
        const { isPaused, isComplete, isStarted } = get();
        if (isPaused || isComplete || !isStarted) return;
        set((state) => ({ timer: state.timer + 1 }));
      },

      // ── pause ──
      pause: () => {
        set({ isPaused: true });
      },

      // ── resume ──
      resume: () => {
        const { isComplete } = get();
        if (isComplete) return;
        set({ isPaused: false });
      },

      // ── selectCell ──
      selectCell: (position: Position | null) => {
        set({ selectedCell: position });
      },

      // ── toggleNoteMode ──
      toggleNoteMode: () => {
        set((state) => ({ isNoteMode: !state.isNoteMode }));
      },
    }),
    {
      name: 'sudoku-game',
      version: 1,

      // persist할 필드만 선택 (UI 일시 상태 제외)
      partialize: (state): PersistedState => ({
        board: serializeBoard(state.board),
        solution: state.solution,
        stage: state.stage,
        config: state.config,
        lockedCells: state.lockedCells,
        timer: state.timer,
        history: serializeHistory(state.history),
        isStarted: state.isStarted,
        isComplete: state.isComplete,
      }),

      // 복원 시 Set 역직렬화
      merge: (persisted, current) => {
        const data = persisted as PersistedState | null;
        if (!data?.isStarted) {
          return current;
        }

        return {
          ...current,
          board: deserializeBoard(data.board),
          solution: data.solution,
          stage: data.stage,
          config: data.config,
          lockedCells: data.lockedCells,
          timer: data.timer,
          history: deserializeHistory(data.history || []),
          isStarted: data.isStarted,
          isComplete: data.isComplete,
        };
      },
    },
  ),
);
