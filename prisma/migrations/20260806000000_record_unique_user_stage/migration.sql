-- (userId, stage)당 1행 사양으로 전환한다.
--
-- 중복 행은 삭제하지 않고 game_records_archive 로 옮긴다. 사용자가 실제로 플레이한
-- 기록이라 영구 삭제하지 않는다. 이동은 단일 CTE(DELETE ... RETURNING → INSERT)라
-- 원본에서 빠진 행이 반드시 아카이브에 들어가고, 중간 상태가 남을 수 없다.
--
--   1. 아카이브 테이블 생성
--   2. (userId, stage)별 최고 1건만 남기고 나머지를 아카이브로 이동
--   3. 기존 비-유니크 인덱스 제거 (유니크 인덱스가 조회도 커버한다)
--   4. UNIQUE(userId, stage) 추가

-- ── 1. CreateTable ──
-- FK를 걸지 않는다. 아카이브는 원본 user가 지워져도 남아야 하는 보관소다.
-- 인덱스도 두지 않는다 — 앱이 읽지 않고, 사람이 가끔 훑어보는 용도다.
CREATE TABLE "game_records_archive" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" SMALLINT NOT NULL,
    "clearTime" INTEGER NOT NULL,
    "hintsUsed" SMALLINT NOT NULL,
    "stars" SMALLINT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_records_archive_pkey" PRIMARY KEY ("id")
);

-- ── 2. 중복 행 아카이브 이동 ──
-- 보존 기준: clearTime 오름차순 → 동률이면 completedAt 이른 순 (랭킹 타이브레이커와 동일)
--            그래도 동률이면 id 오름차순 (결정적 선택을 위해)
WITH ranked AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "userId", "stage"
            ORDER BY "clearTime" ASC, "completedAt" ASC, "id" ASC
        ) AS rn
    FROM "game_records"
),
moved AS (
    DELETE FROM "game_records" AS g
    USING ranked
    WHERE g."id" = ranked."id"
      AND ranked.rn > 1
    RETURNING g.*
)
INSERT INTO "game_records_archive" (
    "id", "userId", "stage", "clearTime", "hintsUsed", "stars",
    "completedAt", "createdAt", "updatedAt"
)
SELECT
    "id", "userId", "stage", "clearTime", "hintsUsed", "stars",
    "completedAt", "createdAt", "updatedAt"
FROM moved;

-- ── 3. DropIndex ──
DROP INDEX "game_records_userId_stage_idx";

-- ── 4. CreateIndex ──
CREATE UNIQUE INDEX "game_records_userId_stage_key" ON "game_records"("userId", "stage");
