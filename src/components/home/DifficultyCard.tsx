"use client";

import { memo } from "react";
import { Lock, Star, Clock } from "lucide-react";
import type { DifficultyItem } from "./difficulty-data";
import { formatTime } from "@/components/game";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface DifficultyCardProps {
  /** 난이도 데이터 */
  difficulty: DifficultyItem;
  /** 잠금 상태 */
  isLocked: boolean;
  /** 최고 기록 (초). null이면 기록 없음 */
  bestTime: number | null;
  /** 별점 (1~3). null이면 기록 없음 */
  stars: number | null;
  /** 카드 클릭 핸들러 */
  onPress: (difficulty: DifficultyItem) => void;
}

// ────────────────────────────────────────
// 내부 컴포넌트: 우측 영역 (해금)
// ────────────────────────────────────────

const UnlockedInfo = ({
  bestTime,
  stars,
}: {
  bestTime: number | null;
  stars: number | null;
}) => (
  <div className="flex flex-col items-end gap-1">
    {/* 최고 기록 */}
    <div className="flex items-center gap-1">
      <Clock className="size-3.5 text-muted-foreground" />
      <span className="font-mono text-(length:--text-body) text-foreground">
        {bestTime !== null ? formatTime(bestTime) : "—"}
      </span>
    </div>

    {/* 별점 */}
    <div className="flex items-center gap-0.5">
      {stars !== null
        ? Array.from({ length: 3 }, (_, i) => (
            <Star
              key={i}
              className={`size-4 ${
                i < stars
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/30"
              }`}
            />
          ))
        : Array.from({ length: 3 }, (_, i) => (
            <Star key={i} className="size-4 text-muted-foreground/30" />
          ))}
    </div>
  </div>
);

// ────────────────────────────────────────
// 내부 컴포넌트: 우측 영역 (잠금)
// ────────────────────────────────────────

const LockedInfo = ({ condition }: { condition: string }) => (
  <div className="flex flex-col items-end gap-1">
    <Lock className="size-5 text-muted-foreground" />
    <span className="text-(length:--text-small) text-muted-foreground">
      {condition}
    </span>
  </div>
);

// ────────────────────────────────────────
// DifficultyCard 컴포넌트
// ────────────────────────────────────────

/**
 * 난이도 선택 카드
 *
 * 디자인 명세: docs/design/home.md §3
 * - 80px 높이, 좌측 4px 색상 인디케이터
 * - 해금 상태: 최고기록 + 별점 표시
 * - 잠금 상태: 잠금 아이콘 + 해금 조건 텍스트
 */
const DifficultyCard = ({
  difficulty,
  isLocked,
  bestTime,
  stars,
  onPress,
}: DifficultyCardProps) => {
  const handleClick = () => {
    onPress(difficulty);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isLocked
          ? `${difficulty.label} 난이도, 잠금됨. ${difficulty.unlockCondition}`
          : `${difficulty.label} 난이도 게임 시작`
      }
      className={
        "relative flex h-20 w-full items-center overflow-hidden " +
        "rounded-[var(--radius-lg)] border border-border " +
        "pl-0 pr-4 " +
        "transition-all duration-(--duration-fast) " +
        "cursor-pointer " +
        (isLocked
          ? "bg-muted opacity-70 "
          : "bg-card shadow-sm " +
            "hover:bg-accent hover:shadow-md " +
            "active:scale-[0.98] ")
      }
    >
      {/* 좌측 색상 인디케이터 (4px 세로 바) */}
      <div
        className={`h-full w-1 shrink-0 ${difficulty.indicatorClass}`}
        aria-hidden="true"
      />

      {/* 카드 콘텐츠 */}
      <div className="flex flex-1 items-center justify-between px-4">
        {/* 좌측: 난이도명 */}
        <div className="flex flex-col gap-0.5">
          <span
            className={
              "text-(length:--text-body) font-semibold " +
              (isLocked ? "text-muted-foreground" : "text-card-foreground")
            }
          >
            {difficulty.label}
          </span>
          <span
            className={
              "text-(length:--text-small) " +
              (isLocked
                ? "text-muted-foreground/70"
                : "text-muted-foreground")
            }
          >
            {difficulty.labelEn}
          </span>
        </div>

        {/* 우측: 기록 또는 잠금 정보 */}
        {isLocked && difficulty.unlockCondition ? (
          <LockedInfo condition={difficulty.unlockCondition} />
        ) : (
          <UnlockedInfo bestTime={bestTime} stars={stars} />
        )}
      </div>
    </button>
  );
};

const MemoizedDifficultyCard = memo(DifficultyCard);
MemoizedDifficultyCard.displayName = "DifficultyCard";
export default MemoizedDifficultyCard;
