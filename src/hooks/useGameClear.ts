/**
 * 게임 클리어 기록 저장 커스텀 훅
 *
 * React Query useMutation 기반으로 클리어 기록을 서버에 저장한다.
 * 저장 성공 시 관련 랭킹 쿼리를 자동 무효화하여 최신 데이터를 반영한다.
 *
 * - 인증된 사용자만 호출 가능 (POST /api/game/clear)
 * - 비로그인 사용자는 guest-record-store에 별도 저장
 *
 * @see src/types/ranking.ts — 타입 정의
 * @see src/app/api/game/clear/route.ts — API 엔드포인트
 * @see GitHub Issue #6 — Epic: 랭킹 시스템
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  GameClearRequest,
  GameClearResponseData,
} from "@/types/ranking";
import type { ApiResponse } from "@/types/api";
import { rankingKeys } from "./useRanking";

// ─── Fetcher ────────────────────────────────────────

const postGameClear = async (
  data: GameClearRequest,
): Promise<GameClearResponseData> => {
  const res = await fetch("/api/game/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = (await res.json()) as ApiResponse<GameClearResponseData>;

  if (!res.ok || !json.success) {
    throw new Error(
      json.success === false ? json.error : "기록 저장에 실패했습니다",
    );
  }

  return json.data;
};

// ─── Hook ───────────────────────────────────────────

/** 게임 클리어 기록 저장 + 랭킹 캐시 무효화 */
export const useGameClear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postGameClear,
    onSuccess: () => {
      // 랭킹 전체 + 내 기록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });
};
