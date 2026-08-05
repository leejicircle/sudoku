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
        "relative flex items-center gap-3 px-4 py-3 transition-colors duration-(--duration-normal) hover:bg-accent",
        // 행 구분 = 1px 괘선 (성적표)
        "border-b border-border last:border-b-0",
        // 내 순위 강조 = 배경색이 아니라 좌측 3px 잉크 바 + 굵기
        isMe && "border-l-[3px] border-l-foreground pl-[13px] font-semibold",
      )}
      style={{ minHeight: 64 }}
    >
      {/* 순위 */}
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center font-mono tabular-nums text-sm text-foreground",
          isMe && "font-bold",
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
            <span className="ml-1.5 rounded-[var(--radius-sm)] border border-border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-foreground">
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
        <span className="font-mono tabular-nums text-sm font-semibold">
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
    <div className="mx-4 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card">
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
