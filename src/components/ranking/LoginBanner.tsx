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
    <div className="mx-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-border border-l-[3px] border-l-sudoku-primary bg-card px-4 py-3">
      <LogIn
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm text-foreground">
        로그인하면 기록을 저장할 수 있어요
      </p>
      <Link
        href="/login"
        className="flex min-h-[36px] shrink-0 items-center rounded-[var(--radius-sm)] bg-sudoku-primary px-3 text-xs font-semibold text-sudoku-primary-foreground transition-colors hover:bg-sudoku-accent"
      >
        로그인
      </Link>
    </div>
  );
};

export default LoginBanner;
