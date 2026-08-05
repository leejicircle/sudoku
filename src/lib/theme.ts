/**
 * 테마 상수 + 초기화 스크립트.
 * globals.css의 `--background` oklch 값을 sRGB hex로 변환한 것 —
 * 모바일 브라우저 상단 크롬/PWA 상태바가 지면 색과 이어지도록 한다.
 *
 * light: oklch(0.968 0.008 85)  → #f7f4ee
 * dark : oklch(0.185 0.008 70)  → #15120f
 */
export const THEME_COLOR = {
  light: "#f7f4ee",
  dark: "#15120f",
} as const;

/** <meta name="theme-color">를 현재 테마에 맞춰 갱신 */
export const syncThemeColorMeta = (isDark: boolean) => {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? THEME_COLOR.dark : THEME_COLOR.light);
};

/**
 * 첫 페인트 전에 실행되는 blocking 스크립트 (FOUC 방지).
 * 저장된 선택이 없으면 시스템 설정을 따른다.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','${THEME_COLOR.dark}')}}catch(e){}`;
