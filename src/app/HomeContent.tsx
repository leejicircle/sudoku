"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import {
  DifficultyCard,
  ContinueBanner,
  DIFFICULTIES,
} from "@/components/home";
import type { DifficultyItem } from "@/components/home";

// ────────────────────────────────────────
// HomeContent 컴포넌트
// ────────────────────────────────────────

/**
 * 홈 페이지 메인 콘텐츠 (클라이언트)
 *
 * - 타이틀 영역 + 이어하기 배너 + 난이도 카드 4개
 * - 난이도 카드 클릭 → 해당 난이도의 첫 스테이지로 게임 시작
 *
 * @see docs/design/home.md
 */
const HomeContent = () => {
  const router = useRouter();
  const initGame = useGameStore((s) => s.initGame);

  const handleDifficultyPress = useCallback(
    (difficulty: DifficultyItem) => {
      // TODO: 잠금 상태 확인 → 잠금된 난이도면 팝오버 표시
      // 현재는 모든 난이도 해금 상태로 처리
      initGame(difficulty.startStage);
      router.push(`/game?stage=${difficulty.startStage}`);
    },
    [initGame, router],
  );

  return (
    <div className="flex flex-1 flex-col px-4 py-6 md:px-6">
      {/* ── 타이틀 영역 ── */}
      <div className="mb-8 text-center">
        <h1 className="text-(length:--text-display) font-bold text-foreground">
          스도쿠
        </h1>
        <p className="mt-1 text-(length:--text-caption) text-muted-foreground">
          매일 새로운 퍼즐에 도전하세요
        </p>
      </div>

      {/* ── 카드 영역 (max-w 제한) ── */}
      <div className="mx-auto w-full max-w-[600px]">
        {/* 이어하기 배너 (진행 중인 게임이 있을 때만 표시) */}
        <ContinueBanner />

        {/* 난이도 카드 목록 */}
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          {DIFFICULTIES.map((difficulty) => (
            <DifficultyCard
              key={difficulty.id}
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
  );
};

export default HomeContent;
