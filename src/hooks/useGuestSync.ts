/**
 * 게스트 기록 → 서버 동기화 훅
 *
 * 로그인 전환이 감지되면 로컬에 쌓인 게스트 기록을
 * POST /api/game/sync 로 일괄 전송하고, 성공 시 로컬 기록을 삭제한다.
 *
 * - 인증 상태 변화(unauthenticated → authenticated) 시 자동 실행
 * - 동기화 중 중복 호출 방지
 * - 실패 시 로컬 기록 보존 (다음 로그인 시 재시도)
 *
 * @see src/stores/guest-record-store.ts
 * @see src/app/api/game/sync/route.ts
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import useAuth from "./useAuth";
import { useGuestRecordStore } from "@/stores/guest-record-store";
import type { ApiResponse } from "@/types/api";
import type { GuestSyncResponseData } from "@/types/guest";
import { GUEST_SYNC_ENDPOINT } from "@/types/guest";

// ─── Types ─────────────────────────────────────────

export interface UseGuestSyncReturn {
  /** 동기화 진행 중 여부 */
  isSyncing: boolean;
  /** 수동 동기화 트리거 */
  syncNow: () => Promise<GuestSyncResponseData | null>;
}

// ─── Hook ──────────────────────────────────────────

const useGuestSync = (): UseGuestSyncReturn => {
  const { isAuthenticated, status } = useAuth();
  const isSyncingRef = useRef(false);
  const hasSyncedRef = useRef(false);

  const getRecords = useGuestRecordStore((s) => s.getRecords);
  const clearRecords = useGuestRecordStore((s) => s.clearRecords);
  const hasRecords = useGuestRecordStore((s) => s.hasRecords);

  /**
   * 서버로 기록 동기화 수행
   * 성공 시 로컬 기록 삭제, 실패 시 보존
   */
  const syncNow = useCallback(async (): Promise<GuestSyncResponseData | null> => {
    // 이미 진행 중이면 스킵
    if (isSyncingRef.current) return null;
    // 동기화할 기록이 없으면 스킵
    if (!hasRecords()) return null;

    isSyncingRef.current = true;

    try {
      const records = getRecords();
      const response = await fetch(GUEST_SYNC_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const json = (await response.json()) as ApiResponse<GuestSyncResponseData>;

      if (!response.ok || !json.success) {
        console.warn("[useGuestSync] 동기화 실패:", json);
        return null;
      }

      // DB에 실제 저장(synced)된 건이 있을 때만 로컬 기록 삭제
      // Epic #6 DB 연결 전까지는 pending만 반환되므로 기록 보존
      if (json.data.synced > 0) {
        clearRecords();
      }
      return json.data;
    } catch (error) {
      // 네트워크 에러 등 — 로컬 기록 보존
      console.warn("[useGuestSync] 동기화 에러:", error);
      return null;
    } finally {
      isSyncingRef.current = false;
    }
  }, [getRecords, clearRecords, hasRecords]);

  // ── 로그인 감지 시 자동 동기화 ──
  useEffect(() => {
    // 세션 로딩 완료 + 인증됨 + 아직 동기화 안 했음
    if (status === "authenticated" && isAuthenticated && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      void syncNow();
    }

    // 로그아웃 시 플래그 초기화 (다음 로그인 시 재동기화)
    if (status === "unauthenticated") {
      hasSyncedRef.current = false;
    }
  }, [status, isAuthenticated, syncNow]);

  return {
    isSyncing: isSyncingRef.current,
    syncNow,
  };
};

export default useGuestSync;
