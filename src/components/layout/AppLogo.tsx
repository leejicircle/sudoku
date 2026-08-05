import Link from "next/link";

/** 텍스트 로고 — 클릭 시 홈으로 이동 */
const AppLogo = () => (
  <Link
    href="/"
    className="flex h-11 items-center font-[family-name:var(--font-geist-sans)] text-base font-normal tracking-[0.14em] text-foreground"
    aria-label="스도쿠 홈"
  >
    SUDOKU
  </Link>
);

export default AppLogo;
