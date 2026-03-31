"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy } from "lucide-react";

// ────────────────────────────────────────
// Config
// ────────────────────────────────────────

const navItems = [
  { href: "/", label: "홈", icon: Home, ariaLabel: "홈으로 이동" },
  { href: "/ranking", label: "랭킹", icon: Trophy, ariaLabel: "랭킹으로 이동" },
] as const;

/** BottomNav를 숨기는 경로 — 게임, 로그인 */
const HIDDEN_PATHS = ["/game", "/login"];

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

const BottomNav = () => {
  const pathname = usePathname();

  // 게임·로그인 페이지 또는 태블릿 이상(md)에서는 숨김
  const isHidden = HIDDEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isHidden) return null;

  return (
    <nav
      className={
        "fixed bottom-0 left-0 right-0 z-[var(--z-bottom-nav)] " +
        "border-t border-border bg-background " +
        "pb-[env(safe-area-inset-bottom)] " +
        "md:hidden"
      }
      aria-label="메인 내비게이션"
    >
      <div className="flex h-16 items-center">
        {navItems.map(({ href, label, icon: Icon, ariaLabel }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={
                "flex flex-1 flex-col items-center justify-center gap-0.5 " +
                "h-16 min-h-[44px] " +
                "transition-colors duration-100 active:scale-95 " +
                (isActive
                  ? "text-sudoku-primary"
                  : "text-muted-foreground")
              }
              aria-label={ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-6" />
              <span className="text-[11px] font-medium max-[374px]:hidden">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
