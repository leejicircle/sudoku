import { Suspense } from "react";
import GameContent from "./GameContent";

/**
 * 게임 플레이 페이지
 *
 * URL: /game?stage={1~50}
 *
 * - Suspense: useSearchParams()를 사용하는 GameContent를 감싸 스트리밍
 * - GameContent가 Zustand persist 하이드레이션 + 게임 초기화 담당
 *
 * @see docs/design/game.md
 */
const GamePage = () => (
  <Suspense>
    <GameContent />
  </Suspense>
);

export default GamePage;
