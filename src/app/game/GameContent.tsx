"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import {
  Board,
  GameHeader,
  NumberPad,
} from "@/components/game";
import Toolbar from "@/components/game/Toolbar";
import PauseOverlay from "@/components/game/PauseOverlay";
import ClearModal from "@/components/game/ClearModal";

// ────────────────────────────────────────
// Zustand persist 하이드레이션 구독
// ────────────────────────────────────────

const subscribeToHydration = (callback: () => void) => {
  return useGameStore.persist.onFinishHydration(callback);
};
const getHydrationSnapshot = () => useGameStore.persist.hasHydrated();
const getHydrationServerSnapshot = () => false;

// ────────────────────────────────────────
// 로딩 스켈레톤
// ────────────────────────────────────────

/** 게임 로딩 중 표시되는 스켈레톤 */
const GameSkeleton = () => (
  <div className="flex flex-1 flex-col items-center px-4 py-4 gap-4 animate-pulse">
    {/* 보드 스켈레톤 */}
    <div
      className="aspect-square w-full max-w-[376px] rounded-[var(--radius-lg)] bg-muted/40"
      aria-hidden="true"
    />
    {/* 도구바 스켈레톤 */}
    <div className="flex gap-2 w-full max-w-[376px]">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex-1 h-12 rounded-[var(--radius-md)] bg-muted/30" />
      ))}
    </div>
    {/* 숫자패드 스켈레톤 */}
    <div className="grid grid-cols-5 gap-2 w-full max-w-[376px]">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="h-12 rounded-[var(--radius-md)] bg-muted/30" />
      ))}
    </div>
  </div>
);

// ────────────────────────────────────────
// GameContent 컴포넌트
// ────────────────────────────────────────

/**
 * 게임 플레이 페이지 콘텐츠 (클라이언트)
 *
 * 구성: GameHeader > (Board + Toolbar + NumberPad + PauseOverlay + ClearModal)
 *
 * ## 게임 초기화 흐름
 *
 * 1. Zustand persist 하이드레이션 완료 대기 (스켈레톤 표시)
 * 2. 하이드레이션 후 스토어에 진행 중인 게임이 있으면 계속
 * 3. 없으면 URL의 stage 파라미터로 새 게임 생성
 * 4. 유효한 stage 없으면 홈으로 리다이렉트
 *
 * @see docs/design/game.md
 */
const GameContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initDoneRef = useRef(false);

  // Zustand persist 하이드레이션 상태
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );

  // 스토어 구독
  const isStarted = useGameStore((s) => s.isStarted);
  const stage = useGameStore((s) => s.stage);
  const initGame = useGameStore((s) => s.initGame);

  // ── 게임 초기화 (하이드레이션 완료 후 1회 실행) ──
  useEffect(() => {
    if (!isHydrated || initDoneRef.current) return;

    const stageParam = searchParams.get("stage");
    const targetStage = stageParam ? parseInt(stageParam, 10) : NaN;

    // 이미 같은 스테이지 진행 중 → 계속
    if (isStarted && stage === targetStage) {
      initDoneRef.current = true;
      return;
    }

    // 진행 중인 게임 존재 (URL 없이 접근 또는 stage 불일치)
    if (isStarted && (isNaN(targetStage) || targetStage === stage)) {
      initDoneRef.current = true;
      return;
    }

    // 유효한 stage 파라미터 → 새 게임
    if (targetStage >= 1 && targetStage <= 50) {
      initGame(targetStage);
      initDoneRef.current = true;
      return;
    }

    // 게임 없고 유효한 stage도 없음 → 홈으로
    router.replace("/");
  }, [isHydrated, isStarted, stage, searchParams, initGame, router]);

  // ── 하이드레이션 전: 스켈레톤 ──
  if (!isHydrated) {
    return (
      <GameHeader>
        <GameSkeleton />
      </GameHeader>
    );
  }

  // ── 게임 미시작 (리다이렉트 중이거나 초기화 대기) ──
  if (!isStarted) {
    return (
      <GameHeader>
        <GameSkeleton />
      </GameHeader>
    );
  }

  // ── 게임 진행 중 ──
  return (
    <GameHeader>
      <div className="flex flex-1 flex-col items-center px-[var(--board-padding)] py-4 gap-4">
        {/* 보드 */}
        <Board />

        {/* 도구바 + 숫자패드 (보드 최대 너비에 맞춤) */}
        <div className="w-full max-w-[376px] flex flex-col gap-4">
          <Toolbar />
          <NumberPad />
        </div>
      </div>

      {/* 일시정지 오버레이 */}
      <PauseOverlay />

      {/* 클리어 결과 모달 */}
      <ClearModal />
    </GameHeader>
  );
};

export default GameContent;
