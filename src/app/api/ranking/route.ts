/**
 * GET /api/ranking?stage=1&limit=20
 *
 * 특정 스테이지의 랭킹(최단 클리어 시간)을 조회한다.
 *
 * ⚠️ (userId, stage) UNIQUE 제약(20260806000000_record_unique_user_stage)이 붙기 전
 *    데이터가 운영 DB에 남아 있어, 같은 사용자가 한 스테이지에 여러 행을 갖는다.
 *    기록을 지우지 않기로 했으므로 조회 단계에서 사용자당 최고 기록 1건만 뽑는다.
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

/** DISTINCT ON 쿼리가 돌려주는 원시 행 (game_records + users 조인) */
interface RankingRow {
  userId: string;
  clearTime: number;
  hintsUsed: number;
  stars: number;
  completedAt: Date;
  nickname: string | null;
  name: string | null;
  image: string | null;
}

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
    // Postgres DISTINCT ON으로 사용자당 최고 기록 1건만 남긴 뒤 정렬·자른다.
    // Prisma의 `distinct`는 커넥터에 따라 메모리에서 처리돼 `take`와 조합하면
    // limit이 중복 제거 전에 적용되므로 쓰지 않는다.
    const [rows, [{ count }]] = await Promise.all([
      prisma.$queryRaw<RankingRow[]>`
        SELECT b.* FROM (
          SELECT DISTINCT ON (r."userId")
            r."userId", r."clearTime", r."hintsUsed", r."stars", r."completedAt",
            u."nickname", u."name", u."image"
          FROM "game_records" r
          JOIN "users" u ON u."id" = r."userId"
          WHERE r."stage" = ${stage}
          -- 사용자별 최고 기록 판정: 빠른 순 → 동률이면 먼저 달성한 쪽
          ORDER BY r."userId", r."clearTime" ASC, r."completedAt" ASC
        ) b
        -- 랭킹 정렬: 같은 clearTime이면 먼저 달성한 사람이 상위
        ORDER BY b."clearTime" ASC, b."completedAt" ASC
        LIMIT ${limit}
      `,
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT "userId")::int AS count
        FROM "game_records"
        WHERE "stage" = ${stage}
      `,
    ]);

    const rankings: RankingEntry[] = rows.map((r, index) => ({
      rank: index + 1,
      userId: r.userId,
      displayName: r.nickname ?? r.name ?? "익명",
      profileImage: r.image,
      clearTime: r.clearTime,
      hintsUsed: r.hintsUsed,
      stars: r.stars,
      completedAt: r.completedAt.toISOString(),
    }));

    const responseData: RankingResponseData = {
      stage,
      rankings,
      // 행 수가 아니라 실제 참여 인원 (중복 제거)
      totalPlayers: count,
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
