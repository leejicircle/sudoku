/**
 * GET /api/ranking?stage=1&limit=20
 *
 * 특정 스테이지의 랭킹(최단 클리어 시간)을 조회한다.
 * 사용자별 최고 기록만 추출하여 순위를 매긴다.
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
    // ── 2. 사용자별 최고 기록 조회 ──
    // 각 사용자의 해당 스테이지 최단 클리어 시간 기록을 가져온다.
    // Prisma에서 groupBy + min 후 상세 정보를 가져오는 2단계 쿼리.

    // 2-1. 사용자별 최소 clearTime 추출
    const bestTimes = await prisma.gameRecord.groupBy({
      by: ["userId"],
      where: { stage },
      _min: { clearTime: true },
    });

    if (bestTimes.length === 0) {
      const responseData: RankingResponseData = {
        stage,
        rankings: [],
        totalPlayers: 0,
      };
      return NextResponse.json<ApiResponse<RankingResponseData>>(
        { success: true, data: responseData },
        { status: 200 },
      );
    }

    // 2-2. 각 사용자의 최고 기록 상세 정보 조회
    const records = await prisma.gameRecord.findMany({
      where: {
        stage,
        OR: bestTimes.map((bt) => ({
          userId: bt.userId,
          clearTime: bt._min.clearTime!,
        })),
      },
      // 같은 clearTime 기록이 복수일 때 가장 먼저 달성한 것 선택
      orderBy: [{ clearTime: "asc" }, { completedAt: "asc" }],
      select: {
        userId: true,
        clearTime: true,
        hintsUsed: true,
        stars: true,
        completedAt: true,
        user: {
          select: {
            nickname: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 2-3. 사용자별 중복 제거 (가장 빠른 기록만)
    const seenUsers = new Set<string>();
    const uniqueRecords = records.filter((r) => {
      if (seenUsers.has(r.userId)) return false;
      seenUsers.add(r.userId);
      return true;
    });

    // 2-4. limit 적용 + 순위 부여
    const rankings: RankingEntry[] = uniqueRecords
      .slice(0, limit)
      .map((r, index) => ({
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
      totalPlayers: bestTimes.length,
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
