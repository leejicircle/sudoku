-- CreateTable
CREATE TABLE "game_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" SMALLINT NOT NULL,
    "clearTime" INTEGER NOT NULL,
    "hintsUsed" SMALLINT NOT NULL,
    "stars" SMALLINT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_records_userId_idx" ON "game_records"("userId");

-- CreateIndex
CREATE INDEX "game_records_stage_clearTime_idx" ON "game_records"("stage", "clearTime");

-- CreateIndex
CREATE INDEX "game_records_userId_stage_idx" ON "game_records"("userId", "stage");

-- AddForeignKey
ALTER TABLE "game_records" ADD CONSTRAINT "game_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
