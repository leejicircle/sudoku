/**
 * 랭킹 빈 상태
 *
 * 해당 난이도에 클리어 기록이 없을 때 표시.
 *
 * @see docs/design/ranking.md §5.4 — 빈 상태
 */

import Link from "next/link";
import { Trophy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const RankingEmpty = () => {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <Trophy className="size-12 text-muted-foreground" />
      <p className="text-base font-medium">아직 기록이 없습니다</p>
      <p className="text-sm text-muted-foreground">
        첫 번째 도전자가 되어보세요!
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-2" })}>
        게임 시작하기
      </Link>
    </div>
  );
};

export default RankingEmpty;
