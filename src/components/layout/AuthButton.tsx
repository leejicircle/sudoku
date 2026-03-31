"use client";

import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/** 로그인/프로필 아이콘 버튼 — 세션 상태에 따라 변형 */
const AuthButton = () => {
  const { user, isAuthenticated, logout } = useAuth();

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
            onSelect={async () => {
              await logout();
            }}
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
    <Link
      href="/login"
      className="flex size-11 items-center justify-center text-muted-foreground transition-colors duration-100 hover:text-foreground"
      aria-label="로그인"
    >
      <User className="size-6" />
    </Link>
  );
};

export default AuthButton;
