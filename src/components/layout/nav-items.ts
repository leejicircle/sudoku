import { Home, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  ariaLabel: string;
}

/** BottomNav + DesktopNav 공통 네비게이션 항목 */
export const navItems: readonly NavItem[] = [
  { href: "/", label: "홈", icon: Home, ariaLabel: "홈으로 이동" },
  { href: "/ranking", label: "랭킹", icon: Trophy, ariaLabel: "랭킹으로 이동" },
] as const;

/** BottomNav를 숨기는 경로 */
export const BOTTOM_NAV_HIDDEN_PATHS = ["/game", "/login"];
