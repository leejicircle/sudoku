"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight } from "lucide-react";
import { STAGE_RANGES, type Board } from "@/types/game";
import { formatTime } from "@/components/game";
import { useGameStore } from "@/stores/game-store";

// ────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────

/** 스테이지 번호 → 난이도 라벨 */
const getDifficultyLabel = (stage: number): string => {
  for (const range of STAGE_RANGES) {
    if (stage >= range.startStage && stage <= range.endStage) {
      return range.label;
    }
  }
  return "알 수 없음";
};

/** Board에서 진행률(%) 계산 */
const calcProgress = (board: Board): number => {
  if (board.length === 0) return 0;
  let filled = 0;
  let total = 0;
  for (const row of board) {
    for (const cell of row) {
      total++;
      if (cell.value !== null) filled++;
    }
  }
  return total > 0 ? Math.round((filled / total) * 100) : 0;
};

// ────────────────────────────────────────
// Zustand persist 하이드레이션 구독
// ────────────────────────────────────────

/**
 * useSyncExternalStore 구독 함수 (모듈 레벨 — 참조 안정성 보장)
 *
 * Zustand persist의 onFinishHydration을 구독하여
 * localStorage → 스토어 복원 완료 시점을 감지한다.
 */
const subscribeToHydration = (callback: () => void) => {
  return useGameStore.persist.onFinishHydration(callback);
};

const getHydrationSnapshot = () => useGameStore.persist.hasHydrated();
const getHydrationServerSnapshot = () => false;

// ────────────────────────────────────────
// 스켈레톤 컴포넌트
// ────────────────────────────────────────

/** 하이드레이션 중 표시되는 배너 플레이스홀더 */
const BannerSkeleton = () => (
  <div
    className={
      "flex w-full items-center justify-between " +
      "rounded-[var(--radius-lg)] " +
      "border border-border/30 bg-muted/20 " +
      "p-4 mb-4 animate-pulse"
    }
    aria-hidden="true"
  >
    <div className="flex items-center gap-3">
      <div className="size-5 rounded-sm bg-muted/40" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3.5 w-32 rounded bg-muted/40" />
        <div className="h-3 w-44 rounded bg-muted/40" />
      </div>
    </div>
    <div className="h-4 w-16 rounded bg-muted/40" />
  </div>
);

// ────────────────────────────────────────
// ContinueBanner 컴포넌트
// ────────────────────────────────────────

/**
 * 이어하기 배너
 *
 * 진행 중인 게임이 있을 때 난이도 카드 위에 표시.
 * 배너 전체가 클릭 가능하며, 진행 중인 게임으로 이동한다.
 *
 * ## 구현 방식 — Zustand 스토어 구독
 *
 * localStorage를 직접 읽는 대신 Zustand 스토어를 구독한다.
 *
 * - **뒤로가기 대응**: Zustand 스토어는 JS 모듈 싱글턴이므로
 *   Next.js 클라이언트 네비게이션(뒤로가기 포함)에서
 *   상태가 메모리에 유지되어 별도 이벤트 리스너(popstate 등) 불필요.
 *
 * - **초기 하이드레이션**: Zustand persist가 localStorage에서
 *   상태를 복원하는 동안 스켈레톤 UI를 표시하여
 *   레이아웃 시프트를 방지.
 *
 * @see docs/adr/103-continue-banner-hydration.md
 * @see docs/design/home.md §4
 */
const ContinueBanner = () => {
  const router = useRouter();

  // Zustand persist 하이드레이션 상태
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );

  // Zustand 스토어 구독 (싱글턴 → 클라이언트 네비게이션 간 상태 유지)
  const isStarted = useGameStore((s) => s.isStarted);
  const isComplete = useGameStore((s) => s.isComplete);
  const stage = useGameStore((s) => s.stage);
  const timer = useGameStore((s) => s.timer);
  const board = useGameStore((s) => s.board);

  const progress = useMemo(() => calcProgress(board), [board]);

  // 하이드레이션 전: 스켈레톤 표시
  if (!isHydrated) return <BannerSkeleton />;

  // 진행 중인 게임 없음
  if (!isStarted || isComplete) return null;

  const difficultyLabel = getDifficultyLabel(stage);

  const handleContinue = () => {
    router.push(`/game?stage=${stage}`);
  };

  return (
    <button
      type="button"
      onClick={handleContinue}
      aria-label={`진행 중인 게임 이어하기 — ${difficultyLabel}, ${formatTime(timer)} 경과, ${progress}% 완료`}
      className={
        "flex w-full items-center justify-between " +
        "rounded-[var(--radius-lg)] " +
        "border border-sudoku-primary/25 bg-sudoku-primary/12 " +
        "p-4 mb-4 " +
        "transition-colors duration-(--duration-fast) " +
        "hover:bg-sudoku-primary/15 " +
        "cursor-pointer"
      }
    >
      {/* 좌측: 아이콘 + 정보 */}
      <div className="flex items-center gap-3 min-w-0">
        <ClipboardList className="size-5 shrink-0 text-sudoku-primary" />
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-(length:--text-caption) font-medium text-foreground">
            진행 중인 게임이 있습니다
          </span>
          <span className="text-(length:--text-small) text-muted-foreground truncate">
            {difficultyLabel} · {formatTime(timer)} 경과 · {progress}% 완료
          </span>
        </div>
      </div>

      {/* 우측: 화살표 */}
      <div
        className={
          "flex items-center gap-1 shrink-0 " +
          "text-(length:--text-caption) font-medium text-sudoku-primary"
        }
      >
        이어하기
        <ChevronRight className="size-4" />
      </div>
    </button>
  );
};

export default ContinueBanner;
