"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Grid3X3, AlertCircle } from "lucide-react";
import OAuthButton from "@/components/auth/oauth-button";
import { AppLayout, BrandWordmark } from "@/components/layout";
import { useAuth } from "@/hooks";

/** Auth.js 에러 코드 → 사용자 친화적 메시지 */
const errorMessages: Record<string, string> = {
  OAuthSignin: "OAuth 서비스 연결에 실패했습니다. 다시 시도해주세요.",
  OAuthCallback: "로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.",
  OAuthAccountNotLinked:
    "이미 다른 방법으로 가입된 이메일입니다. 기존 로그인 방식을 사용해주세요.",
  Callback: "로그인에 실패했습니다. 다시 시도해주세요.",
  Default: "로그인에 실패했습니다. 다시 시도해주세요.",
};

const LoginContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  // 이미 로그인된 상태면 callbackUrl 또는 홈으로 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated && !error) {
      router.replace(callbackUrl);
    }
  }, [isLoading, isAuthenticated, error, callbackUrl, router]);

  const errorMessage = error
    ? errorMessages[error] ?? errorMessages.Default
    : null;

  // 로딩 중이거나 인증된 상태면 로그인 폼을 숨겨서 깜빡임 방지
  if (isLoading || (isAuthenticated && !error)) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Grid3X3
          className="size-10 animate-pulse text-sudoku-primary"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  return (
    <AppLayout headerVariant="login">
      {/* 메인 콘텐츠 — 2컬럼 반응형 */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 lg:gap-16">
        {/* 좌측 일러스트 영역 (≥1024px만 표시) */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-6">
          <div className="flex size-32 items-center justify-center rounded-3xl bg-gradient-to-br from-sudoku-primary/20 via-sudoku-primary/10 to-transparent backdrop-blur-sm">
            <Grid3X3
              className="size-20 text-sudoku-primary"
              strokeWidth={1.5}
            />
          </div>
          <div className="text-center">
            <BrandWordmark size="md" />
            <p className="mt-2 text-sm text-muted-foreground">
              언제 어디서든 즐기는 숫자 퍼즐
            </p>
          </div>
        </div>

        {/* 로그인 폼 영역 */}
        <div
          className={
            "flex w-full flex-col items-center " +
            /* ≥768px: 카드 UI */
            "md:w-100 md:rounded-2xl md:border md:border-border/60 md:bg-card/80 md:p-8 md:shadow-xl md:backdrop-blur-xl"
          }
        >
          {/* 로고 & 텍스트 (PC 2컬럼에서는 숨김) */}
          <div className="flex flex-col items-center lg:hidden">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sudoku-primary/20 via-sudoku-primary/10 to-transparent">
              <Grid3X3
                className="size-12 text-sudoku-primary"
                strokeWidth={1.5}
              />
            </div>
            <h2 className="mt-4">
              <BrandWordmark size="sm" />
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              스도쿠에 오신 것을 환영합니다
            </p>
          </div>

          {/* PC 2컬럼일 때 카드 내부 타이틀 */}
          <div className="hidden lg:block lg:w-full lg:text-center">
            <h2 className="text-xl font-bold">로그인</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              소셜 계정으로 간편하게 시작하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <div
              className="mt-6 flex w-full max-w-[320px] items-start gap-2 animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-[13px] text-destructive">{errorMessage}</p>
            </div>
          )}

          {/* OAuth 버튼 */}
          <div className="mt-10 flex w-full flex-col items-center gap-3 lg:mt-8">
            <OAuthButton provider="google" callbackUrl={callbackUrl} />
            <OAuthButton provider="naver" callbackUrl={callbackUrl} />
          </div>

          {/* 하단 캡션 */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            게임은 로그인 없이도 즐길 수 있어요
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

/** useSearchParams()는 Suspense 경계 안에서 사용해야 함 */
const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Grid3X3
            className="size-10 animate-pulse text-sudoku-primary"
            strokeWidth={1.5}
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
