/**
 * 랭킹 에러 상태
 *
 * 네트워크 오류 등으로 데이터 조회 실패 시 표시.
 *
 * @see docs/design/ranking.md §6.2 — 네트워크 에러
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RankingErrorProps {
  /** 재시도 콜백 */
  onRetry: () => void;
}

const RankingError = ({ onRetry }: RankingErrorProps) => {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <AlertCircle className="size-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        랭킹을 불러올 수 없습니다
      </p>
      <Button variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
};

export default RankingError;
