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
}

export const DIFFICULTY_TABS: readonly DifficultyTab[] = [
  { id: "easy", label: "쉬움", stage: 1 },
  { id: "medium", label: "보통", stage: 11 },
  { id: "hard", label: "어려움", stage: 21 },
  { id: "expert", label: "전문가", stage: 31 },
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

