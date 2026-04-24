/**
 * 랭킹 리스트 (4위~)
 *
 * 포디움 아래에 표시되는 순위 리스트.
 * 로그인 사용자의 순위는 하이라이트 처리.
 *
 * 현재는 limit 파라미터로 한번에 전부 로드한다.
 * TODO: 사용자 증가 시 무한 스크롤 또는 페이지네이션 도입 (Backend offset/cursor 추가 필요)
 *
 * @see docs/design/ranking.md §5 — 랭킹 리스트
 */

"use client";

import { cn } from "@/lib/utils";
import type { RankingEntry } from "@/types/ranking";
import { formatTime, formatDate } from "./ranking-utils";
import RankingAvatar from "./RankingAvatar";
import StarRating from "./StarRating";

interface RankingListProps {
  /** 4위 이후 랭킹 데이터 */
  rankings: RankingEntry[];
  /** 현재 로그인 사용자 ID (하이라이트용) */
  currentUserId?: string | null;
}

const RankingListItem = ({
  entry,
  isMe,
}: {
  entry: RankingEntry;
  isMe: boolean;
}) => {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 transition-colors duration-(--duration-normal) hover:bg-foreground/5",
        "border-b border-border/40 last:border-b-0",
        isMe &&
          "bg-gradient-to-r from-sudoku-primary/10 via-sudoku-primary/5 to-transparent",
      )}
      style={{ minHeight: 64 }}
    >
      {/* 본인 액센트 바 */}
      {isMe && (
        <div
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sudoku-primary"
        />
      )}

      {/* 순위 */}
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold",
          isMe
            ? "bg-sudoku-primary text-sudoku-primary-foreground"
            : "bg-foreground/5 text-foreground",
        )}
      >
        {entry.rank}
      </span>

      {/* 아바타 */}
      <RankingAvatar
        image={entry.profileImage}
        name={entry.displayName}
        size={36}
      />

      {/* 이름 + 날짜 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {entry.displayName}
          {isMe && (
            <span className="ml-1.5 rounded-full bg-sudoku-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-sudoku-primary">
              ME
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(entry.completedAt)}
        </p>
      </div>

      {/* 시간 + 별점 */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono text-sm font-semibold">
          {formatTime(entry.clearTime)}
        </span>
        <StarRating stars={entry.stars} size={12} />
      </div>
    </div>
  );
};

const RankingList = ({ rankings, currentUserId }: RankingListProps) => {
  if (rankings.length === 0) return null;

  return (
    <div className="mx-4 overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-md">
      {rankings.map((entry) => (
        <RankingListItem
          key={entry.userId}
          entry={entry}
          isMe={currentUserId === entry.userId}
        />
      ))}
    </div>
  );
};

export default RankingList;
