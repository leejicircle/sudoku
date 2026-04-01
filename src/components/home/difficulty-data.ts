/**
 * 홈 화면 난이도 카드 데이터
 *
 * 디자인 명세: docs/design/home.md §3.3
 * UX 플로우: docs/design/ux-flow.md §3.1 해금 조건
 */

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

export interface DifficultyItem {
  /** 고유 ID */
  id: string;
  /** 한글명 */
  label: string;
  /** 영문명 */
  labelEn: string;
  /** 좌측 인디케이터 Tailwind 배경 클래스 */
  indicatorClass: string;
  /** 해금 조건 텍스트 (null이면 항상 해금) */
  unlockCondition: string | null;
  /** 게임 시작 시 사용할 첫 번째 스테이지 번호 */
  startStage: number;
}

// ────────────────────────────────────────
// Data
// ────────────────────────────────────────

/**
 * 난이도 카드 목록
 *
 * | 난이도  | 스테이지 범위 | 해금 조건           |
 * |--------|-------------|-------------------|
 * | 쉬움   | 1~10        | 없음 (항상 해금)     |
 * | 보통   | 11~20       | 쉬움 클리어 시 해금   |
 * | 어려움  | 21~30       | 보통 클리어 시 해금   |
 * | 전문가  | 31~50       | 어려움 클리어 시 해금  |
 */
export const DIFFICULTIES: readonly DifficultyItem[] = [
  {
    id: "easy",
    label: "쉬움",
    labelEn: "Easy",
    indicatorClass: "bg-difficulty-easy",
    unlockCondition: null,
    startStage: 1,
  },
  {
    id: "medium",
    label: "보통",
    labelEn: "Medium",
    indicatorClass: "bg-difficulty-medium",
    unlockCondition: "쉬움 클리어 시 해금",
    startStage: 11,
  },
  {
    id: "hard",
    label: "어려움",
    labelEn: "Hard",
    indicatorClass: "bg-difficulty-hard",
    unlockCondition: "보통 클리어 시 해금",
    startStage: 21,
  },
  {
    id: "expert",
    label: "전문가",
    labelEn: "Expert",
    indicatorClass: "bg-difficulty-expert",
    unlockCondition: "어려움 클리어 시 해금",
    startStage: 31,
  },
] as const;
