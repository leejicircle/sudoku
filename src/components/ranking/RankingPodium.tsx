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
import { formatTime, MEDAL_COLORS } from "./ranking-utils";
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

  return (
    <div
      className="flex flex-1 flex-col items-center gap-1"
      style={{ paddingTop: isFirst ? 0 : 20 }}
    >
      {/* 순위 — 이모지 대신 모노 숫자 */}
      <span
        className="font-mono tabular-nums text-sm text-muted-foreground"
        aria-label={`${rank}위`}
      >
        #{rank}
      </span>

      {/* 아바타 — 테두리는 잉크 명도 사다리, 1위만 2px */}
      <RankingAvatar
        image={entry.profileImage}
        name={entry.displayName}
        size={avatarSize}
        borderColor={MEDAL_COLORS[rank]}
        borderWidth={isFirst ? 2 : 1}
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
      <p className="font-mono tabular-nums text-xs text-muted-foreground">
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
      className="mx-4 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card"
      style={{ minHeight: 180 }}
    >
      {/* 표 머리 — 괘선 + 모노 캡션 */}
      <p className="border-b border-border px-4 py-2 font-mono text-(length:--text-small) tracking-[0.2em] uppercase text-muted-foreground">
        Top 3
      </p>

      <div className="flex items-end justify-center p-5">
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
