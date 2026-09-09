/**
 * 랭킹 컴포넌트 공통 유틸리티
 *
 * 시간 포맷, 별점 렌더링, 난이도 탭 데이터 등
 * 랭킹 UI 전반에서 사용하는 헬퍼.
 */

// ─── 난이도 탭 데이터 ─────────────────────────────────

import { DIFFICULTIES } from "@/components/home/difficulty-data";
import { MAX_STAGE } from "@/types/guest";

export interface DifficultyTab {
  id: string;
  label: string;
  /** 구간 첫 스테이지 — 탭 전환 시 기본 선택 */
  startStage: number;
  /** 구간 마지막 스테이지 */
  endStage: number;
}

/**
 * 난이도 탭 — 홈 화면 난이도 카드(DIFFICULTIES)에서 구간을 파생한다.
 *
 * 구간 목록을 여기 다시 적으면 홈과 어긋날 수 있으므로 startStage만 가져와
 * 다음 카드의 시작 - 1을 끝으로 잡는다. (쉬움 1~10 · 보통 11~20 ·
 * 어려움 21~30 · 전문가 31~50)
 *
 * types/game.ts의 STAGE_RANGES는 엔진용 5구간이라 사용자가 보는 4단계와
 * 다르다 — 그쪽을 기준으로 삼지 않는다.
 */
export const DIFFICULTY_TABS: readonly DifficultyTab[] = DIFFICULTIES.map(
  ({ id, label, startStage }, i) => ({
    id,
    label,
    startStage,
    endStage: (DIFFICULTIES[i + 1]?.startStage ?? MAX_STAGE + 1) - 1,
  }),
);

/** 구간에 속한 스테이지 번호 목록 */
export const stagesOf = (tab: DifficultyTab): number[] =>
  Array.from(
    { length: tab.endStage - tab.startStage + 1 },
    (_, i) => tab.startStage + i,
  );

// ─── 시간 포맷 ────────────────────────────────────────

/** 초 → "MM:SS" 형식 변환 */
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ─── 날짜 포맷 ────────────────────────────────────────

/** ISO 문자열 → "YYYY.MM.DD" 형식 변환 */
export const formatDate = (isoString: string): string => {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

// ─── 순위 테두리 ────────────────────────────────────────

/**
 * 아바타 테두리 — 금/은/동 대신 잉크 명도 사다리.
 *
 * 리터럴 oklch로 두면 라이트 전용 값이 되어 다크 모드에서 대비가 무너진다.
 * `var()` 참조로 두면 두 모드에서 자동 반전된다.
 */
export const MEDAL_COLORS = {
  1: "var(--foreground)",
  2: "var(--muted-foreground)",
  3: "var(--board-border-thin)",
} as const;

