/**
 * NextAuth.js 타입 확장
 *
 * DB 세션 전략에서 session.user에 커스텀 필드를 추가하기 위해
 * next-auth 모듈의 타입을 확장한다.
 *
 * DefaultSession["user"]와 교차하여 Auth.js 기본 필드를 유지하면서
 * 커스텀 필드만 추가한다.
 *
 * @see https://authjs.dev/getting-started/typescript
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nickname?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    nickname?: string | null;
  }
}
