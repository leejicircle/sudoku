/**
 * GET /api/ranking?stage=1&limit=20
 *
 * 특정 스테이지의 랭킹(최단 클리어 시간)을 조회한다.
 * 저장 시점에 (userId, stage)당 최고 기록 1행만 유지되므로 단순 정렬 조회로 충분하다.
 *
 * - 인증 불필요 (공개 API)
 * - 쿼리 파라미터: stage (필수, 1~50), limit (선택, 기본 20, 최대 100)
 *
 * @see docs/adr/204-game-record-schema.md
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import type { RankingEntry, RankingResponseData } from "@/types/ranking";
import { RANKING_DEFAULT_LIMIT, RANKING_MAX_LIMIT } from "@/types/ranking";
import { MIN_STAGE, MAX_STAGE } from "@/types/guest";

export const GET = async (req: NextRequest) => {
  // ── 1. 쿼리 파라미터 파싱 ──
  const { searchParams } = req.nextUrl;

  const stageParam = searchParams.get("stage");
  if (!stageParam) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "stage 파라미터가 필요합니다" },
      { status: 400 },
    );
  }

  const stage = parseInt(stageParam, 10);
  if (isNaN(stage) || stage < MIN_STAGE || stage > MAX_STAGE) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: `stage는 ${MIN_STAGE}~${MAX_STAGE} 정수여야 합니다`,
      },
      { status: 400 },
    );
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(
        Math.max(parseInt(limitParam, 10) || RANKING_DEFAULT_LIMIT, 1),
        RANKING_MAX_LIMIT,
      )
    : RANKING_DEFAULT_LIMIT;

  try {
    // ── 2. 랭킹 조회 ──
    // (userId, stage)당 1행이므로 정렬 후 자르면 그대로 랭킹이 된다.
    const [records, totalPlayers] = await Promise.all([
      prisma.gameRecord.findMany({
        where: { stage },
        // 같은 clearTime이면 먼저 달성한 사람이 상위
        orderBy: [{ clearTime: "asc" }, { completedAt: "asc" }],
        take: limit,
        select: {
          userId: true,
          clearTime: true,
          hintsUsed: true,
          stars: true,
          completedAt: true,
          user: { select: { nickname: true, name: true, image: true } },
        },
      }),
      prisma.gameRecord.count({ where: { stage } }),
    ]);

    const rankings: RankingEntry[] = records.map((r, index) => ({
      rank: index + 1,
      userId: r.userId,
      displayName: r.user.nickname ?? r.user.name ?? "익명",
      profileImage: r.user.image,
      clearTime: r.clearTime,
      hintsUsed: r.hintsUsed,
      stars: r.stars,
      completedAt: r.completedAt.toISOString(),
    }));

    const responseData: RankingResponseData = {
      stage,
      rankings,
      totalPlayers,
    };

    return NextResponse.json<ApiResponse<RankingResponseData>>(
      { success: true, data: responseData },
      { status: 200 },
    );
  } catch (error) {
    console.error("[ranking] 조회 실패:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "랭킹 조회 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
};
