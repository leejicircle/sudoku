"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

/** 데스크톱 네비게이션 링크 (≥768px) — BottomNav 숨김 시 대체 */
const DesktopNav = () => {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      aria-label="메인 내비게이션"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={
              "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-all duration-(--duration-normal) " +
              (isActive
                ? "bg-sudoku-primary/12 text-sudoku-primary ring-1 ring-sudoku-primary/20"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground")
            }
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
