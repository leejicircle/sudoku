/**
 * POST /api/game/sync
 *
 * 게스트(비로그인) 상태에서 쌓인 게임 클리어 기록을
 * 로그인 후 서버로 일괄 동기화하는 엔드포인트.
 *
 * - 인증 필수 (requireAuth)
 * - 요청 본문: { records: GuestGameRecord[] }
 * - 각 레코드를 유효성 검증 후 GameRecord 테이블에 저장
 * - 중복/유효하지 않은 건은 스킵하고 개별 결과를 응답
 *
 * @see docs/adr/203-guest-mode.md
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { validateSyncRequest } from "@/lib/api/guest";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import type { GuestSyncResponseData } from "@/types/guest";

export const POST = async (req: Request) => {
  // ── 1. 인증 검증 ──
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "로그인이 필요합니다" },
      { status: 401 },
    );
  }

  // ── 2. 요청 본문 파싱 ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "유효하지 않은 JSON 형식입니다" },
      { status: 400 },
    );
  }

  // ── 3. 유효성 검증 ──
  const { validRecords, results } = validateSyncRequest(body);

  if (results.length === 0) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "동기화할 기록이 없습니다" },
      { status: 400 },
    );
  }

  // ── 4. DB 저장 ──
  const userId = session.user.id;

  try {
    await prisma.gameRecord.createMany({
      data: validRecords.map((r) => ({
        userId,
        stage: r.stage,
        clearTime: r.clearTime,
        hintsUsed: r.hintsUsed,
        stars: r.stars,
        completedAt: new Date(r.completedAt),
      })),
    });

    // 저장 성공 → pending 상태를 synced로 전환
    for (const result of results) {
      if (result.status === "pending") {
        result.status = "synced";
      }
    }
  } catch (error) {
    console.error("[sync] DB 저장 실패:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "기록 저장 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }

  // ── 5. 응답 ──
  const synced = results.filter((r) => r.status === "synced").length;
  const pending = results.filter((r) => r.status === "pending").length;
  const duplicates = results.filter((r) => r.status === "duplicate").length;
  const invalid = results.filter((r) => r.status === "invalid").length;

  const responseData: GuestSyncResponseData = {
    total: results.length,
    synced,
    pending,
    duplicates,
    invalid,
    results,
  };

  return NextResponse.json<ApiResponse<GuestSyncResponseData>>(
    { success: true, data: responseData },
    { status: 200 },
  );
};
