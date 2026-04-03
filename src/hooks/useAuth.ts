"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

/** 세션에서 추출한 사용자 정보 */
export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  nickname: string | null;
}

/** 인증 상태 */
export type AuthStatus = "authenticated" | "loading" | "unauthenticated";

/** useAuth 반환 타입 */
export interface UseAuthReturn {
  /** 현재 사용자 정보 (미인증 시 null) */
  user: AuthUser | null;
  /** 인증 상태 */
  status: AuthStatus;
  /** 로그인 여부 */
  isAuthenticated: boolean;
  /** 세션 로딩 중 여부 */
  isLoading: boolean;
  /** 로그인 페이지로 이동 */
  login: (callbackUrl?: string) => void;
  /** 로그아웃 처리 */
  logout: (callbackUrl?: string) => Promise<void>;
}

// ────────────────────────────────────────
// Hook
// ────────────────────────────────────────

/**
 * 인증 상태를 관리하는 커스텀 훅
 *
 * next-auth/react의 useSession을 래핑하여
 * 타입 안전한 사용자 정보와 인증 액션을 제공한다.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (isAuthenticated) {
 *   return <p>{user.name}님 환영합니다</p>;
 * }
 * return <button onClick={() => login()}>로그인</button>;
 * ```
 */
const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const user = useMemo<AuthUser | null>(() => {
    if (status !== "authenticated" || !session?.user) return null;

    return {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      nickname: session.user.nickname ?? null,
    };
  }, [session, status]);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const login = useCallback((callbackUrl?: string) => {
    signIn(undefined, { callbackUrl: callbackUrl ?? pathname });
  }, [pathname]);

  const logout = useCallback(async (callbackUrl: string = "/") => {
    try {
      await signOut({ redirect: false });
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("[useAuth] signOut 실패:", error);
    }
  }, [router]);

  return {
    user,
    status,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};

export default useAuth;
