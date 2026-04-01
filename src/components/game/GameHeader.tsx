"use client";

import { useCallback } from "react";
import { Pause, Play } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { STAGE_RANGES } from "@/types/game";
import { AppLayout } from "@/components/layout";
import Timer from "./Timer";

// ────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────

/** 스테이지 번호로 난이도 라벨 + 색상 클래스를 반환 */
const getDifficultyInfo = (
  stage: number,
): { label: string; colorClass: string } => {
  for (const range of STAGE_RANGES) {
    if (stage >= range.startStage && stage <= range.endStage) {
      const colorMap: Record<string, string> = {
        입문: "text-difficulty-easy",
        초급: "text-difficulty-easy",
        중급: "text-difficulty-medium",
        고급: "text-difficulty-hard",
        마스터: "text-difficulty-expert",
      };
      return {
        label: range.label,
        colorClass: colorMap[range.label] ?? "text-muted-foreground",
      };
    }
  }
  return { label: "알 수 없음", colorClass: "text-muted-foreground" };
};

// ────────────────────────────────────────
// Props
// ────────────────────────────────────────

interface GameHeaderProps {
  children: React.ReactNode;
}

// ────────────────────────────────────────
// GameHeader 컴포넌트
// ────────────────────────────────────────

/**
 * 게임 전용 레이아웃 래퍼
 *
 * Header variant="game"에 난이도 라벨 + 타이머 (중앙) +
 * 일시정지/재개 버튼 (우측)을 배치한다.
 * BottomNav는 자동 숨김 (/game 경로).
 *
 * @see docs/design/game.md §2 Header (게임 전용)
 */
const GameHeader = ({ children }: GameHeaderProps) => {
  const stage = useGameStore((s) => s.stage);
  const isPaused = useGameStore((s) => s.isPaused);
  const isComplete = useGameStore((s) => s.isComplete);
  const isStarted = useGameStore((s) => s.isStarted);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);

  const { label, colorClass } = getDifficultyInfo(stage);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  // ── 중앙: 난이도 라벨 + 타이머 ──
  const centerSlot = isStarted ? (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${colorClass}`}>
        {label}
      </span>
      <span className="text-muted-foreground" aria-hidden="true">·</span>
      <Timer />
    </div>
  ) : null;

  // ── 우측: 일시정지/재개 버튼 ──
  const rightSlot = isStarted && !isComplete ? (
    <button
      type="button"
      onClick={handlePauseToggle}
      aria-label={isPaused ? "게임 재개" : "일시정지"}
      className={
        "flex items-center justify-center size-11 rounded-lg " +
        "text-foreground " +
        "transition-colors duration-(--duration-fast) " +
        "hover:bg-accent"
      }
    >
      {isPaused ? (
        <Play size={20} strokeWidth={2} />
      ) : (
        <Pause size={20} strokeWidth={2} />
      )}
    </button>
  ) : undefined;

  return (
    <AppLayout
      headerVariant="game"
      centerContent={centerSlot}
      rightContent={rightSlot}
    >
      {children}
    </AppLayout>
  );
};

export default GameHeader;
