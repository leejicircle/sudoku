/**
 * GET /api/ranking/me
 *
 * 로그인 사용자의 스테이지별 최고 기록을 조회한다.
 *
 * ⚠️ UNIQUE(userId, stage) 이전 데이터에는 한 스테이지에 여러 행이 남아 있다.
 *    그대로 읽으면 같은 스테이지가 중복되고 clearedStages도 부풀려지므로
 *    /api/ranking과 동일하게 DISTINCT ON으로 스테이지당 1건만 뽑는다.
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
    // DISTINCT ON (stage)으로 스테이지당 최고 기록 1건만 남긴다.
    // 판정 기준은 랭킹과 동일: 빠른 순 → 동률이면 먼저 달성한 쪽.
    const bestRecords = await prisma.$queryRaw<
      {
        stage: number;
        clearTime: number;
        hintsUsed: number;
        stars: number;
        completedAt: Date;
      }[]
    >`
      SELECT DISTINCT ON ("stage")
        "stage", "clearTime", "hintsUsed", "stars", "completedAt"
      FROM "game_records"
      WHERE "userId" = ${userId}
      ORDER BY "stage" ASC, "clearTime" ASC, "completedAt" ASC
    `;

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
