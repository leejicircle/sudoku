"use client";

import AppLogo from "./AppLogo";
import BackButton from "./BackButton";
import AuthButton from "./AuthButton";
import DesktopNav from "./DesktopNav";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

/** Header 변형 — 페이지별로 다른 레이아웃 */
export type HeaderVariant = "home" | "game" | "ranking" | "login";

interface HeaderProps {
  /** 현재 페이지에 맞는 Header 변형 */
  variant: HeaderVariant;
  /** 게임 Header 중앙 커스텀 콘텐츠 (난이도 + 타이머) */
  centerContent?: React.ReactNode;
  /** 게임 Header 우측 커스텀 콘텐츠 (일시정지 등) */
  rightContent?: React.ReactNode;
}

// ────────────────────────────────────────
// Variant resolver
// ────────────────────────────────────────

const resolveSlots = (
  variant: HeaderVariant,
  centerContent?: React.ReactNode,
  rightContent?: React.ReactNode,
) => {
  switch (variant) {
    case "home":
      return {
        left: (
          <div className="flex items-center gap-2">
            <AppLogo />
            <DesktopNav />
          </div>
        ),
        center: null,
        right: <AuthButton />,
      };

    case "game":
      return {
        left: <BackButton />,
        center: centerContent ?? null,
        right: rightContent ?? <div className="size-11" />,
      };

    case "ranking":
      return {
        left: (
          <div className="flex items-center gap-2">
            <AppLogo />
            <DesktopNav />
          </div>
        ),
        center: (
          <span className="text-base font-semibold text-foreground md:hidden">
            랭킹
          </span>
        ),
        right: <AuthButton />,
      };

    case "login":
      return {
        left: <BackButton />,
        center: (
          <span className="text-base font-semibold text-foreground">
            로그인
          </span>
        ),
        right: <div className="size-11" />,
      };
  }
};

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

const Header = ({ variant, centerContent, rightContent }: HeaderProps) => {
  const { left, center, right } = resolveSlots(
    variant,
    centerContent,
    rightContent,
  );

  return (
    <header
      className={
        "sticky top-0 z-[var(--z-header)] border-b border-border/40 " +
        "bg-background/70 backdrop-blur-xl " +
        "h-14 md:h-16 " +
        "pt-[env(safe-area-inset-top)]"
      }
      role="banner"
    >
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 md:px-6">
        {/* 좌측 — flex-1, start 정렬 */}
        <div className="flex min-w-0 flex-1 items-center justify-start">
          {left}
        </div>

        {/* 중앙 — flex-shrink-0, center 정렬, 최대 50% */}
        {center && (
          <div className="flex max-w-[50%] shrink-0 items-center justify-center">
            {center}
          </div>
        )}

        {/* 우측 — flex-1, end 정렬 */}
        <div className="flex min-w-0 flex-1 items-center justify-end">
          {right}
        </div>
      </div>
    </header>
  );
};

export default Header;
