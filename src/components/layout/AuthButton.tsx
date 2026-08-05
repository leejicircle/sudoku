"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/** 로그인/프로필 아이콘 버튼 — 세션 상태에 따라 변형 */
const AuthButton = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // 세션 로딩 중 — 아바타와 동일한 크기의 빈 자리만 잡아 "로그인" 버튼 깜빡임(FOUC) 방지
  // ponytail: 스켈레톤 애니메이션 생략, 로딩이 체감될 만큼 길어지면 추가
  if (isLoading) return <div className="size-11" aria-hidden="true" />;

  if (isAuthenticated && user) {
    const name = user.nickname ?? user.name ?? "";
    const displayName = name || "사용자";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-11 cursor-pointer items-center justify-center outline-none"
          aria-label={`${displayName} 메뉴`}
        >
          {user.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.image}
              alt={displayName}
              className="size-8 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {name.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={4} className="w-48">
          {/* 사용자 정보 */}
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {user.email && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* 로그아웃 */}
          <DropdownMenuItem
            onClick={() => void logout()}
            className="cursor-pointer gap-2"
          >
            <LogOut className="size-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      render={<Link href="/login" />}
      className="h-11 rounded-[var(--radius-sm)] px-4"
      aria-label="로그인"
    >
      로그인
    </Button>
  );
};

export default AuthButton;
