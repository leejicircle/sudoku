/**
 * 게임 기록 저장 헬퍼
 *
 * `GameRecord`는 (userId, stage)당 1행만 보관하고, 더 빠른 기록일 때만 갱신한다.
 * Prisma의 `upsert`는 update 블록에 조건을 넣을 수 없어 raw SQL로 처리한다.
 *
 * @see prisma/migrations/20260806000000_record_unique_user_stage
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** 저장할 클리어 기록 1건 */
export interface ClearRecordInput {
  stage: number;
  clearTime: number;
  hintsUsed: number;
  stars: number;
  completedAt: Date;
}

/**
 * 같은 스테이지가 여러 건이면 가장 빠른 것만 남긴다.
 * 동률이면 completedAt이 이른 것 (랭킹 타이브레이커와 동일 기준).
 *
 * `upsertBestRecords`는 한 문장에 같은 (userId, stage)가 두 번 들어오면
 * Postgres가 거부하므로("cannot affect row a second time") 호출 전 필수.
 */
export const bestPerStage = <T extends ClearRecordInput>(records: T[]): T[] => {
  const best = new Map<number, T>();

  for (const r of records) {
    const prev = best.get(r.stage);
    const isBetter =
      !prev ||
      r.clearTime < prev.clearTime ||
      (r.clearTime === prev.clearTime && r.completedAt < prev.completedAt);

    if (isBetter) best.set(r.stage, r);
  }

  return [...best.values()];
};

/**
 * 기록을 저장하되, 기존 기록보다 빠를 때만 갱신한다 (원자적 단일 쿼리).
 *
 * @returns 실제로 저장/갱신된 행. 기존 기록이 더 빠르면 그 스테이지는 포함되지 않는다.
 */
export const upsertBestRecords = async (
  userId: string,
  records: ClearRecordInput[],
): Promise<{ id: string; stage: number }[]> => {
  if (records.length === 0) return [];

  const values = records.map(
    (r) =>
      // ponytail: id는 cuid 대신 crypto.randomUUID(). TEXT 컬럼이라 형식 무관하고
      // cuid 생성기를 별도 의존성으로 추가할 이유가 없다.
      Prisma.sql`(${crypto.randomUUID()}, ${userId}, ${r.stage}, ${r.clearTime}, ${r.hintsUsed}, ${r.stars}, ${r.completedAt}, NOW(), NOW())`,
  );

  return prisma.$queryRaw<{ id: string; stage: number }[]>`
    INSERT INTO "game_records" (
      "id", "userId", "stage", "clearTime", "hintsUsed", "stars",
      "completedAt", "createdAt", "updatedAt"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("userId", "stage") DO UPDATE SET
      "clearTime"   = EXCLUDED."clearTime",
      "hintsUsed"   = EXCLUDED."hintsUsed",
      "stars"       = EXCLUDED."stars",
      "completedAt" = EXCLUDED."completedAt",
      "updatedAt"   = NOW()
    WHERE EXCLUDED."clearTime" < "game_records"."clearTime"
    RETURNING "id", "stage"
  `;
};
