/**
 * 브랜드 워드마크 — `SUDOKU` 단색 잉크 타이틀
 *
 * 홈/로그인 등 여러 곳에서 동일한 자간 조합을 쓰므로
 * 단일 컴포넌트로 추출하여 톤 일관성을 보장한다.
 *
 * 페이퍼 톤(v2): 그라데이션·시머 없음. 넓은 자간의 단색 활자만으로
 * 인쇄물 표제를 표현한다.
 *
 * @see docs/design/design-system.md §14.2
 */

import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  /** 사이즈 — sm: 로그인 모바일, md: 로그인 데스크톱, lg: 홈 히어로 */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandWordmarkProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-[clamp(1.75rem,7vw,3rem)]",
};

const BrandWordmark = ({ size = "md", className }: BrandWordmarkProps) => (
  <span
    className={cn(
      "font-[family-name:var(--font-geist-sans)] font-normal",
      "tracking-[0.14em] whitespace-nowrap text-foreground",
      SIZE_CLASSES[size],
      className,
    )}
  >
    SUDOKU
  </span>
);

export default BrandWordmark;
