"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Star, Play, Trophy, Home, Unlock } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { useGuestRecordStore } from "@/stores/guest-record-store";
import { STAGE_RANGES } from "@/types/game";
import { formatTime } from "./Timer";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";

// ────────────────────────────────────────
// 상수
// ────────────────────────────────────────

/** 난이도 라벨 -> Tailwind 색상 클래스 */
const DIFFICULTY_COLOR_MAP: Record<string, string> = {
  입문: "text-difficulty-easy",
  초급: "text-difficulty-easy",
  중급: "text-difficulty-medium",
  고급: "text-difficulty-hard",
  마스터: "text-difficulty-expert",
};

/**
 * 3별 기준 시간 (초)
 * 키는 STAGE_RANGES.label 기준 (입문/초급/중급/고급/마스터)
 * cf. 홈 카드(difficulty-data.ts)는 쉬움/보통/어려움/전문가 표기
 */
const THREE_STAR_THRESHOLD: Record<string, number> = {
  입문: 300,   // 5분
  초급: 600,   // 10분
  중급: 1200,  // 20분
  고급: 2400,  // 40분
  마스터: 2400, // 40분
};

/** 최대 스테이지 */
const MAX_STAGE = 50;

/** 애니메이션 딜레이 (ms) — 디자인 명세 타임라인 */
const DELAY = {
  backdrop: 300,
  modal: 500,
  icon: 800,
  title: 900,
  card: 1000,
  stars: 1100,
  unlock: 1400,
  buttons: 1500,
} as const;

// ────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────

/** 스테이지 번호로 난이도 라벨 + 색상 클래스를 반환 */
const getDifficultyInfo = (
  stage: number,
): { label: string; colorClass: string } => {
  for (const range of STAGE_RANGES) {
    if (stage >= range.startStage && stage <= range.endStage) {
      return {
        label: range.label,
        colorClass: DIFFICULTY_COLOR_MAP[range.label] ?? "text-muted-foreground",
      };
    }
  }
  return { label: "알 수 없음", colorClass: "text-muted-foreground" };
};

/** 별점 계산 */
const calculateStars = (
  hintsUsed: number,
  timer: number,
  difficultyLabel: string,
): number => {
  if (hintsUsed >= 3) return 1;

  const threshold = THREE_STAR_THRESHOLD[difficultyLabel] ?? 600;
  if (hintsUsed === 0 && timer <= threshold) return 3;
  return 2;
};

/** 다음 난이도 해금 정보 (마지막 스테이지 클리어 시) */
const getUnlockInfo = (
  stage: number,
): { nextLabel: string } | null => {
  for (let i = 0; i < STAGE_RANGES.length - 1; i++) {
    if (stage === STAGE_RANGES[i].endStage) {
      return { nextLabel: STAGE_RANGES[i + 1].label };
    }
  }
  return null;
};

// ────────────────────────────────────────
// 서브 컴포넌트
// ────────────────────────────────────────

interface StarRatingProps {
  stars: number;
  baseDelay: number;
}

/** 별점 표시 (순차 scale-in 애니메이션) */
const StarRating = memo(({ stars, baseDelay }: StarRatingProps) => (
  <div className="flex items-center gap-1" aria-label={`별 ${stars}개`}>
    {[1, 2, 3].map((i) => (
      <Star
        key={i}
        size={20}
        className={
          i <= stars
            ? "text-warning fill-warning"
            : "text-muted fill-muted"
        }
        style={{
          animation: `star-scale-in 200ms ease-out ${baseDelay + (i - 1) * 100}ms both`,
        }}
        aria-hidden="true"
      />
    ))}
  </div>
));
StarRating.displayName = "StarRating";

// ────────────────────────────────────────
// ClearModal 컴포넌트
// ────────────────────────────────────────

/**
 * 클리어 결과 모달
 *
 * 퍼즐 완성(isComplete === true) 시 표시.
 * 축하 아이콘 + 결과 요약 + 액션 버튼으로 구성.
 *
 * - 배경 클릭으로 닫히지 않음 (결과 확인 강제)
 * - ESC 키: 홈으로 이동
 * - 포커스 트랩 적용
 * - 스태거 애니메이션 (~1.7초)
 *
 * @see docs/design/clear-modal.md
 */
const ClearModal = () => {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  // ── 스토어 구독 ──
  const isComplete = useGameStore((s) => s.isComplete);
  const timer = useGameStore((s) => s.timer);
  const stage = useGameStore((s) => s.stage);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const initGame = useGameStore((s) => s.initGame);

  // ── 인증 상태 ──
  const { isAuthenticated } = useAuth();

  // ── 게스트 기록 저장 ──
  const addGuestRecord = useGuestRecordStore((s) => s.addRecord);

  // ── 계산된 값 ──
  const { label: difficultyLabel, colorClass: difficultyColor } = useMemo(
    () => getDifficultyInfo(stage),
    [stage],
  );

  const stars = useMemo(
    () => calculateStars(hintsUsed, timer, difficultyLabel),
    [hintsUsed, timer, difficultyLabel],
  );

  const unlockInfo = useMemo(() => getUnlockInfo(stage), [stage]);
  const isLastStage = stage >= MAX_STAGE;

  // ── 게스트 클리어 기록 자동 저장 ──
  const savedRef = useRef(false);

  useEffect(() => {
    // 게임 완료 + 비로그인 + 아직 저장 안 했으면 기록 추가
    if (isComplete && !isAuthenticated && !savedRef.current) {
      savedRef.current = true;
      addGuestRecord({
        stage,
        clearTime: timer,
        hintsUsed,
        stars,
      });
    }

    // 새 게임 시작 시 플래그 초기화
    if (!isComplete) {
      savedRef.current = false;
    }
  }, [isComplete, isAuthenticated, stage, timer, hintsUsed, stars, addGuestRecord]);

  // ── 핸들러 ──
  const handleNextStage = useCallback(() => {
    const nextStage = isLastStage ? stage : stage + 1;
    initGame(nextStage);
    router.replace(`/game?stage=${nextStage}`);
  }, [stage, isLastStage, initGame, router]);

  const handleRanking = useCallback(() => {
    if (isAuthenticated) {
      router.push("/ranking");
    } else {
      router.push("/login");
    }
  }, [router, isAuthenticated]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  // ── 포커스 트랩 + ESC 핸들링 ──
  useEffect(() => {
    if (!isComplete) return;

    // 애니메이션 완료 후 초기 포커스
    const focusTimeout = setTimeout(() => {
      primaryBtnRef.current?.focus();
    }, DELAY.buttons + 200);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleGoHome();
        return;
      }

      // Tab 포커스 트랩
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isComplete, handleGoHome]);

  // ── 비표시 ──
  if (!isComplete) return null;

  return (
    <>
      {/* ── 배경 오버레이 ── */}
      <div
        className="fixed inset-0 z-[var(--z-modal-overlay)]"
        style={{
          backgroundColor: "oklch(0 0 0 / 0.5)",
          backdropFilter: "blur(4px)",
          animation: `clear-fade-in var(--duration-slow) ease-out ${DELAY.backdrop}ms both`,
        }}
        aria-hidden="true"
      />

      {/* ── 모달 ── */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="퍼즐 완성 결과"
        className={
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 " +
          "z-[var(--z-modal)] " +
          "w-[calc(100vw_-_48px)] max-w-[360px] " +
          "max-[374px]:w-[calc(100vw_-_32px)] " +
          "min-[768px]:max-w-[420px] " +
          "max-h-[90vh] overflow-y-auto " +
          "bg-card border border-border rounded-xl " +
          "py-8 px-6 " +
          "flex flex-col items-center " +
          "max-[374px]:py-6 max-[374px]:px-4 " +
          "min-[768px]:py-10 min-[768px]:px-8"
        }
        style={{
          boxShadow: "var(--shadow-xl)",
          animation: `modal-enter 300ms cubic-bezier(0, 0, 0.2, 1) ${DELAY.modal}ms both`,
        }}
      >
        {/* ── 축하 아이콘 ── */}
        <PartyPopper
          size={48}
          className="text-success mb-4"
          aria-hidden="true"
          style={{
            animation: `bounce-in var(--duration-slower) var(--ease-bounce) ${DELAY.icon}ms both`,
          }}
        />

        {/* ── 제목 ── */}
        <h2
          className="text-(length:--text-heading) font-bold text-foreground text-center mb-6"
          style={{
            animation: `clear-fade-in var(--duration-normal) ease-out ${DELAY.title}ms both`,
          }}
        >
          퍼즐을 완성했어요!
        </h2>

        {/* ── 결과 카드 ── */}
        <div
          className="bg-muted rounded-[var(--radius-lg)] p-5 w-full mb-6 flex flex-col gap-3"
          aria-live="polite"
          style={{
            animation: `clear-fade-in var(--duration-normal) ease-out ${DELAY.card}ms both`,
          }}
        >
          {/* 난이도 */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-(length:--text-caption)">
              난이도
            </span>
            <span className={`text-(length:--text-caption) font-bold ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          </div>

          {/* 시간 */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-(length:--text-caption)">
              시간
            </span>
            <span className="font-mono text-(length:--text-body) font-bold text-foreground">
              {formatTime(timer)}
            </span>
          </div>

          {/* 힌트 */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-(length:--text-caption)">
              힌트
            </span>
            <span className="text-(length:--text-caption) text-foreground">
              {hintsUsed}회 사용
            </span>
          </div>

          {/* 평가 */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-(length:--text-caption)">
              평가
            </span>
            <StarRating stars={stars} baseDelay={DELAY.stars} />
          </div>
        </div>

        {/* ── 해금 알림 (조건부) ── */}
        {unlockInfo && (
          <div
            className={
              "w-full mb-6 flex items-center gap-3 " +
              "bg-success/10 border border-success/30 " +
              "rounded-[var(--radius-md)] py-3 px-4"
            }
            style={{
              animation: `slide-down-fade 300ms ease-out ${DELAY.unlock}ms both`,
            }}
          >
            <Unlock size={18} className="text-success shrink-0" aria-hidden="true" />
            <div>
              <p className="text-(length:--text-caption) font-semibold text-foreground">
                새로운 난이도가 해금되었어요!
              </p>
              <p className="text-(length:--text-small) text-muted-foreground">
                {unlockInfo.nextLabel} 도전 가능
              </p>
            </div>
          </div>
        )}

        {/* ── 액션 버튼 ── */}
        <div
          className="flex flex-col gap-[10px] w-full"
          style={{
            animation: `clear-fade-in var(--duration-normal) ease-out ${DELAY.buttons}ms both`,
          }}
        >
          {/* 다음 스테이지 / 한 번 더 */}
          <Button
            ref={primaryBtnRef}
            variant="default"
            className="h-12 w-full gap-2 text-base bg-sudoku-primary hover:bg-sudoku-primary/90"
            onClick={handleNextStage}
          >
            <Play size={16} />
            {isLastStage ? "한 번 더" : "다음 스테이지"}
          </Button>

          {/* 랭킹 보기 / 로그인하고 기록 저장 */}
          <Button
            variant="secondary"
            className="h-11 w-full gap-2 text-base"
            onClick={handleRanking}
          >
            <Trophy size={16} />
            {isAuthenticated ? "랭킹 보기" : "로그인하고 기록 저장"}
          </Button>

          {/* 홈으로 */}
          <Button
            variant="ghost"
            className="h-11 w-full gap-2 text-base"
            onClick={handleGoHome}
          >
            <Home size={16} />
            홈으로
          </Button>
        </div>
      </div>
    </>
  );
};

export default ClearModal;
