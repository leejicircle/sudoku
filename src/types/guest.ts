/**
 * 게스트(비로그인) 모드 관련 타입 정의
 *
 * 비로그인 사용자의 게임 기록을 로컬에 저장하고,
 * 로그인 전환 시 서버로 동기화하기 위한 타입.
 *
 * @see docs/adr/203-guest-mode.md
 * @see GitHub Issue #4 — Epic: 인증 시스템
 */

// ─── 게스트 게임 기록 ─────────────────────────────────

/** 로컬에 저장되는 게스트 게임 클리어 기록 */
export interface GuestGameRecord {
  /** 고유 식별자 (crypto.randomUUID) */
  id: string;
  /** 스테이지 번호 (1~50) */
  stage: number;
  /** 클리어 시간 (초) */
  clearTime: number;
  /** 힌트 사용 횟수 */
  hintsUsed: number;
  /** 별점 (1~3) */
  stars: number;
  /** 클리어 일시 (ISO 8601) */
  completedAt: string;
}

// ─── 동기화 요청/응답 ─────────────────────────────────

/** 게스트 기록 → 서버 동기화 요청 본문 */
export interface GuestSyncRequest {
  /** 동기화할 게스트 기록 배열 */
  records: GuestGameRecord[];
}

/** 동기화 결과 (개별 레코드) */
export interface GuestSyncResultItem {
  /** 게스트 기록 ID */
  guestRecordId: string;
  /** 동기화 상태 */
  status: "synced" | "duplicate" | "invalid";
}

/** 동기화 응답 데이터 */
export interface GuestSyncResponseData {
  /** 전체 처리 건수 */
  total: number;
  /** 신규 동기화 건수 */
  synced: number;
  /** 중복 스킵 건수 */
  duplicates: number;
  /** 유효하지 않은 건수 */
  invalid: number;
  /** 개별 결과 */
  results: GuestSyncResultItem[];
}

// ─── 게스트 스토어 ────────────────────────────────────

/** 게스트 기록 스토어 상태 */
export interface GuestRecordState {
  /** 저장된 게스트 기록 목록 */
  records: GuestGameRecord[];
}

/** 게스트 기록 스토어 액션 */
export interface GuestRecordActions {
  /** 새 클리어 기록 추가 */
  addRecord: (record: Omit<GuestGameRecord, "id" | "completedAt">) => void;
  /** 특정 기록 삭제 */
  removeRecord: (id: string) => void;
  /** 동기화 완료 후 전체 기록 삭제 */
  clearRecords: () => void;
  /** 전체 기록 조회 */
  getRecords: () => GuestGameRecord[];
  /** 특정 스테이지 최고 기록 조회 */
  getBestRecord: (stage: number) => GuestGameRecord | null;
  /** 기록 존재 여부 */
  hasRecords: () => boolean;
}

/** 게스트 기록 스토어 전체 타입 */
export type GuestRecordStore = GuestRecordState & GuestRecordActions;

// ─── 유효성 검증 ──────────────────────────────────────

/** 게스트 기록 유효성 검증 결과 */
export interface GuestRecordValidation {
  /** 유효 여부 */
  isValid: boolean;
  /** 실패 사유 (유효하지 않을 때) */
  reason?: string;
}

// ─── 상수 ─────────────────────────────────────────────

/** 게스트 기록 최대 저장 개수 */
export const GUEST_MAX_RECORDS = 200;

/** 게스트 기록 localStorage 키 */
export const GUEST_STORAGE_KEY = "sudoku-guest-records";

/** 동기화 API 엔드포인트 */
export const GUEST_SYNC_ENDPOINT = "/api/game/sync";

/** 최소 유효 스테이지 */
export const MIN_STAGE = 1;

/** 최대 유효 스테이지 */
export const MAX_STAGE = 50;

/** 최대 유효 클리어 시간 (초) — 10시간 */
export const MAX_CLEAR_TIME = 36_000;

/** 최대 힌트 사용 횟수 */
export const MAX_HINTS = 3;

/** 최소 별점 */
export const MIN_STARS = 1;

/** 최대 별점 */
export const MAX_STARS = 3;
