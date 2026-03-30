/**
 * NextAuth.js 타입 확장
 *
 * DB 세션 전략에서 session.user에 커스텀 필드를 추가하기 위해
 * next-auth 모듈의 타입을 확장한다.
 *
 * @see https://authjs.dev/getting-started/typescript
 */

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      nickname?: string | null;
    };
  }

  interface User {
    nickname?: string | null;
  }
}
