/**
 * 랭킹 로딩 스켈레톤
 *
 * 데이터 로딩 중 포디움 + 리스트 영역 placeholder 표시.
 *
 * @see docs/design/ranking.md §6.1 — 로딩
 */

const SkeletonBox = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
);

/** 포디움 스켈레톤 */
const PodiumSkeleton = () => (
  <div className="mx-4 flex items-end justify-center gap-4 rounded-lg bg-card p-5" style={{ minHeight: 180 }}>
    {/* 2위 */}
    <div className="flex flex-1 flex-col items-center gap-2 pt-5">
      <SkeletonBox className="size-11 rounded-full" />
      <SkeletonBox className="h-3 w-14" />
      <SkeletonBox className="h-2.5 w-10" />
    </div>
    {/* 1위 */}
    <div className="flex flex-1 flex-col items-center gap-2">
      <SkeletonBox className="size-14 rounded-full" />
      <SkeletonBox className="h-4 w-16" />
      <SkeletonBox className="h-3 w-12" />
    </div>
    {/* 3위 */}
    <div className="flex flex-1 flex-col items-center gap-2 pt-5">
      <SkeletonBox className="size-11 rounded-full" />
      <SkeletonBox className="h-3 w-14" />
      <SkeletonBox className="h-2.5 w-10" />
    </div>
  </div>
);

/** 리스트 아이템 스켈레톤 */
const ListItemSkeleton = () => (
  <div className="flex items-center gap-3 border-b border-border px-4 py-3" style={{ minHeight: 64 }}>
    <SkeletonBox className="h-5 w-8" />
    <SkeletonBox className="size-9 rounded-full" />
    <div className="flex flex-1 flex-col gap-1.5">
      <SkeletonBox className="h-3.5 w-24" />
      <SkeletonBox className="h-2.5 w-16" />
    </div>
    <div className="flex flex-col items-end gap-1">
      <SkeletonBox className="h-3.5 w-12" />
      <SkeletonBox className="h-3 w-10" />
    </div>
  </div>
);

const RankingSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      <PodiumSkeleton />
      <div className="flex flex-col">
        {Array.from({ length: 5 }, (_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default RankingSkeleton;
