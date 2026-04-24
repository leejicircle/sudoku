/**
 * 브랜드 워드마크 — `S · U · D · O · K · U` 시머 그라디언트 타이틀
 *
 * 홈/로그인 등 여러 곳에서 동일한 모노 + 트래킹 + 시머 조합을 쓰므로
 * 단일 컴포넌트로 추출하여 톤 일관성을 보장한다.
 */

import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  /** 사이즈 — sm: 로그인 모바일, md: 로그인 데스크톱, lg: 홈 히어로 */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandWordmarkProps["size"]>, string> = {
  sm: "text-lg tracking-[0.18em]",
  md: "text-xl tracking-[0.18em]",
  lg: "text-[clamp(1.4rem,5vw,2.75rem)] tracking-[0.1em]",
};

const BrandWordmark = ({ size = "md", className }: BrandWordmarkProps) => (
  <span
    className={cn(
      "animate-text-shimmer font-mono font-black whitespace-nowrap",
      SIZE_CLASSES[size],
      className,
    )}
  >
    S · U · D · O · K · U
  </span>
);

export default BrandWordmark;
