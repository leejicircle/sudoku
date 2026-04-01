"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/game-store";

// ────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────

/**
 * 초(seconds)를 타이머 포맷 문자열로 변환
 *
 * | 경과 시간 | 포맷        | 예시     |
 * |----------|------------|---------|
 * | < 1시간  | MM:SS      | 03:24   |
 * | ≥ 1시간  | H:MM:SS    | 1:03:24 |
 *
 * @see docs/design/game.md §2.1 타이머 포맷
 */
export const formatTime = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
};

// ────────────────────────────────────────
// Props
// ────────────────────────────────────────

interface TimerProps {
  /** 외부에서 추가 className을 전달할 때 사용 */
  className?: string;
}

// ────────────────────────────────────────
// Timer 컴포넌트
// ────────────────────────────────────────

/**
 * 게임 경과 시간 표시 + 자동 틱
 *
 * - 1초 간격으로 store의 tick() 호출
 * - isPaused / isComplete / !isStarted 상태에서 자동 정지
 * - 디자인: Geist Mono, 20px, weight 500
 *
 * @see docs/design/game.md §2 Header — 타이머
 */
const Timer = ({ className = "" }: TimerProps) => {
  const timer = useGameStore((s) => s.timer);
  const isPaused = useGameStore((s) => s.isPaused);
  const isComplete = useGameStore((s) => s.isComplete);
  const isStarted = useGameStore((s) => s.isStarted);
  const tick = useGameStore((s) => s.tick);

  // ── 1초 인터벌 ──
  useEffect(() => {
    if (!isStarted || isPaused || isComplete) return;

    const intervalId = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isStarted, isPaused, isComplete, tick]);

  const display = formatTime(timer);

  return (
    <time
      aria-label={`경과 시간 ${display}`}
      aria-live="off"
      className={`font-mono text-(length:--text-timer) font-medium tabular-nums ${className}`}
    >
      {display}
    </time>
  );
};

export default Timer;
