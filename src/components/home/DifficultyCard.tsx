"use client";

import { memo } from "react";
import { Lock, Star, Clock, ArrowUpRight } from "lucide-react";
import type { DifficultyItem } from "./difficulty-data";
import { formatTime } from "@/components/game";

interface DifficultyCardProps {
  /** 카드 순서 (0~3) — 인덱스 라벨 표시용 */
  index: number;
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

const UnlockedInfo = ({
  bestTime,
  stars,
}: {
  bestTime: number | null;
  stars: number | null;
}) => (
  <div className="flex flex-col items-end gap-1.5">
    <div className="flex items-center gap-1.5 rounded-full bg-background/60 px-2 py-0.5 backdrop-blur-sm">
      <Clock className="size-3 text-muted-foreground" />
      <span className="font-mono text-(length:--text-small) font-medium text-foreground">
        {bestTime !== null ? formatTime(bestTime) : "—"}
      </span>
    </div>

    <div className="flex items-center gap-0.5">
      {stars !== null
        ? Array.from({ length: 3 }, (_, i) => (
            <Star
              key={i}
              className={`size-3.5 ${
                i < stars
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/30"
              }`}
            />
          ))
        : Array.from({ length: 3 }, (_, i) => (
            <Star key={i} className="size-3.5 text-muted-foreground/30" />
          ))}
    </div>
  </div>
);

const LockedInfo = ({ condition }: { condition: string }) => (
  <div className="flex flex-col items-end gap-1">
    <Lock className="size-5 text-muted-foreground" />
    <span className="text-(length:--text-small) text-muted-foreground">
      {condition}
    </span>
  </div>
);

const DifficultyCard = ({
  index,
  difficulty,
  isLocked,
  bestTime,
  stars,
  onPress,
}: DifficultyCardProps) => {
  const handleClick = () => {
    if (isLocked) return;
    onPress(difficulty);
  };

  const { gradientClass, glowClass } = difficulty;
  const orderLabel = String(index + 1).padStart(2, "0");

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
        "group relative flex h-[120px] md:h-[140px] w-full items-stretch overflow-hidden " +
        "rounded-[var(--radius-xl)] border border-border/60 " +
        "bg-card/80 backdrop-blur-sm " +
        "transition-all duration-(--duration-normal) " +
        "cursor-pointer text-left " +
        (isLocked
          ? "opacity-70 "
          : "shadow-sm hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-[0.99] " +
            glowClass +
            " ")
      }
    >
      {/* 좌측 컬러 그라디언트 사이드바 */}
      <div
        className={
          "relative flex w-[72px] shrink-0 flex-col items-center justify-center gap-1.5 md:w-[88px] " +
          (isLocked ? "bg-muted" : gradientClass)
        }
        aria-hidden="true"
      >
        <span
          className={
            "font-mono text-(length:--text-small) font-bold tracking-wider " +
            (isLocked ? "text-muted-foreground" : "text-white/80")
          }
        >
          #{orderLabel}
        </span>
        <difficulty.icon
          className={
            "size-7 md:size-8 " +
            (isLocked ? "text-muted-foreground" : "text-white drop-shadow-sm")
          }
          strokeWidth={2.25}
        />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="relative flex flex-1 items-center justify-between gap-3 px-4 md:px-5">
        <div className="flex flex-col gap-1 min-w-0">
          <span
            className={
              "text-(length:--text-subheading) font-bold leading-tight " +
              (isLocked ? "text-muted-foreground" : "text-card-foreground")
            }
          >
            {difficulty.label}
          </span>
          <span
            className={
              "font-mono text-(length:--text-small) tracking-wider uppercase " +
              (isLocked
                ? "text-muted-foreground/70"
                : "text-muted-foreground")
            }
          >
            {difficulty.labelEn}
          </span>
        </div>

        {isLocked && difficulty.unlockCondition ? (
          <LockedInfo condition={difficulty.unlockCondition} />
        ) : (
          <UnlockedInfo bestTime={bestTime} stars={stars} />
        )}

        {/* 호버 시 나타나는 화살표 */}
        {!isLocked && (
          <div
            aria-hidden="true"
            className={
              "absolute right-3 top-3 flex size-7 items-center justify-center " +
              "rounded-full bg-foreground/0 text-foreground/0 " +
              "transition-all duration-(--duration-normal) " +
              "group-hover:bg-foreground group-hover:text-background"
            }
          >
            <ArrowUpRight className="size-4" />
          </div>
        )}
      </div>
    </button>
  );
};

const MemoizedDifficultyCard = memo(DifficultyCard);
MemoizedDifficultyCard.displayName = "DifficultyCard";
export default MemoizedDifficultyCard;
