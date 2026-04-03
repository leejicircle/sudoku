/**
 * 랭킹 시스템 관련 타입 정의
 *
 * 게임 클리어 기록 저장, 스테이지별 랭킹 조회,
 * 개인 기록 조회에 사용되는 타입.
 *
 * @see docs/adr/204-game-record-schema.md
 * @see GitHub Issue #6 — Epic: 랭킹 시스템
 */

// ─── 클리어 기록 저장 ────────────────────────────────

/** POST /api/game/clear 요청 본문 */
export interface GameClearRequest {
  /** 스테이지 번호 (1~50) */
  stage: number;
  /** 클리어 시간 (초, 양의 정수) */
  clearTime: number;
  /** 힌트 사용 횟수 (0~3) */
  hintsUsed: number;
  /** 별점 (1~3) */
  stars: number;
}

/** POST /api/game/clear 응답 데이터 */
export interface GameClearResponseData {
  /** 저장된 기록 ID */
  recordId: string;
  /** 해당 스테이지 개인 최고 기록 여부 */
  isPersonalBest: boolean;
  /** 해당 스테이지 개인 최고 클리어 시간 (초) */
  personalBestTime: number;
}

// ─── 랭킹 조회 ──────────────────────────────────────

/** 랭킹 항목 (스테이지별 최고 기록 1건/사용자) */
export interface RankingEntry {
  /** 순위 (1부터 시작) */
  rank: number;
  /** 사용자 ID */
  userId: string;
  /** 사용자 닉네임 또는 이름 */
  displayName: string;
  /** 프로필 이미지 URL */
  profileImage: string | null;
  /** 최고 클리어 시간 (초) */
  clearTime: number;
  /** 해당 기록의 힌트 사용 횟수 */
  hintsUsed: number;
  /** 해당 기록의 별점 */
  stars: number;
  /** 클리어 일시 (ISO 8601) */
  completedAt: string;
}

/** GET /api/ranking 응답 데이터 */
export interface RankingResponseData {
  /** 조회한 스테이지 번호 */
  stage: number;
  /** 랭킹 목록 */
  rankings: RankingEntry[];
  /** 전체 참여자 수 */
  totalPlayers: number;
}

// ─── 내 기록 조회 ────────────────────────────────────

/** 스테이지별 개인 최고 기록 */
export interface PersonalBestRecord {
  /** 스테이지 번호 */
  stage: number;
  /** 최고 클리어 시간 (초) */
  clearTime: number;
  /** 힌트 사용 횟수 */
  hintsUsed: number;
  /** 별점 */
  stars: number;
  /** 클리어 일시 (ISO 8601) */
  completedAt: string;
  /** 해당 스테이지 플레이 횟수 */
  playCount: number;
}

/** GET /api/ranking/me 응답 데이터 */
export interface MyRankingResponseData {
  /** 스테이지별 최고 기록 목록 */
  records: PersonalBestRecord[];
  /** 클리어한 스테이지 총 수 */
  clearedStages: number;
  /** 전체 플레이 횟수 */
  totalPlays: number;
}

// ─── 상수 ────────────────────────────────────────────

/** 랭킹 목록 기본 조회 개수 */
export const RANKING_DEFAULT_LIMIT = 20;

/** 랭킹 목록 최대 조회 개수 */
export const RANKING_MAX_LIMIT = 100;
