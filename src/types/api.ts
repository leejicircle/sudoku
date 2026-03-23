/**
 * API 응답 공통 타입 정의
 */

/** 성공 응답 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/** 에러 응답 */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/** API 응답 유니온 타입 */
export type ApiResponse<T = unknown> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;
