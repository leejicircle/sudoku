"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { syncThemeColorMeta } from "@/lib/theme";

/** <html>의 dark 클래스 변화를 구독 (테마의 진짜 출처는 DOM) */
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
};

const isDarkNow = () => document.documentElement.classList.contains("dark");

/**
 * 라이트/다크 2단계 토글.
 * 최초 상태는 layout.tsx의 blocking 인라인 스크립트가 이미 <html>에 심어놨으므로
 * 여기서는 읽어서 뒤집기만 한다.
 *
 * ponytail: next-themes 대신 직접 구현. system/light/dark 3단계는 과설계라 생략.
 */
const ThemeToggle = () => {
  // DOM을 구독한다. 서버 스냅샷은 false — 서버는 테마를 모르므로 첫 렌더를
  // 서버 HTML과 일치시켜 하이드레이션 경고를 피한다.
  // 아이콘은 상태가 아니라 CSS dark: 변형으로 그려서 마운트 전에도 올바르게 보인다.
  const isDark = useSyncExternalStore(subscribe, isDarkNow, () => false);

  const toggle = () => {
    // 진짜 출처는 <html>의 클래스 — 구독이 알아서 리렌더를 유발한다
    const next = document.documentElement.classList.toggle("dark");
    syncThemeColorMeta(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Safari 프라이빗 모드 등 — 저장 실패해도 이번 세션 전환은 유효하다
    }
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
