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
