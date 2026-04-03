/**
 * POST /api/game/clear
 *
 * 로그인 사용자의 게임 클리어 기록을 저장한다.
 *
 * - 인증 필수 (requireAuth)
 * - 요청 본문: { stage, clearTime, hintsUsed, stars }
 * - 유효성 검증 후 GameRecord 테이블에 저장
 * - 개인 최고 기록 여부를 함께 응답
 *
 * @see docs/adr/204-game-record-schema.md
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import type { GameClearRequest, GameClearResponseData } from "@/types/ranking";
import {
  MIN_STAGE,
  MAX_STAGE,
  MAX_CLEAR_TIME,
  MAX_HINTS,
  MIN_STARS,
  MAX_STARS,
} from "@/types/guest";

// ─── 유효성 검증 ──────────────────────────────────────

const validateClearRequest = (
  body: unknown,
): { valid: true; data: GameClearRequest } | { valid: false; error: string } => {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "유효하지 않은 요청입니다" };
  }

  const b = body as Record<string, unknown>;

  if (
    typeof b.stage !== "number" ||
    !Number.isInteger(b.stage) ||
    b.stage < MIN_STAGE ||
    b.stage > MAX_STAGE
  ) {
    return {
      valid: false,
      error: `스테이지는 ${MIN_STAGE}~${MAX_STAGE} 정수여야 합니다`,
    };
  }

  if (
    typeof b.clearTime !== "number" ||
    !Number.isInteger(b.clearTime) ||
    b.clearTime <= 0 ||
    b.clearTime > MAX_CLEAR_TIME
  ) {
    return {
      valid: false,
      error: `클리어 시간은 1~${MAX_CLEAR_TIME}초 정수여야 합니다`,
    };
  }

  if (
    typeof b.hintsUsed !== "number" ||
    !Number.isInteger(b.hintsUsed) ||
    b.hintsUsed < 0 ||
    b.hintsUsed > MAX_HINTS
  ) {
    return {
      valid: false,
      error: `힌트 사용 횟수는 0~${MAX_HINTS} 정수여야 합니다`,
    };
  }

  if (
    typeof b.stars !== "number" ||
    !Number.isInteger(b.stars) ||
    b.stars < MIN_STARS ||
    b.stars > MAX_STARS
  ) {
    return {
      valid: false,
      error: `별점은 ${MIN_STARS}~${MAX_STARS} 정수여야 합니다`,
    };
  }

  return {
    valid: true,
    data: {
      stage: b.stage,
      clearTime: b.clearTime,
      hintsUsed: b.hintsUsed,
      stars: b.stars,
    },
  };
};

// ─── 핸들러 ───────────────────────────────────────────

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
  const validation = validateClearRequest(body);
  if (!validation.valid) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  const { stage, clearTime, hintsUsed, stars } = validation.data;
  const userId = session.user.id;

  try {
    // ── 4. 기록 저장 ──
    const record = await prisma.gameRecord.create({
      data: {
        userId,
        stage,
        clearTime,
        hintsUsed,
        stars,
        completedAt: new Date(),
      },
      select: { id: true },
    });

    // ── 5. 개인 최고 기록 확인 ──
    const personalBest = await prisma.gameRecord.findFirst({
      where: { userId, stage },
      orderBy: { clearTime: "asc" },
      select: { clearTime: true },
    });

    const personalBestTime = personalBest?.clearTime ?? clearTime;
    const isPersonalBest = clearTime <= personalBestTime;

    // ── 6. 응답 ──
    const responseData: GameClearResponseData = {
      recordId: record.id,
      isPersonalBest,
      personalBestTime,
    };

    return NextResponse.json<ApiResponse<GameClearResponseData>>(
      { success: true, data: responseData },
      { status: 201 },
    );
  } catch (error) {
    console.error("[game/clear] DB 저장 실패:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "기록 저장 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
};
