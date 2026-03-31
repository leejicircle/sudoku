"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks";

/** 로그인/프로필 아이콘 버튼 — 세션 상태에 따라 변형 */
const AuthButton = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // ESC 키로 메뉴 닫기
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  if (isAuthenticated && user) {
    const name = user.nickname ?? user.name ?? "";
    const displayName = name || "사용자";

    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex size-11 items-center justify-center"
          aria-label={`${displayName} 메뉴`}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
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
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            className={
              "absolute right-0 top-full z-50 mt-1 w-48 " +
              "rounded-lg border border-border bg-popover p-1 shadow-lg " +
              "animate-in fade-in zoom-in-95 duration-100"
            }
          >
            {/* 사용자 정보 */}
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {user.email && (
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>

            {/* 로그아웃 */}
            <button
              role="menuitem"
              onClick={async () => {
                setIsMenuOpen(false);
                await logout();
              }}
              className={
                "mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 " +
                "text-sm text-muted-foreground " +
                "transition-colors duration-100 " +
                "hover:bg-accent hover:text-foreground " +
                "cursor-pointer"
              }
            >
              <LogOut className="size-4" />
              로그아웃
            </button>
          </div>
        )}
      </div>
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
