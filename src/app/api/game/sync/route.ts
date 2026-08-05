/**
 * POST /api/game/sync
 *
 * 게스트(비로그인) 상태에서 쌓인 게임 클리어 기록을
 * 로그인 후 서버로 일괄 동기화하는 엔드포인트.
 *
 * - 인증 필수 (requireAuth)
 * - 요청 본문: { records: GuestGameRecord[] }
 * - (userId, stage)당 1행이므로 스테이지별 최고 기록만, 그것도 기존보다 빠를 때만 저장
 * - 밀린 기록/유효하지 않은 건은 스킵하고 개별 결과를 응답
 *
 * @see docs/adr/203-guest-mode.md
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { validateSyncRequest } from "@/lib/api/guest";
import { bestPerStage, upsertBestRecords } from "@/lib/api/records";
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
    // (userId, stage)당 1행이므로 배치 내 같은 스테이지는 가장 빠른 것만 남긴다.
    const candidates = bestPerStage(
      validRecords.map((r) => ({
        guestRecordId: r.id,
        stage: r.stage,
        clearTime: r.clearTime,
        hintsUsed: r.hintsUsed,
        stars: r.stars,
        completedAt: new Date(r.completedAt),
      })),
    );

    // DB의 기존 기록보다 빠른 건만 실제로 저장된다
    const saved = await upsertBestRecords(userId, candidates);
    const savedStages = new Set(saved.map((s) => s.stage));
    const syncedIds = new Set(
      candidates
        .filter((c) => savedStages.has(c.stage))
        .map((c) => c.guestRecordId),
    );

    // 저장된 건만 synced, 더 느려서 밀린 건은 duplicate(중복 스킵)
    for (const result of results) {
      if (result.status === "pending") {
        result.status = syncedIds.has(result.guestRecordId)
          ? "synced"
          : "duplicate";
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
