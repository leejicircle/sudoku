/**
 * 오프라인 클리어 기록 큐 (로그인 사용자용)
 *
 * 로그인 사용자가 오프라인에서 퍼즐을 클리어하면 서버 저장(POST /api/game/clear)이
 * 실패하므로, 기록을 localStorage 큐에 쌓아두고 온라인 복귀 시 일괄 전송한다.
 *
 * - 게스트 기록(guest-record-store)과 별개: 이쪽은 "이미 로그인한" 사용자의 미전송분
 * - Zustand persist로 localStorage 자동 저장 → 페이지 새로고침/앱 종료에도 유지
 *
 * @see src/hooks/useOfflineClearSync.ts — 큐 flush 훅
 * @see src/app/api/game/clear/route.ts — 전송 대상 API
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameClearRequest } from "@/types/ranking";

// ─── 타입 ──────────────────────────────────────────

export interface PendingClear extends GameClearRequest {
  /** 로컬 큐 식별자 (전송 성공 시 제거용) */
  id: string;
}

interface OfflineClearStore {
  pending: PendingClear[];
  enqueue: (record: GameClearRequest) => void;
  dequeue: (id: string) => void;
  getPending: () => PendingClear[];
  hasPending: () => boolean;
}

/** 큐 최대 길이 — 폭주 방지 (오래된 것부터 유지) */
const MAX_PENDING = 100;

// ─── 스토어 ────────────────────────────────────────

export const useOfflineClearStore = create<OfflineClearStore>()(
  persist(
    (set, get) => ({
      pending: [],

      enqueue: (record) => {
        const item: PendingClear = { ...record, id: crypto.randomUUID() };
        set((state) => {
          const next = [...state.pending, item];
          return { pending: next.slice(-MAX_PENDING) };
        });
      },

      dequeue: (id) => {
        set((state) => ({ pending: state.pending.filter((r) => r.id !== id) }));
      },

      getPending: () => get().pending,

      hasPending: () => get().pending.length > 0,
    }),
    {
      name: "sudoku-offline-clears",
      version: 1,
    },
  ),
);
