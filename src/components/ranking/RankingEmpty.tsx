/**
 * 랭킹 빈 상태
 *
 * 해당 난이도에 클리어 기록이 없을 때 표시.
 *
 * @see docs/design/ranking.md §5.4 — 빈 상태
 */

import Link from "next/link";
import { Trophy } from "lucide-react";

const RankingEmpty = () => {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warning/20 via-sudoku-primary/10 to-transparent backdrop-blur-sm">
        <Trophy className="size-8 text-warning" strokeWidth={1.75} />
      </div>
      <p className="mt-1 text-base font-semibold">아직 기록이 없습니다</p>
      <p className="text-sm text-muted-foreground">
        첫 번째 도전자가 되어보세요!
      </p>
      <Link
        href="/"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sudoku-primary px-5 py-2 text-sm font-semibold text-sudoku-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg"
      >
        게임 시작하기
      </Link>
    </div>
  );
};

export default RankingEmpty;
