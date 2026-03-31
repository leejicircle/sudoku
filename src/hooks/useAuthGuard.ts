"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "./useAuth";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface UseAuthGuardOptions {
  /** 미인증 시 리다이렉트할 경로 (기본: "/login") */
  redirectTo?: string;
  /** 리다이렉트 비활성화 — 상태만 반환 */
  redirect?: boolean;
}

interface UseAuthGuardReturn {
  /** 인증 확인 완료 여부 (로딩 끝 + 인증됨) */
  isReady: boolean;
  /** 세션 로딩 중 여부 */
  isLoading: boolean;
  /** 인증 여부 */
  isAuthenticated: boolean;
}

// ────────────────────────────────────────
// Hook
// ────────────────────────────────────────

/**
 * 인증이 필요한 페이지에서 사용하는 가드 훅
 *
 * 미인증 상태가 확인되면 로그인 페이지로 리다이렉트한다.
 * 인증 확인이 완료될 때까지 isReady는 false이다.
 *
 * @example
 * ```tsx
 * const MyProtectedPage = () => {
 *   const { isReady } = useAuthGuard();
 *
 *   if (!isReady) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return <div>보호된 콘텐츠</div>;
 * };
 * ```
 */
const useAuthGuard = (options: UseAuthGuardOptions = {}): UseAuthGuardReturn => {
  const { redirectTo = "/login", redirect = true } = options;
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirect) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.replace(`${redirectTo}?callbackUrl=${callbackUrl}`);
    }
  }, [isLoading, isAuthenticated, redirect, redirectTo, router]);

  return {
    isReady: !isLoading && isAuthenticated,
    isLoading,
    isAuthenticated,
  };
};

export default useAuthGuard;
