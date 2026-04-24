"use client";

import { usePathname } from "next/navigation";
import Header, { type HeaderVariant } from "./Header";
import BottomNav from "./BottomNav";
import { BOTTOM_NAV_HIDDEN_PATHS } from "./nav-items";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface AppLayoutProps {
  children: React.ReactNode;
  /** Header 변형 (명시하지 않으면 경로에서 자동 추론) */
  headerVariant?: HeaderVariant;
  /** 게임 Header 중앙 커스텀 콘텐츠 */
  centerContent?: React.ReactNode;
  /** 게임 Header 우측 커스텀 콘텐츠 */
  rightContent?: React.ReactNode;
  /** BottomNav 강제 숨김 */
  hideBottomNav?: boolean;
}

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

/** 경로에서 Header variant 자동 추론 */
const inferVariant = (pathname: string): HeaderVariant => {
  if (pathname.startsWith("/game")) return "game";
  if (pathname.startsWith("/ranking")) return "ranking";
  if (pathname.startsWith("/login")) return "login";
  return "home";
};

/** BottomNav가 표시되는 페이지인지 확인 — nav-items.ts의 HIDDEN_PATHS를 단일 진실 원천으로 사용 */
const hasBottomNav = (pathname: string, forceHide?: boolean): boolean => {
  if (forceHide) return false;
  return !BOTTOM_NAV_HIDDEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
};

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

const AppLayout = ({
  children,
  headerVariant,
  centerContent,
  rightContent,
  hideBottomNav,
}: AppLayoutProps) => {
  const pathname = usePathname();
  const variant = headerVariant ?? inferVariant(pathname);
  const showNav = hasBottomNav(pathname, hideBottomNav);

  // 게임 페이지는 집중을 위해 깨끗한 배경 유지
  const showAmbientBg = variant !== "game";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* ── 전역 ambient 배경 (게임 외) ── */}
      {showAmbientBg && (
        <>
          <div
            aria-hidden="true"
            className="home-mesh-bg pointer-events-none absolute inset-0 -z-10"
          />
          <div
            aria-hidden="true"
            className="sudoku-grid-bg pointer-events-none absolute inset-0 -z-10 opacity-50"
          />
        </>
      )}

      <Header
        variant={variant}
        centerContent={centerContent}
        rightContent={rightContent}
      />

      {/* 콘텐츠 영역 */}
      <main
        className={
          "relative flex flex-1 flex-col " +
          (showNav
            ? "pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0"
            : "pb-[env(safe-area-inset-bottom)]")
        }
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
