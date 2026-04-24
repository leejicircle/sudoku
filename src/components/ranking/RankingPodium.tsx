/**
 * 상위 3위 포디움
 *
 * 1, 2, 3위를 메달과 아바타로 시각적으로 구분 표시한다.
 * 데이터가 3명 미만이면 있는 만큼만 표시.
 *
 * @see docs/design/ranking.md §4 — 포디움
 */

"use client";

import type { RankingEntry } from "@/types/ranking";
import { formatTime, MEDAL_COLORS, MEDAL_EMOJI } from "./ranking-utils";
import RankingAvatar from "./RankingAvatar";
import StarRating from "./StarRating";

interface RankingPodiumProps {
  /** 상위 3위 데이터 */
  rankings: RankingEntry[];
}

/** 포디움 순서: 2위(좌) - 1위(중앙) - 3위(우) */
const PODIUM_ORDER = [1, 0, 2] as const;

const PodiumItem = ({ entry, rank }: { entry: RankingEntry; rank: 1 | 2 | 3 }) => {
  const isFirst = rank === 1;
  const avatarSize = isFirst ? 56 : 44;
  const medalColor = MEDAL_COLORS[rank];
  const medal = MEDAL_EMOJI[rank];

  return (
    <div
      className="flex flex-1 flex-col items-center gap-1"
      style={{ paddingTop: isFirst ? 0 : 20 }}
    >
      {/* 메달 */}
      <span className="text-lg" aria-label={`${rank}위`}>
        {medal}
      </span>

      {/* 아바타 */}
      <RankingAvatar
        image={entry.profileImage}
        name={entry.displayName}
        size={avatarSize}
        borderColor={medalColor}
      />

      {/* 닉네임 */}
      <p
        className={
          isFirst
            ? "max-w-[100px] truncate text-base font-bold"
            : "max-w-[80px] truncate text-sm font-medium"
        }
      >
        {entry.displayName}
      </p>

      {/* 시간 + 별점 */}
      <p className="font-mono text-xs text-muted-foreground">
        {formatTime(entry.clearTime)}
      </p>
      <StarRating stars={entry.stars} size={12} />
    </div>
  );
};

const RankingPodium = ({ rankings }: RankingPodiumProps) => {
  const top3 = rankings.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div
      className="relative mx-4 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5 shadow-lg backdrop-blur-md"
      style={{ minHeight: 180 }}
    >
      {/* 상단 그라디언트 액센트 라인 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sudoku-primary/60 to-transparent"
      />
      {/* 배경 글로우 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 left-1/2 size-40 -translate-x-1/2 rounded-full bg-gradient-to-br from-warning/30 via-sudoku-primary/20 to-transparent blur-2xl"
      />

      <div className="relative flex items-end justify-center">
        {PODIUM_ORDER.map((index) => {
          const entry = top3[index];
          if (!entry) return <div key={index} className="flex-1" />;
          return (
            <PodiumItem
              key={entry.userId}
              entry={entry}
              rank={(index + 1) as 1 | 2 | 3}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RankingPodium;
