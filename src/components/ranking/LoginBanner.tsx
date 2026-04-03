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
    <div
      className="mx-4 flex items-center gap-3 rounded-md border border-info/20 bg-info/10 px-4 py-3"
    >
      <LogIn className="size-4 shrink-0 text-foreground" />
      <p className="flex-1 text-sm">
        로그인하면 기록을 저장할 수 있어요
      </p>
      <Link
        href="/login"
        className="shrink-0 text-sm font-medium text-sudoku-primary hover:underline"
      >
        로그인 &rarr;
      </Link>
    </div>
  );
};

export default LoginBanner;
