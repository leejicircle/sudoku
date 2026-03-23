/**
 * Service Worker 등록 유틸리티
 *
 * 프로덕션 환경에서만 Service Worker를 등록하며,
 * 등록 성공/실패 시 콘솔에 로그를 출력합니다.
 */

export function registerServiceWorker(): void {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[SW] registered:", registration.scope);
        }
      })
      .catch((error: unknown) => {
        console.error("[SW] registration failed:", error);
      });
  });
}

export function unregisterServiceWorker(): void {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => registration.unregister())
    .catch((error: unknown) => {
      console.error("[SW] unregister failed:", error);
    });
}
