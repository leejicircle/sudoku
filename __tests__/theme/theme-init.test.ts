/**
 * 테마 초기화 스크립트 테스트
 * — layout.tsx의 <head>에서 첫 페인트 전에 실행되므로 브라우저에서 눈으로 잡기 어렵다.
 *   저장된 선택 / 시스템 설정 / 저장소 접근 실패 세 갈래만 확인한다.
 */
import { describe, expect, it } from "vitest";
import { THEME_COLOR, THEME_INIT_SCRIPT } from "@/lib/theme";

/** 스크립트를 최소 DOM 스텁 위에서 실행하고 결과 상태를 돌려준다 */
const run = (opts: { stored?: string | null; systemDark: boolean; throwOnRead?: boolean }) => {
  const classes = new Set<string>();
  let metaContent: string = THEME_COLOR.light;

  const localStorage = {
    getItem: () => {
      if (opts.throwOnRead) throw new Error("SecurityError");
      return opts.stored ?? null;
    },
  };
  const document = {
    documentElement: { classList: { add: (c: string) => classes.add(c) } },
    querySelector: () => ({ setAttribute: (_: string, v: string) => (metaContent = v) }),
  };
  const matchMedia = () => ({ matches: opts.systemDark });

  new Function("localStorage", "document", "matchMedia", THEME_INIT_SCRIPT)(
    localStorage,
    document,
    matchMedia,
  );

  return { dark: classes.has("dark"), metaContent };
};

describe("THEME_INIT_SCRIPT", () => {
  it("저장된 선택이 시스템 설정보다 우선한다", () => {
    expect(run({ stored: "dark", systemDark: false }).dark).toBe(true);
    expect(run({ stored: "light", systemDark: true }).dark).toBe(false);
  });

  it("저장된 선택이 없으면 시스템 설정을 따른다", () => {
    expect(run({ stored: null, systemDark: true }).dark).toBe(true);
    expect(run({ stored: null, systemDark: false }).dark).toBe(false);
  });

  it("다크일 때 theme-color meta도 함께 바꾼다", () => {
    expect(run({ stored: "dark", systemDark: false }).metaContent).toBe(THEME_COLOR.dark);
    expect(run({ stored: "light", systemDark: true }).metaContent).toBe(THEME_COLOR.light);
  });

  it("localStorage 접근이 막혀도 던지지 않는다 (Safari 프라이빗 모드)", () => {
    expect(() => run({ throwOnRead: true, systemDark: true })).not.toThrow();
  });
});
