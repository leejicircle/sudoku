/**
 * GET /api/ranking/me
 *
 * 로그인 사용자의 스테이지별 최고 기록을 조회한다.
 * 각 스테이지의 최단 클리어 시간 + 플레이 횟수를 반환.
 *
 * - 인증 필수 (requireAuth)
 *
 * @see docs/adr/204-game-record-schema.md
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import type { PersonalBestRecord, MyRankingResponseData } from "@/types/ranking";

export const GET = async () => {
  // ── 1. 인증 검증 ──
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "로그인이 필요합니다" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    // ── 2. 스테이지별 집계 (최소 clearTime + 플레이 횟수) ──
    const stageStats = await prisma.gameRecord.groupBy({
      by: ["stage"],
      where: { userId },
      _min: { clearTime: true },
      _count: { id: true },
      orderBy: { stage: "asc" },
    });

    if (stageStats.length === 0) {
      const responseData: MyRankingResponseData = {
        records: [],
        clearedStages: 0,
        totalPlays: 0,
      };
      return NextResponse.json<ApiResponse<MyRankingResponseData>>(
        { success: true, data: responseData },
        { status: 200 },
      );
    }

    // ── 3. 각 스테이지 최고 기록 상세 조회 ──
    const bestRecords = await prisma.gameRecord.findMany({
      where: {
        userId,
        OR: stageStats.map((s) => ({
          stage: s.stage,
          clearTime: s._min.clearTime!,
        })),
      },
      orderBy: [{ stage: "asc" }, { completedAt: "asc" }],
      select: {
        stage: true,
        clearTime: true,
        hintsUsed: true,
        stars: true,
        completedAt: true,
      },
    });

    // 스테이지별 중복 제거 (같은 최고 시간이 여러 개면 가장 먼저 달성한 것)
    const seenStages = new Set<number>();
    const uniqueBests = bestRecords.filter((r) => {
      if (seenStages.has(r.stage)) return false;
      seenStages.add(r.stage);
      return true;
    });

    // playCount 맵 생성
    const playCountMap = new Map(
      stageStats.map((s) => [s.stage, s._count.id]),
    );

    // ── 4. 응답 데이터 조합 ──
    const records: PersonalBestRecord[] = uniqueBests.map((r) => ({
      stage: r.stage,
      clearTime: r.clearTime,
      hintsUsed: r.hintsUsed,
      stars: r.stars,
      completedAt: r.completedAt.toISOString(),
      playCount: playCountMap.get(r.stage) ?? 1,
    }));

    const totalPlays = stageStats.reduce((sum, s) => sum + s._count.id, 0);

    const responseData: MyRankingResponseData = {
      records,
      clearedStages: stageStats.length,
      totalPlays,
    };

    return NextResponse.json<ApiResponse<MyRankingResponseData>>(
      { success: true, data: responseData },
      { status: 200 },
    );
  } catch (error) {
    console.error("[ranking/me] 조회 실패:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "내 기록 조회 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
};
