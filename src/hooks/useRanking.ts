/**
 * 랭킹 조회 커스텀 훅
 *
 * React Query 기반으로 스테이지별 랭킹과 내 기록을 조회한다.
 *
 * - useStageRanking: GET /api/ranking?stage=N&limit=M
 * - useMyRanking: GET /api/ranking/me (인증 필수)
 *
 * @see src/types/ranking.ts — 타입 정의
 * @see src/app/api/ranking/ — API 엔드포인트
 * @see GitHub Issue #6 — Epic: 랭킹 시스템
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  RankingResponseData,
  MyRankingResponseData,
} from "@/types/ranking";
import { RANKING_DEFAULT_LIMIT } from "@/types/ranking";
import type { ApiResponse } from "@/types/api";
import useAuth from "./useAuth";

// ─── Query Keys ─────────────────────────────────────

export const rankingKeys = {
  all: ["ranking"] as const,
  stage: (stage: number, limit: number) =>
    [...rankingKeys.all, "stage", stage, limit] as const,
  me: () => [...rankingKeys.all, "me"] as const,
};

// ─── Fetchers ───────────────────────────────────────

const fetchStageRanking = async (
  stage: number,
  limit: number,
): Promise<RankingResponseData> => {
  const params = new URLSearchParams({
    stage: String(stage),
    limit: String(limit),
  });

  const res = await fetch(`/api/ranking?${params}`);
  const json = (await res.json()) as ApiResponse<RankingResponseData>;

  if (!res.ok || !json.success) {
    throw new Error(
      json.success === false ? json.error : "랭킹 조회에 실패했습니다",
    );
  }

  return json.data;
};

const fetchMyRanking = async (): Promise<MyRankingResponseData> => {
  const res = await fetch("/api/ranking/me");
  const json = (await res.json()) as ApiResponse<MyRankingResponseData>;

  if (!res.ok || !json.success) {
    throw new Error(
      json.success === false ? json.error : "내 기록 조회에 실패했습니다",
    );
  }

  return json.data;
};

// ─── Hooks ──────────────────────────────────────────

/** 스테이지별 랭킹 조회 (공개 API, 인증 불필요) */
export const useStageRanking = (
  stage: number,
  limit: number = RANKING_DEFAULT_LIMIT,
) => {
  return useQuery({
    queryKey: rankingKeys.stage(stage, limit),
    queryFn: () => fetchStageRanking(stage, limit),
    enabled: stage > 0,
    staleTime: 30 * 1000, // 30초간 캐시 유지
  });
};

/** 내 스테이지별 최고 기록 조회 (인증 필수) */
export const useMyRanking = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: rankingKeys.me(),
    queryFn: fetchMyRanking,
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1분간 캐시 유지
  });
};
