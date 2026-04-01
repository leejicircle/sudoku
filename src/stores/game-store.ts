/**
 * 스도쿠 게임 상태 관리 (Zustand Store)
 *
 * 슬라이스 패턴으로 관심사를 분리한다:
 * - GameCoreSlice: 보드, 퍼즐, 히스토리, 게임 라이프사이클
 * - TimerSlice: 경과 시간, 일시정지
 * - UISlice: 셀 선택, 메모 모드, 힌트 사용 횟수
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 * @see GitHub Issue #5 — Epic: 게임 UI 개발
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createGameCoreSlice } from './slices/game-core-slice';
import { createTimerSlice } from './slices/timer-slice';
import { createUISlice } from './slices/ui-slice';
import {
  serializeCell,
  deserializeCell,
  serializeBoard,
  deserializeBoard,
  serializeHistory,
  deserializeHistory,
} from './helpers/serialization';
import type { GameStore, PersistedState } from './types';

// ─── Re-exports (하위 호환: 테스트에서 기존 경로로 import) ──

export type { GameStore } from './types';
export {
  serializeCell,
  deserializeCell,
  serializeBoard,
  deserializeBoard,
  serializeHistory,
  deserializeHistory,
};

// ─── 스토어 생성 ────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createGameCoreSlice(...a),
      ...createTimerSlice(...a),
      ...createUISlice(...a),
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
        initialLockedCells: state.initialLockedCells,
        timer: state.timer,
        hintsUsed: state.hintsUsed,
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
          initialLockedCells: data.initialLockedCells || data.lockedCells,
          timer: data.timer,
          hintsUsed: data.hintsUsed ?? 0,
          history: deserializeHistory(data.history || []),
          isStarted: data.isStarted,
          isComplete: data.isComplete,
        };
      },
    },
  ),
);
