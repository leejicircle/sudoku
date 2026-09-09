/**
 * GET /api/ranking — 사용자당 최고 기록 1건 보장
 *
 * 중복 제거가 SQL(DISTINCT ON)에서 일어나므로 실제 DB에 붙여야 검증된다.
 * DATABASE_URL이 없는 환경(CI 등)에서는 통째로 건너뛴다.
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

// vitest는 .env를 process.env에 넣어주지 않는다 (Node 20.12+ 내장 API 사용)
try {
  process.loadEnvFile(".env");
} catch {
  // .env 없음 — 아래 skipIf가 처리한다
}

const hasDb = Boolean(process.env.DATABASE_URL);

const fetchRanking = async (stage: number, limit?: number) => {
  const { GET } = await import("@/app/api/ranking/route");
  const url = `http://localhost/api/ranking?stage=${stage}${limit ? `&limit=${limit}` : ""}`;
  const res = await GET(new NextRequest(url));
  const body = await res.json();
  expect(body.success).toBe(true);
  return body.data as import("@/types/ranking").RankingResponseData;
};

describe.skipIf(!hasDb)("GET /api/ranking", () => {
  it("한 사용자는 한 스테이지에서 1번만 등장한다", async () => {
    const { rankings } = await fetchRanking(1, 100);

    const userIds = rankings.map((r) => r.userId);
    expect(new Set(userIds).size).toBe(userIds.length);
  });

  it("중복 행이 있는 사용자는 가장 빠른 기록으로 나온다", async () => {
    // 이 사용자는 stage 1에 128 / 156 / 171 / 171 네 행을 갖고 있다 (UNIQUE 제약 이전 데이터)
    const { rankings } = await fetchRanking(1, 100);

    const mine = rankings.filter(
      (r) => r.userId === "cmnd9nelh0000k1ickjxq3u93",
    );
    expect(mine).toHaveLength(1);
    expect(mine[0].clearTime).toBe(128);
  });

  it("clearTime 오름차순으로 정렬된다", async () => {
    const { rankings } = await fetchRanking(1, 100);

    const times = rankings.map((r) => r.clearTime);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(rankings.map((r) => r.rank)).toEqual(
      rankings.map((_, i) => i + 1),
    );
  });

  it("limit은 중복 제거 후에 적용된다", async () => {
    // 중복 제거 전에 limit이 걸리면 4위~7위를 한 사용자가 차지해 3건만 남는다
    const { rankings, totalPlayers } = await fetchRanking(1, 4);

    expect(rankings).toHaveLength(4);
    expect(new Set(rankings.map((r) => r.userId)).size).toBe(4);
    // totalPlayers는 행 수(7)가 아니라 실제 인원(4)
    expect(totalPlayers).toBe(4);
  });
});
