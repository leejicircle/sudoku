/**
 * 게임 스토어 직렬화/역직렬화 헬퍼
 *
 * Zustand persist에서 Board(Set 포함)를 JSON으로 변환하기 위해 사용.
 * Set<Digit> <-> Digit[] 변환이 핵심.
 *
 * @internal persist 내부 및 테스트 전용
 */

import type { Board, Cell, LockedCell } from '@/types/game';
import type { SerializedCell, HistoryEntry } from '../types';

/** Cell -> SerializedCell (Set -> Array) */
export const serializeCell = (cell: Cell): SerializedCell => ({
  value: cell.value,
  isGiven: cell.isGiven,
  notes: Array.from(cell.notes),
  isError: cell.isError,
  isLocked: cell.isLocked,
});

/** SerializedCell -> Cell (Array -> Set) */
export const deserializeCell = (data: SerializedCell): Cell => ({
  ...data,
  notes: new Set(data.notes),
});

/** Board -> SerializedCell[][] */
export const serializeBoard = (board: Board): SerializedCell[][] =>
  board.map((row) => row.map(serializeCell));

/** SerializedCell[][] -> Board */
export const deserializeBoard = (data: SerializedCell[][]): Board =>
  data.map((row) => row.map(deserializeCell));

/** HistoryEntry[] -> 직렬화된 히스토리 */
export const serializeHistory = (
  history: HistoryEntry[],
): { board: SerializedCell[][]; lockedCells: LockedCell[] }[] =>
  history.map((entry) => ({
    board: serializeBoard(entry.board),
    lockedCells: entry.lockedCells,
  }));

/** 직렬화된 히스토리 -> HistoryEntry[] */
export const deserializeHistory = (
  data: { board: SerializedCell[][]; lockedCells: LockedCell[] }[],
): HistoryEntry[] =>
  data.map((entry) => ({
    board: deserializeBoard(entry.board),
    lockedCells: entry.lockedCells,
  }));
