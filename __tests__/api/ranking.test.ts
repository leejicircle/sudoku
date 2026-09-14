/**
 * GET /api/ranking — 사용자당 최고 기록 1건 보장
 *
 * 중복 제거가 SQL(DISTINCT ON)에서 일어나므로 실제 DB에 붙여야 검증된다.
 * 같은 이유로 이 파일은 `__tests__/api/`의 다른 순수 단위 테스트와 성격이 다르다.
 *
 * ⚠️ .env의 DATABASE_URL은 운영 DB를 가리킨다. 기본 `pnpm test`가 운영 DB를 읽지
 *    않도록 RANKING_DB_TEST=1 을 준 경우에만 실행한다 (읽기 전용이지만 CI·오프라인에서
 *    깨지고, 남의 운영 커넥션을 쓰는 걸 기본값으로 두지 않는다).
 *
 *      RANKING_DB_TEST=1 pnpm vitest run __tests__/api/ranking.test.ts
 *
 * 단언은 전부 데이터 비의존이다. 특정 사용자 ID·행 수·clearTime 값을 박으면
 * 누군가 한 판 더 깨는 순간 깨지는 스냅샷이 된다. 검증 대상은 값이 아니라 성질:
 *   1. 한 사용자는 한 스테이지에서 1번만 등장
 *   2. 등장하는 기록은 그 사용자의 해당 스테이지 최소 clearTime
 *   3. clearTime 오름차순 + rank 연속
 *   4. limit은 중복 제거 '후'에 적용 (= min(limit, totalPlayers)건)
 */

import { describe, it, expect, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { MIN_STAGE, MAX_STAGE } from "@/types/guest";

// vitest는 .env를 process.env에 넣어주지 않는다 (Node 20.12+ 내장 API 사용)
try {
  process.loadEnvFile(".env");
} catch {
  // .env 없음 — 아래 skipIf가 처리한다
}

const enabled =
  process.env.RANKING_DB_TEST === "1" && Boolean(process.env.DATABASE_URL);

const fetchRanking = async (stage: number, limit?: number) => {
  const { GET } = await import("@/app/api/ranking/route");
  const url = `http://localhost/api/ranking?stage=${stage}${limit ? `&limit=${limit}` : ""}`;
  const res = await GET(new NextRequest(url));
  const body = await res.json();
  expect(body.success).toBe(true);
  return body.data as import("@/types/ranking").RankingResponseData;
};

/** 기록이 가장 많이 쌓인 스테이지. 데이터가 하나도 없으면 null */
const busiestStage = async () => {
  const [row] = await prisma.$queryRaw<{ stage: number }[]>`
    SELECT "stage"
    FROM "game_records"
    WHERE "stage" BETWEEN ${MIN_STAGE} AND ${MAX_STAGE}
    GROUP BY "stage"
    ORDER BY COUNT(*) DESC, "stage" ASC
    LIMIT 1
  `;
  return row?.stage ?? null;
};

describe.skipIf(!enabled)("GET /api/ranking", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("한 사용자는 한 스테이지에서 1번만 등장한다", async () => {
    const stage = await busiestStage();
    if (stage === null) return; // 기록 없는 DB — 검증할 게 없다

    const { rankings } = await fetchRanking(stage, 100);

    const userIds = rankings.map((r) => r.userId);
    expect(new Set(userIds).size).toBe(userIds.length);
  });

  it("각 사용자는 자신의 최단 기록으로 등장한다", async () => {
    const stage = await busiestStage();
    if (stage === null) return;

    const { rankings } = await fetchRanking(stage, 100);
    if (rankings.length === 0) return;

    // 응답에 실린 clearTime이 그 사용자의 해당 스테이지 최소값과 일치해야 한다.
    // (중복 행이 있든 없든 성립하므로 특정 사용자를 고를 필요가 없다)
    const mins = await prisma.$queryRaw<{ userId: string; min: number }[]>`
      SELECT "userId", MIN("clearTime")::int AS min
      FROM "game_records"
      WHERE "stage" = ${stage}
      GROUP BY "userId"
    `;
    const minByUser = new Map(mins.map((m) => [m.userId, m.min]));

    for (const r of rankings) {
      expect(r.clearTime).toBe(minByUser.get(r.userId));
    }
  });

  it("clearTime 오름차순으로 정렬되고 rank가 1부터 연속이다", async () => {
    const stage = await busiestStage();
    if (stage === null) return;

    const { rankings } = await fetchRanking(stage, 100);

    const times = rankings.map((r) => r.clearTime);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(rankings.map((r) => r.rank)).toEqual(rankings.map((_, i) => i + 1));
  });

  it("limit은 중복 제거 후에 적용된다", async () => {
    const stage = await busiestStage();
    if (stage === null) return;

    // 전체 인원을 먼저 알아낸 뒤, 그보다 작은 limit으로 다시 부른다.
    // 중복 제거 전에 limit이 걸리면 한 사용자가 여러 슬롯을 먹어 결과가 모자란다.
    const { totalPlayers } = await fetchRanking(stage, 100);
    if (totalPlayers === 0) return;

    const limit = Math.max(1, totalPlayers - 1);
    const { rankings } = await fetchRanking(stage, limit);

    expect(rankings).toHaveLength(Math.min(limit, totalPlayers));
    expect(new Set(rankings.map((r) => r.userId)).size).toBe(rankings.length);
  });
});
