"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { STAGE_RANGES } from "@/types/game";
import { useGameStore } from "@/stores/game-store";
import {
  DifficultyCard,
  ContinueBanner,
  DIFFICULTIES,
} from "@/components/home";
import type { DifficultyItem } from "@/components/home";
import { BrandWordmark } from "@/components/layout";

/** 간행 캡션에 표시할 총 스테이지 수 */
const TOTAL_STAGES = STAGE_RANGES[STAGE_RANGES.length - 1].endStage;

const HomeContent = () => {
  const router = useRouter();
  const initGame = useGameStore((s) => s.initGame);

  const handleDifficultyPress = useCallback(
    (difficulty: DifficultyItem) => {
      initGame(difficulty.startStage);
      router.push(`/game?stage=${difficulty.startStage}`);
    },
    [initGame, router],
  );

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="relative flex flex-1 flex-col px-4 py-8 md:px-6 md:py-12">
        {/* ── 히어로 ── */}
        <header className="mx-auto mb-10 w-full max-w-[760px] text-center md:mb-14">
          {/* 간행 정보 줄 — pill·아이콘·배경 없이 대문자 모노 + 넓은 자간만 */}
          <p className="mb-4 font-mono text-(length:--text-small) tracking-[0.2em] uppercase text-muted-foreground">
            Daily Puzzle · {TOTAL_STAGES} Stages
          </p>

          {/* 메인 타이틀 — 아래 1px 괘선이 표제 밑줄 역할 */}
          <h1 className="mx-auto max-w-[420px] border-b border-border pb-4">
            <BrandWordmark size="lg" />
          </h1>
        </header>

        {/* ── 카드 영역 ── */}
        <div className="mx-auto w-full max-w-[600px]">
          <ContinueBanner />

          {/* 섹션 라벨 */}
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-(length:--text-caption) font-semibold tracking-wide text-foreground">
              난이도 선택
            </h2>
            <span className="font-mono text-(length:--text-small) text-muted-foreground">
              {DIFFICULTIES.length} LEVELS
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {DIFFICULTIES.map((difficulty, index) => (
              <DifficultyCard
                key={difficulty.id}
                index={index}
                difficulty={difficulty}
                isLocked={false}
                bestTime={null}
                stars={null}
                onPress={handleDifficultyPress}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
