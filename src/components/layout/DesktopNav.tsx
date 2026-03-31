"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy } from "lucide-react";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/ranking", label: "랭킹", icon: Trophy },
] as const;

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
              "flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors " +
              (isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground")
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
