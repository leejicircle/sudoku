"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { syncThemeColorMeta } from "@/lib/theme";

/**
 * 라이트/다크 2단계 토글.
 * 최초 상태는 layout.tsx의 blocking 인라인 스크립트가 이미 <html>에 심어놨으므로
 * 여기서는 읽어서 뒤집기만 한다.
 *
 * ponytail: next-themes 대신 직접 구현. system/light/dark 3단계는 과설계라 생략.
 */
const ThemeToggle = () => {
  // 서버는 테마를 모른다 → 초기값을 false로 두어 첫 클라이언트 렌더가 서버 HTML과 일치하게 하고
  // (하이드레이션 경고 방지), 실제 값은 마운트 후 effect에서 채운다.
  // 아이콘 자체는 상태가 아니라 CSS dark: 변형으로 그려서 마운트 전에도 올바르게 보인다.
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    // 진짜 출처는 <html>의 클래스 — React state를 뒤집으면 배칭 중에 어긋난다
    const next = document.documentElement.classList.toggle("dark");
    syncThemeColorMeta(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Safari 프라이빗 모드 등 — 저장 실패해도 이번 세션 전환은 유효하다
    }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors duration-100 hover:bg-accent"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={isDark}
    >
      <Moon className="size-5 dark:hidden" strokeWidth={1.75} />
      <Sun className="hidden size-5 dark:block" strokeWidth={1.75} />
    </button>
  );
};

export default ThemeToggle;
