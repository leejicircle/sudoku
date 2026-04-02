/**
 * 게스트 모드 서버 사이드 헬퍼
 *
 * 게스트 기록 유효성 검증, 동기화 처리 등
 * API Route에서 사용하는 서버 전용 유틸리티.
 *
 * @see docs/adr/203-guest-mode.md
 */

import type { Session } from "next-auth";
import type {
  GuestGameRecord,
  GuestRecordValidation,
  GuestSyncResultItem,
} from "@/types/guest";
import {
  MIN_STAGE,
  MAX_STAGE,
  MAX_CLEAR_TIME,
  MAX_HINTS,
  MIN_STARS,
  MAX_STARS,
  GUEST_MAX_RECORDS,
} from "@/types/guest";

// ─── 세션 판별 ────────────────────────────────────────

/**
 * 세션이 없는(비로그인) 게스트인지 판별
 *
 * @example
 * ```ts
 * const session = await auth();
 * if (isGuest(session)) {
 *   // 게스트 처리
 * }
 * ```
 */
export const isGuest = (session: Session | null): session is null => {
  return !session?.user?.id;
};

/**
 * 세션이 인증된 사용자인지 판별 (isGuest 역)
 */
export const isAuthenticated = (
  session: Session | null,
): session is Session => {
  return !isGuest(session);
};

// ─── 유효성 검증 ──────────────────────────────────────

/**
 * 개별 게스트 기록의 유효성을 검증
 *
 * 클라이언트에서 전송된 기록이 조작되지 않았는지 기본 검증.
 * 모든 필드가 올바른 범위 내에 있는지 확인한다.
 */
export const validateGuestRecord = (
  record: unknown,
): GuestRecordValidation => {
  // 객체 타입 체크
  if (!record || typeof record !== "object") {
    return { isValid: false, reason: "기록이 유효한 객체가 아닙니다" };
  }

  const r = record as Record<string, unknown>;

  // id: string, 비어있지 않음
  if (typeof r.id !== "string" || r.id.trim().length === 0) {
    return { isValid: false, reason: "유효하지 않은 기록 ID" };
  }

  // stage: 1~50 정수
  if (
    typeof r.stage !== "number" ||
    !Number.isInteger(r.stage) ||
    r.stage < MIN_STAGE ||
    r.stage > MAX_STAGE
  ) {
    return {
      isValid: false,
      reason: `스테이지는 ${MIN_STAGE}~${MAX_STAGE} 정수여야 합니다`,
    };
  }

  // clearTime: 1~MAX_CLEAR_TIME 정수
  if (
    typeof r.clearTime !== "number" ||
    !Number.isInteger(r.clearTime) ||
    r.clearTime <= 0 ||
    r.clearTime > MAX_CLEAR_TIME
  ) {
    return {
      isValid: false,
      reason: `클리어 시간은 1~${MAX_CLEAR_TIME}초 정수여야 합니다`,
    };
  }

  // hintsUsed: 0~MAX_HINTS 정수
  if (
    typeof r.hintsUsed !== "number" ||
    !Number.isInteger(r.hintsUsed) ||
    r.hintsUsed < 0 ||
    r.hintsUsed > MAX_HINTS
  ) {
    return {
      isValid: false,
      reason: `힌트 사용 횟수는 0~${MAX_HINTS} 정수여야 합니다`,
    };
  }

  // stars: 1~3 정수
  if (
    typeof r.stars !== "number" ||
    !Number.isInteger(r.stars) ||
    r.stars < MIN_STARS ||
    r.stars > MAX_STARS
  ) {
    return {
      isValid: false,
      reason: `별점은 ${MIN_STARS}~${MAX_STARS} 정수여야 합니다`,
    };
  }

  // completedAt: 유효한 ISO 8601 날짜
  if (typeof r.completedAt !== "string") {
    return { isValid: false, reason: "클리어 일시가 문자열이 아닙니다" };
  }

  const date = new Date(r.completedAt);
  if (isNaN(date.getTime())) {
    return { isValid: false, reason: "클리어 일시가 유효한 날짜가 아닙니다" };
  }

  // 미래 날짜 방지 (1분 여유)
  if (date.getTime() > Date.now() + 60_000) {
    return { isValid: false, reason: "클리어 일시가 미래입니다" };
  }

  return { isValid: true };
};

/**
 * 동기화 요청 전체의 유효성을 검증
 *
 * @returns 유효한 기록과 개별 결과를 반환
 */
export const validateSyncRequest = (
  body: unknown,
): {
  validRecords: GuestGameRecord[];
  results: GuestSyncResultItem[];
} => {
  const validRecords: GuestGameRecord[] = [];
  const results: GuestSyncResultItem[] = [];

  // body 검증
  if (!body || typeof body !== "object") {
    return { validRecords, results };
  }

  const { records } = body as { records?: unknown };

  if (!Array.isArray(records)) {
    return { validRecords, results };
  }

  // 최대 개수 제한
  const limited = records.slice(0, GUEST_MAX_RECORDS);

  // 중복 ID 감지 (같은 요청 내)
  const seenIds = new Set<string>();

  for (const record of limited) {
    const validation = validateGuestRecord(record);
    const r = record as GuestGameRecord;

    if (!validation.isValid) {
      results.push({
        guestRecordId: r?.id ?? "unknown",
        status: "invalid",
      });
      continue;
    }

    // 요청 내 중복 ID 체크
    if (seenIds.has(r.id)) {
      results.push({
        guestRecordId: r.id,
        status: "duplicate",
      });
      continue;
    }

    seenIds.add(r.id);
    validRecords.push(r);
    // DB 저장 전까지는 "pending", 실제 저장 완료 후 "synced"로 변경
    // → Epic #6에서 DB 연결 시 이 status를 "synced"로 전환
    results.push({
      guestRecordId: r.id,
      status: "pending",
    });
  }

  return { validRecords, results };
};
