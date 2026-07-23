/**
 * 최소 오프라인 캐싱 서비스워커 (Workbox 등 라이브러리 없이 직접 작성)
 *
 * 전략:
 * - 정적 자산(_next/static, /icons, 폰트): cache-first (해시된 불변 파일)
 * - 페이지 네비게이션: network-first → 오프라인 시 캐시된 셸로 폴백
 * - API·인증(/api/*): 항상 네트워크 (동적·인증 데이터, 캐시 금지)
 *
 * ponytail: 런타임 캐싱만. 프리캐시/버전 매니페스트가 필요해지면 그때 Serwist 도입.
 */
const CACHE = "sudoku-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // 오프라인 폴백용으로 홈만 미리 캐시
  event.waitUntil(caches.open(CACHE).then((c) => c.add("/")).catch(() => {}));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부 요청 패스
  if (url.pathname.startsWith("/api/")) return; // API·인증은 항상 네트워크

  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|png|svg|woff2?|ico|webmanifest)$/.test(url.pathname);

  if (isStatic) {
    // cache-first
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  if (request.mode === "navigate") {
    // network-first, 실패 시 캐시 폴백
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
  }
});
