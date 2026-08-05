/**
 * GET /api/ranking/me
 *
 * 로그인 사용자의 스테이지별 최고 기록을 조회한다.
 * (userId, stage)당 1행만 보관하므로 저장된 행이 곧 최고 기록이다.
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
    // ── 2. 스테이지별 최고 기록 조회 ──
    // (userId, stage)당 1행이므로 그대로 읽으면 스테이지별 최고 기록이다.
    const bestRecords = await prisma.gameRecord.findMany({
      where: { userId },
      orderBy: { stage: "asc" },
      select: {
        stage: true,
        clearTime: true,
        hintsUsed: true,
        stars: true,
        completedAt: true,
      },
    });

    const records: PersonalBestRecord[] = bestRecords.map((r) => ({
      stage: r.stage,
      clearTime: r.clearTime,
      hintsUsed: r.hintsUsed,
      stars: r.stars,
      completedAt: r.completedAt.toISOString(),
    }));

    const responseData: MyRankingResponseData = {
      records,
      clearedStages: records.length,
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
