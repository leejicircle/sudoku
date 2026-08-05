/**
 * completedAt 검증 테스트
 * — /api/game/clear와 /api/game/sync가 공유하는 신뢰 경계라 경계값만 확인한다.
 */
import { describe, expect, it } from "vitest";
import { validateCompletedAt, validateGuestRecord } from "@/lib/api/guest";
import {
  MAX_COMPLETED_AT_AGE_MS,
  MAX_COMPLETED_AT_FUTURE_SKEW_MS,
} from "@/types/guest";

const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

describe("validateCompletedAt", () => {
  it("정상 ISO 8601은 통과한다", () => {
    expect(validateCompletedAt(iso(-60_000))).toBeNull();
  });

  it("문자열이 아니거나 파싱 불가면 거부한다", () => {
    expect(validateCompletedAt(undefined)).toBeTruthy();
    expect(validateCompletedAt(Date.now())).toBeTruthy();
    expect(validateCompletedAt("나중에")).toBeTruthy();
  });

  it("허용 스큐 이내의 미래는 통과, 초과하면 거부한다", () => {
    expect(
      validateCompletedAt(iso(MAX_COMPLETED_AT_FUTURE_SKEW_MS - 60_000)),
    ).toBeNull();
    expect(
      validateCompletedAt(iso(MAX_COMPLETED_AT_FUTURE_SKEW_MS + 60_000)),
    ).toBeTruthy();
  });

  it("오래된 오프라인 기록은 통과, 상한을 넘으면 거부한다", () => {
    expect(
      validateCompletedAt(iso(-MAX_COMPLETED_AT_AGE_MS + 86_400_000)),
    ).toBeNull();
    expect(
      validateCompletedAt(iso(-MAX_COMPLETED_AT_AGE_MS - 86_400_000)),
    ).toBeTruthy();
    expect(validateCompletedAt(new Date(0).toISOString())).toBeTruthy();
  });

  it("게스트 기록 검증도 같은 규칙을 쓴다", () => {
    const record = {
      id: "a",
      stage: 1,
      clearTime: 100,
      hintsUsed: 0,
      stars: 3,
      completedAt: iso(0),
    };
    expect(validateGuestRecord(record).isValid).toBe(true);
    expect(
      validateGuestRecord({
        ...record,
        completedAt: iso(MAX_COMPLETED_AT_FUTURE_SKEW_MS + 60_000),
      }).isValid,
    ).toBe(false);
  });
});
