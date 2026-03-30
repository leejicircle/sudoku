import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Naver({
      clientId: process.env.AUTH_NAVER_ID,
      clientSecret: process.env.AUTH_NAVER_SECRET,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 7 * 24 * 60 * 60, // 7일
    updateAge: 24 * 60 * 60, // 24시간마다 세션 갱신
  },

  pages: {
    signIn: "/login",
    error: "/login", // 에러 발생 시 로그인 페이지로
  },

  callbacks: {
    /**
     * 세션 콜백 — 클라이언트에 전달할 세션 정보 구성
     * DB 세션 전략에서는 user 파라미터에 DB User 레코드가 들어온다.
     */
    session({ session, user }) {
      session.user.id = user.id;
      session.user.nickname = user.nickname ?? null;
      return session;
    },

    /**
     * authorized 콜백 — 미들웨어에서 경로 접근 제어
     *
     * 스도쿠 앱은 비로그인(게스트) 플레이를 허용하므로
     * 모든 경로를 공개한다.
     * 인증이 필요한 API는 각 Route에서 requireAuth()로 개별 검증한다.
     */
    authorized() {
      return true;
    },
  },
};
