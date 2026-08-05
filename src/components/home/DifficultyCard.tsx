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
    <div className="flex items-center gap-1.5">
      <Clock className="size-3 text-muted-foreground" strokeWidth={1.75} />
      <span className="font-mono tabular-nums text-(length:--text-small) font-medium text-foreground">
        {bestTime !== null ? formatTime(bestTime) : "—"}
      </span>
    </div>

    <div className="flex items-center gap-0.5">
      {Array.from({ length: 3 }, (_, i) => (
        <Star
          key={i}
          strokeWidth={1.75}
          className={`size-3.5 ${
            i < (stars ?? 0) ? "fill-warning text-warning" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  </div>
);

/**
 * 난이도 pip 게이지 (■■□□)
 *
 * 난이도를 색이 아니라 **개수**로 전달한다.
 * ★은 카드 우측 클리어 등급에 이미 쓰이므로 정사각 pip을 쓴다.
 * 난이도 정보는 카드 aria-label이 전달하므로 aria-hidden.
 */
const LevelPips = ({ level }: { level: 1 | 2 | 3 | 4 }) => (
  <div className="flex gap-[3px]" aria-hidden="true">
    {Array.from({ length: 4 }, (_, i) => (
      <span
        key={i}
        className={
          "size-1.5 rounded-none " +
          (i < level ? "bg-current" : "border border-current opacity-40")
        }
      />
    ))}
  </div>
);

const LockedInfo = ({ condition }: { condition: string }) => (
  <div className="flex flex-col items-end gap-1">
    <Lock className="size-5 text-muted-foreground" strokeWidth={1.75} />
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
        "rounded-[var(--radius-xl)] border border-border bg-card " +
        "transition-colors duration-(--duration-normal) " +
        "cursor-pointer text-left " +
        (isLocked
          ? "cell-hatch text-muted-foreground "
          : "shadow-sm hover:bg-accent active:scale-[0.99] ")
      }
    >
      {/* 좌측 사이드바 — 색면이 아니라 세로 괄선이 구분한다 */}
      <div
        className={
          "relative flex w-[72px] shrink-0 flex-col items-center justify-center gap-2 " +
          "border-r border-border md:w-[88px] " +
          (isLocked ? "text-muted-foreground" : difficulty.toneClass)
        }
        aria-hidden="true"
      >
        <span className="font-mono tabular-nums text-(length:--text-small) tracking-wider text-muted-foreground">
          {orderLabel}
        </span>
        <LevelPips level={difficulty.level} />
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
              "text-muted-foreground"
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
              "rounded-none text-transparent " +
              "transition-colors duration-(--duration-normal) " +
              "group-hover:text-muted-foreground"
            }
          >
            <ArrowUpRight className="size-4" strokeWidth={1.75} />
          </div>
        )}
      </div>
    </button>
  );
};

const MemoizedDifficultyCard = memo(DifficultyCard);
MemoizedDifficultyCard.displayName = "DifficultyCard";
export default MemoizedDifficultyCard;
