"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight } from "lucide-react";
import { STAGE_RANGES } from "@/types/game";
import { formatTime } from "@/components/game";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface ActiveGameInfo {
  stage: number;
  timer: number;
  progress: number;
}

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

/** JSON 문자열을 파싱하여 진행 중인 게임 정보를 추출 */
const parseActiveGame = (raw: string | null): ActiveGameInfo | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state?.isStarted || state?.isComplete) return null;

    const board = state.board as { value: number | null }[][];
    let filled = 0;
    let total = 0;
    for (const row of board) {
      for (const cell of row) {
        total++;
        if (cell.value !== null) filled++;
      }
    }

    return {
      stage: state.stage as number,
      timer: state.timer as number,
      progress: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  } catch {
    return null;
  }
};

// ────────────────────────────────────────
// useSyncExternalStore 구독 (localStorage)
// ────────────────────────────────────────

const STORAGE_KEY = "sudoku-game";

/** storage 이벤트 구독 (다른 탭에서의 변경 감지) */
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

/** 클라이언트 스냅샷: localStorage에서 원시 JSON 문자열 반환 */
const getSnapshot = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** 서버 스냅샷: SSR에서는 null */
const getServerSnapshot = (): null => null;

// ────────────────────────────────────────
// ContinueBanner 컴포넌트
// ────────────────────────────────────────

/**
 * 이어하기 배너
 *
 * 진행 중인 게임이 있을 때 난이도 카드 위에 표시.
 * 배너 전체가 클릭 가능하며, 진행 중인 게임으로 이동한다.
 *
 * useSyncExternalStore로 localStorage를 구독하여
 * Zustand persist 하이드레이션에 의존하지 않는다.
 *
 * @see docs/design/home.md §4
 */
const ContinueBanner = () => {
  const router = useRouter();

  const rawData = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const gameInfo = useMemo(() => parseActiveGame(rawData), [rawData]);

  if (!gameInfo) return null;

  const difficultyLabel = getDifficultyLabel(gameInfo.stage);

  const handleContinue = () => {
    router.push(`/game?stage=${gameInfo.stage}`);
  };

  return (
    <button
      type="button"
      onClick={handleContinue}
      aria-label={`진행 중인 게임 이어하기 — ${difficultyLabel}, ${formatTime(gameInfo.timer)} 경과, ${gameInfo.progress}% 완료`}
      className={
        "flex w-full items-center justify-between " +
        "rounded-[var(--radius-lg)] " +
        "border border-sudoku-primary/20 bg-sudoku-primary/10 " +
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
            {difficultyLabel} · {formatTime(gameInfo.timer)} 경과 · {gameInfo.progress}% 완료
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
