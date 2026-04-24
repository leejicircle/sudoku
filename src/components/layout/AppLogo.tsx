import Link from "next/link";

/** 텍스트 로고 — 클릭 시 홈으로 이동 */
const AppLogo = () => (
  <Link
    href="/"
    className="group flex h-11 items-center gap-1.5 font-mono text-base font-black tracking-[0.2em] text-foreground"
    aria-label="스도쿠 홈"
  >
    <span>SUDOKU</span>
    <span
      aria-hidden="true"
      className="size-1.5 rounded-full bg-gradient-to-br from-sudoku-primary via-difficulty-hard to-difficulty-expert transition-transform duration-(--duration-normal) group-hover:scale-150"
    />
  </Link>
);

export default AppLogo;
