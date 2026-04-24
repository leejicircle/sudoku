"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import {
  DifficultyCard,
  ContinueBanner,
  DIFFICULTIES,
} from "@/components/home";
import type { DifficultyItem } from "@/components/home";

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
          {/* Eyebrow */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sudoku-primary/25 bg-sudoku-primary/10 px-3 py-1 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-sudoku-primary" />
            <span className="text-(length:--text-small) font-medium tracking-wide text-sudoku-primary">
              매일 새로운 퍼즐
            </span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="animate-text-shimmer font-mono text-[clamp(1.4rem,5vw,2.75rem)] font-black tracking-[0.1em] whitespace-nowrap">
            S · U · D · O · K · U
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
