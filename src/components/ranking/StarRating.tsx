/**
 * 별점 표시 컴포넌트
 *
 * 1~3 별점을 채워진/빈 별 아이콘으로 표시한다.
 *
 * @see docs/design/ranking.md §5.2 — 별점
 */

import { Star } from "lucide-react";

interface StarRatingProps {
  /** 획득 별점 (1~3) */
  stars: number;
  /** 최대 별 수 */
  max?: number;
  /** 별 크기 (px) */
  size?: number;
}

const StarRating = ({ stars, max = 3, size = 14 }: StarRatingProps) => {
  return (
    <div className="flex gap-0.5" aria-label={`별점 ${stars}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < stars
              ? "fill-warning text-warning"
              : "fill-transparent text-muted"
          }
        />
      ))}
    </div>
  );
};

export default StarRating;
