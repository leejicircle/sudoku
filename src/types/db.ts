/**
 * DB 모델 관련 타입 정의
 *
 * Prisma가 생성하는 타입을 re-export하여
 * 앱 전체에서 일관되게 사용한다.
 */

export type {
  User,
  Account,
  Session,
  VerificationToken,
} from "@prisma/client";
