/**
 * bestPerStage — 배치 내 스테이지별 최고 기록 선별
 *
 * upsertBestRecords는 한 문장에 같은 (userId, stage)가 두 번 들어오면 Postgres가
 * 거부하므로, 이 선별이 깨지면 게스트 동기화가 통째로 실패한다.
 */

import { describe, it, expect } from "vitest";
import { bestPerStage } from "@/lib/api/records";

const rec = (stage: number, clearTime: number, completedAt: string) => ({
  stage,
  clearTime,
  hintsUsed: 0,
  stars: 3,
  completedAt: new Date(completedAt),
});

describe("bestPerStage", () => {
  it("스테이지별로 1건씩만 남긴다", () => {
    const result = bestPerStage([
      rec(1, 100, "2026-01-01T00:00:00Z"),
      rec(1, 80, "2026-01-02T00:00:00Z"),
      rec(2, 50, "2026-01-03T00:00:00Z"),
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.stage).sort()).toEqual([1, 2]);
  });

  it("같은 스테이지에서 가장 빠른 기록을 고른다", () => {
    const result = bestPerStage([
      rec(1, 100, "2026-01-01T00:00:00Z"),
      rec(1, 42, "2026-01-02T00:00:00Z"),
      rec(1, 77, "2026-01-03T00:00:00Z"),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].clearTime).toBe(42);
  });

  it("시간이 동률이면 먼저 달성한 기록을 고른다", () => {
    const result = bestPerStage([
      rec(1, 60, "2026-01-05T00:00:00Z"),
      rec(1, 60, "2026-01-01T00:00:00Z"),
    ]);

    expect(result[0].completedAt.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("빈 배열은 빈 배열", () => {
    expect(bestPerStage([])).toEqual([]);
  });
});
