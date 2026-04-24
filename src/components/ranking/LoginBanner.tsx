/**
 * 비로그인 배너
 *
 * 비로그인 사용자에게 로그인 유도 메시지를 표시한다.
 *
 * @see docs/design/ranking.md §2 — 비로그인 배너
 */

import Link from "next/link";
import { LogIn } from "lucide-react";

const LoginBanner = () => {
  return (
    <div className="mx-4 flex items-center gap-3 rounded-2xl border border-sudoku-primary/20 bg-gradient-to-r from-sudoku-primary/12 via-sudoku-primary/8 to-transparent px-4 py-3 backdrop-blur-md">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sudoku-primary/15">
        <LogIn className="size-4 text-sudoku-primary" />
      </div>
      <p className="flex-1 text-sm text-foreground">
        로그인하면 기록을 저장할 수 있어요
      </p>
      <Link
        href="/login"
        className="shrink-0 rounded-full bg-sudoku-primary px-3 py-1.5 text-xs font-semibold text-sudoku-primary-foreground shadow-sm transition-all hover:opacity-90"
      >
        로그인
      </Link>
    </div>
  );
};

export default LoginBanner;
