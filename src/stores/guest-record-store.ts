/**
 * 게스트(비로그인) 게임 기록 스토어
 *
 * 비로그인 사용자가 퍼즐을 클리어하면 로컬 스토리지에 기록을 저장하고,
 * 로그인 전환 시 서버 동기화 후 일괄 삭제할 수 있도록 관리한다.
 *
 * Zustand persist 미들웨어로 localStorage에 자동 저장.
 *
 * @see src/types/guest.ts — 타입 정의
 * @see src/hooks/useGuestSync.ts — 동기화 훅
 * @see docs/adr/203-guest-mode.md
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GuestGameRecord,
  GuestRecordStore,
} from "@/types/guest";
import {
  GUEST_STORAGE_KEY,
  GUEST_MAX_RECORDS,
} from "@/types/guest";

// ─── 스토어 생성 ────────────────────────────────────

export const useGuestRecordStore = create<GuestRecordStore>()(
  persist(
    (set, get) => ({
      // ── 상태 ──
      records: [],

      // ── 액션 ──

      addRecord: (partial) => {
        const record: GuestGameRecord = {
          id: crypto.randomUUID(),
          stage: partial.stage,
          clearTime: partial.clearTime,
          hintsUsed: partial.hintsUsed,
          stars: partial.stars,
          completedAt: new Date().toISOString(),
        };

        set((state) => {
          const next = [record, ...state.records];
          // 최대 저장 개수 초과 시 오래된 기록 제거
          if (next.length > GUEST_MAX_RECORDS) {
            return { records: next.slice(0, GUEST_MAX_RECORDS) };
          }
          return { records: next };
        });
      },

      removeRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },

      clearRecords: () => {
        set({ records: [] });
      },

      getRecords: () => {
        return get().records;
      },

      getBestRecord: (stage) => {
        const stageRecords = get().records.filter((r) => r.stage === stage);
        if (stageRecords.length === 0) return null;

        // 별점 높은 순 → 클리어 시간 빠른 순
        return stageRecords.reduce((best, curr) => {
          if (curr.stars > best.stars) return curr;
          if (curr.stars === best.stars && curr.clearTime < best.clearTime) {
            return curr;
          }
          return best;
        });
      },

      hasRecords: () => {
        return get().records.length > 0;
      },
    }),
    {
      name: GUEST_STORAGE_KEY,
      version: 1,
    },
  ),
);
