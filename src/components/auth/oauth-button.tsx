"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import GoogleLogo from "./google-logo";
import NaverLogo from "./naver-logo";

interface OAuthButtonProps {
  provider: "google" | "naver";
  callbackUrl?: string;
  className?: string;
}

const providerConfig = {
  google: {
    label: "Google로 계속하기",
    loadingLabel: "로그인 중...",
    Logo: GoogleLogo,
    className: cn(
      /* Light */
      "bg-[oklch(0.98_0_0)] border border-border text-[oklch(0.30_0_0)]",
      "shadow-sm",
      "hover:bg-[oklch(0.96_0_0)]",
      "active:bg-[oklch(0.94_0_0)] active:scale-[0.98]",
      /* Dark */
      "dark:bg-[oklch(0.25_0_0)] dark:border-[oklch(1_0_0/15%)] dark:text-[oklch(0.92_0_0)]",
      "dark:hover:bg-[oklch(0.28_0_0)]",
      "dark:active:bg-[oklch(0.22_0_0)]"
    ),
  },
  naver: {
    label: "네이버로 계속하기",
    loadingLabel: "로그인 중...",
    Logo: NaverLogo,
    className: cn(
      /* Light & Dark (브랜드 색상 유지) */
      "bg-[oklch(0.62_0.17_145)] border-transparent text-white",
      "hover:bg-[oklch(0.58_0.17_145)]",
      "active:bg-[oklch(0.55_0.17_145)] active:scale-[0.98]"
    ),
  },
} as const;

const OAuthButton = ({
  provider,
  callbackUrl = "/",
  className,
}: OAuthButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const config = providerConfig[provider];
  const { Logo } = config;

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isLoading ? config.loadingLabel : config.label}
      className={cn(
        /* 공통 스타일 */
        "flex w-full max-w-[320px] items-center justify-center gap-3",
        "h-12 rounded-[var(--radius-md)] px-4",
        "text-base font-medium",
        "transition-all duration-[var(--duration-fast)]",
        "cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-70",
        /* 프로바이더별 스타일 */
        config.className,
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Logo size={20} />
      )}
      <span>{isLoading ? config.loadingLabel : config.label}</span>
    </button>
  );
};

export default OAuthButton;
