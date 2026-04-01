"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Home } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { Button } from "@/components/ui/button";

// ────────────────────────────────────────
// PauseOverlay 컴포넌트
// ────────────────────────────────────────

/**
 * 일시정지 오버레이
 *
 * isPaused === true일 때 게임 화면 위에 표시.
 * Board는 blur(12px) 처리 (Board 자체에서 담당).
 *
 * - 배경: background/80% + backdrop-blur 8px
 * - "계속하기" (Primary) + "홈으로" (Ghost)
 * - fade-in 300ms 애니메이션
 *
 * @see docs/design/game.md §6 일시정지 오버레이
 */
const PauseOverlay = () => {
  const router = useRouter();

  const isPaused = useGameStore((s) => s.isPaused);
  const isComplete = useGameStore((s) => s.isComplete);
  const resume = useGameStore((s) => s.resume);

  const handleResume = useCallback(() => {
    resume();
  }, [resume]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  // 일시정지 상태가 아니거나 완료 상태면 표시 안 함
  if (!isPaused || isComplete) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[var(--z-modal-overlay)] " +
        "flex flex-col items-center justify-center " +
        "bg-background/80 backdrop-blur " +
        "animate-in fade-in duration-[var(--duration-slow)]"
      }
      role="dialog"
      aria-label="일시정지"
      aria-modal="true"
    >
      {/* 아이콘 + 제목 */}
      <Pause
        size={48}
        strokeWidth={1.5}
        className="text-muted-foreground mb-4"
        aria-hidden="true"
      />
      <h2 className="text-(length:--text-heading) font-semibold text-foreground mb-8">
        일시정지
      </h2>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        <Button
          variant="default"
          className="h-12 w-full gap-2 text-base bg-sudoku-primary hover:bg-sudoku-primary/90"
          onClick={handleResume}
        >
          <Play size={20} />
          계속하기
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full gap-2 text-base"
          onClick={handleGoHome}
        >
          <Home size={20} />
          홈으로
        </Button>
      </div>
    </div>
  );
};

export default PauseOverlay;
