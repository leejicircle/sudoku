-- (userId, stage)당 1행 사양으로 전환한다.
--
-- ⚠️  이 마이그레이션은 파괴적이다. 3번 단계에서 중복 행을 영구 삭제한다.
--     반드시 백업 후 적용할 것. 순서를 바꾸면 UNIQUE 제약 추가가 실패한다.
--
--   1. 중복 정리: (userId, stage)별 최고 기록 1건만 남기고 삭제
--   2. 기존 비-유니크 인덱스 제거 (유니크 인덱스가 조회도 커버한다)
--   3. UNIQUE(userId, stage) 추가

-- ── 1. 중복 행 정리 ──
-- 보존 기준: clearTime 오름차순 → 동률이면 completedAt 이른 순 (랭킹 타이브레이커와 동일)
--            그래도 동률이면 id 오름차순 (결정적 선택을 위해)
DELETE FROM "game_records" AS g
USING (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "userId", "stage"
            ORDER BY "clearTime" ASC, "completedAt" ASC, "id" ASC
        ) AS rn
    FROM "game_records"
) AS ranked
WHERE g."id" = ranked."id"
  AND ranked.rn > 1;

-- ── 2. DropIndex ──
DROP INDEX "game_records_userId_stage_idx";

-- ── 3. CreateIndex ──
CREATE UNIQUE INDEX "game_records_userId_stage_key" ON "game_records"("userId", "stage");
