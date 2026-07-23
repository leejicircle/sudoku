/**
 * 오프라인 클리어 큐 → 서버 flush 훅
 *
 * 온라인 복귀(`online` 이벤트) 또는 앱 마운트 시, localStorage에 쌓인
 * 미전송 클리어 기록을 순차적으로 POST /api/game/clear 로 전송한다.
 *
 * - 인증 상태 + navigator.onLine 확인 후에만 전송
 * - 전송 성공 → 큐에서 제거 / 실패 → 남겨두고 다음 기회에 재시도
 * - 하나라도 성공하면 랭킹 캐시 무효화
 * - 동시 flush 방지 (ref 가드)
 *
 * ponytail: POST 성공 직후 앱이 죽으면 해당 건이 재전송되어 중복 행이 생길 수 있음
 * (창이 매우 좁음). /api/game/clear가 append-only라 발생 시 중복은 무해한 잉여 행.
 * 문제가 되면 서버에 (userId,stage,completedAt) 멱등 upsert 추가.
 *
 * @see src/stores/offline-clear-store.ts
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuth from "./useAuth";
import { useOfflineClearStore } from "@/stores/offline-clear-store";
import { rankingKeys } from "./useRanking";
import type { ApiResponse } from "@/types/api";
import type { GameClearResponseData } from "@/types/ranking";
import type { PendingClear } from "@/stores/offline-clear-store";

const postClear = async (record: PendingClear): Promise<boolean> => {
  const { id: _id, ...payload } = record;
  void _id;
  const res = await fetch("/api/game/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as ApiResponse<GameClearResponseData>;
  return res.ok && json.success;
};

const useOfflineClearSync = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const isFlushingRef = useRef(false);

  const getPending = useOfflineClearStore((s) => s.getPending);
  const dequeue = useOfflineClearStore((s) => s.dequeue);

  const flush = useCallback(async () => {
    if (isFlushingRef.current) return;
    if (!isAuthenticated) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    const pending = getPending();
    if (pending.length === 0) return;

    isFlushingRef.current = true;
    let anySuccess = false;

    try {
      for (const record of pending) {
        try {
          const ok = await postClear(record);
          if (ok) {
            dequeue(record.id);
            anySuccess = true;
          } else {
            // 서버가 거부(4xx/5xx) — 남겨두고 중단, 다음 기회에 재시도
            break;
          }
        } catch {
          // 네트워크 에러 — 남겨두고 중단
          break;
        }
      }
    } finally {
      isFlushingRef.current = false;
      if (anySuccess) {
        void queryClient.invalidateQueries({ queryKey: rankingKeys.all });
      }
    }
  }, [isAuthenticated, getPending, dequeue, queryClient]);

  // 마운트 시 + 온라인 복귀 시 flush
  useEffect(() => {
    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);

  return { flush };
};

export default useOfflineClearSync;
