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
        "flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-accent",
        isMe && "border-l-3 border-l-sudoku-primary bg-sudoku-primary/8",
      )}
      style={{ minHeight: 64 }}
    >
      {/* 순위 */}
      <span className="w-8 shrink-0 font-mono text-base font-bold">
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
            <span className="ml-1 text-xs text-sudoku-primary">(나)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(entry.completedAt)}
        </p>
      </div>

      {/* 시간 + 별점 */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono text-sm">{formatTime(entry.clearTime)}</span>
        <StarRating stars={entry.stars} size={12} />
      </div>
    </div>
  );
};

const RankingList = ({ rankings, currentUserId }: RankingListProps) => {
  if (rankings.length === 0) return null;

  return (
    <div className="flex flex-col">
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
