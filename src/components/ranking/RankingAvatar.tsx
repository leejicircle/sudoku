/**
 * 랭킹 아바타 컴포넌트
 *
 * 프로필 이미지가 있으면 표시, 없으면 이니셜 폴백.
 * 포디움과 리스트에서 공통 사용.
 *
 * @see docs/design/ranking.md §4.3 — 아바타
 */

import { cn } from "@/lib/utils";

interface RankingAvatarProps {
  /** 프로필 이미지 URL */
  image: string | null;
  /** 표시 이름 (이니셜 폴백용) */
  name: string;
  /** 크기 (px) */
  size: number;
  /** 보더 색상 (메달 색상 등) */
  borderColor?: string;
}

const RankingAvatar = ({ image, name, size, borderColor }: RankingAvatarProps) => {
  const initial = name.charAt(0).toUpperCase() || "U";
  const sizeStyle = { width: size, height: size };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
      )}
      style={{
        ...sizeStyle,
        border: borderColor ? `2px solid ${borderColor}` : undefined,
      }}
    >
      {image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image}
          alt={name}
          className="size-full object-cover"
        />
      ) : (
        <span
          className="font-sans text-sm font-bold text-muted-foreground"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </span>
      )}
    </div>
  );
};

export default RankingAvatar;
