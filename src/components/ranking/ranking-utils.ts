/**
 * 랭킹 컴포넌트 공통 유틸리티
 *
 * 시간 포맷, 별점 렌더링, 난이도 탭 데이터 등
 * 랭킹 UI 전반에서 사용하는 헬퍼.
 */

// ─── 난이도 탭 데이터 ─────────────────────────────────

export interface DifficultyTab {
  id: string;
  label: string;
  /** 대표 스테이지 번호 (API 조회용) */
  stage: number;
  /** 활성 인디케이터 Tailwind 색상 클래스 */
  activeClass: string;
}

export const DIFFICULTY_TABS: readonly DifficultyTab[] = [
  { id: "easy", label: "쉬움", stage: 1, activeClass: "bg-difficulty-easy" },
  { id: "medium", label: "보통", stage: 11, activeClass: "bg-difficulty-medium" },
  { id: "hard", label: "어려움", stage: 21, activeClass: "bg-difficulty-hard" },
  { id: "expert", label: "전문가", stage: 31, activeClass: "bg-difficulty-expert" },
] as const;

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

// ─── 메달 색상 ────────────────────────────────────────

export const MEDAL_COLORS = {
  1: "oklch(0.80 0.15 85)",   // 금
  2: "oklch(0.75 0.02 250)",  // 은
  3: "oklch(0.65 0.10 55)",   // 동
} as const;

export const MEDAL_EMOJI = {
  1: "\uD83E\uDD47",
  2: "\uD83E\uDD48",
  3: "\uD83E\uDD49",
} as const;
