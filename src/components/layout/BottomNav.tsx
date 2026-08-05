"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

const BottomNav = () => {
  const pathname = usePathname();

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
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 " +
                "h-16 min-h-[44px] " +
                "transition-colors duration-100 active:scale-95 " +
                (isActive
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground")
              }
              aria-label={ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              {/* 활성 표시 — 색이 아니라 상단 2px 잉크 바 */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 bg-foreground"
                />
              )}
              <Icon className="size-6" strokeWidth={1.75} />
              <span className="text-[11px] max-[374px]:hidden">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
