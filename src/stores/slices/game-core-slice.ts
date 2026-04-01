/**
 * 게임 코어 슬라이스 -- 보드, 퍼즐, 히스토리, 게임 라이프사이클
 *
 * setValue, clearValue, toggleNote, undo 등 핵심 게임 액션을 포함한다.
 * 이 액션들은 board, lockedCells, history를 원자적으로 수정하므로
 * 하나의 슬라이스에 응집시킨다.
 *
 * initGame/reset은 타이머·UI 슬라이스 상태도 함께 초기화한다
 * (Zustand slice 패턴에서 set()은 전체 스토어에 접근 가능).
 */

import type { Board, Cell, Digit, LockedCell } from '@/types/game';
import type { SliceCreator, GameCoreSlice, HistoryEntry } from '../types';
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
 * 현재 보드 상태를 Grid로 변환 -> findUnlockableCellsWithChain -> 보드 갱신.
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

  // 보드에서 isLocked 해제 -- 변경 대상 셀만 새 객체 생성
  const newBoard = board.map((row, r) =>
    row.map((cell, c): Cell => {
      if (unlockKeys.has(posKey(r, c))) {
        return { ...cell, notes: new Set(cell.notes), isLocked: false };
      }
      return cell;
    }),
  );

  // lockedCells에서 해제된 셀 제거
  const newLockedCells = lockedCells.filter(
    (lc) => !unlockKeys.has(posKey(lc.position.row, lc.position.col)),
  );

  return { board: newBoard, lockedCells: newLockedCells };
};

// ─── 슬라이스 생성 ───────────────────────────────────

export const createGameCoreSlice: SliceCreator<GameCoreSlice> = (set, get) => ({
  board: [],
  solution: null,
  stage: 0,
  config: null,
  lockedCells: [],
  initialLockedCells: [],
  history: [],
  isStarted: false,
  isComplete: false,

  // ── initGame ──
  initGame: (stage: number) => {
    const result = generatePuzzle(stage);
    const board = createBoardFromPuzzle(result.puzzle, result.lockedCells);

    set({
      // Game core
      board,
      solution: result.solution,
      stage,
      config: result.config,
      lockedCells: result.lockedCells,
      initialLockedCells: result.lockedCells,
      history: [],
      isStarted: true,
      isComplete: false,
      // Timer reset
      timer: 0,
      isPaused: false,
      // UI reset
      selectedCell: null,
      isNoteMode: false,
      hintsUsed: 0,
    });
  },

  // ── reset ──
  reset: () => {
    const { stage, config, board: currentBoard, initialLockedCells } = get();
    if (!config || stage === 0) return;

    // initialLockedCells에서 잠금 위치 키 Set 생성
    const lockedKeys = new Set(
      initialLockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
    );

    // given 셀 유지, 나머지 초기화, 잠금은 최초 목록 기준으로 복원
    const resetBoard: Board = currentBoard.map((row, r) =>
      row.map((cell, c): Cell => {
        if (cell.isGiven) {
          return { ...cell, notes: new Set(), isError: false };
        }
        return {
          value: null,
          isGiven: false,
          notes: new Set(),
          isError: false,
          isLocked: lockedKeys.has(posKey(r, c)),
        };
      }),
    );

    // given 셀만으로 이미 충족되는 잠금 조건을 재검사
    const unlockResult = processUnlocks(resetBoard, initialLockedCells);

    set({
      // Game core
      board: unlockResult.board,
      lockedCells: unlockResult.lockedCells,
      history: [],
      isComplete: false,
      // Timer reset
      timer: 0,
      isPaused: false,
      // UI reset
      selectedCell: null,
      isNoteMode: false,
      hintsUsed: 0,
    });
  },

  // ── setValue ──
  setValue: (row: number, col: number, digit: Digit) => {
    const { board, solution, lockedCells, history, isComplete } = get();
    if (isComplete || !solution) return;

    const cell = board[row]?.[col];
    if (!cell || cell.isGiven || cell.isLocked) return;

    // 히스토리 저장
    const newHistory = pushHistory(history, board, lockedCells);

    // 셀 값 설정 + 메모 초기화 -- 변경 대상 셀만 새 객체 생성
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
        return c;
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

    // 셀 값 삭제 -- 변경 대상 셀만 새 객체 생성
    const newBoard = board.map((r, ri) =>
      r.map((c, ci): Cell => {
        if (ri === row && ci === col) {
          return { ...c, value: null, notes: new Set<Digit>(), isError: false };
        }
        return c;
      }),
    );

    // 충돌 검증 (다른 셀의 에러가 해소될 수 있음)
    const validatedBoard = updateBoardErrors(newBoard);

    // 잠금은 단방향(해제만 가능) -- clearValue로 조건이 미충족되어도 재잠금하지 않음
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

    // 메모 토글 -- 변경 대상 셀만 새 객체 생성
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
        return c;
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
});
