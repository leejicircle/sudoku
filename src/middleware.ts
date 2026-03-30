export { auth as middleware } from "@/lib/auth";

/**
 * 미들웨어 매칭 경로 설정
 *
 * Auth.js 미들웨어가 세션 쿠키를 갱신하고,
 * 보호 경로에 대한 인증 상태를 확인한다.
 *
 * 현재는 Auth.js의 기본 동작만 활용하며,
 * 추후 보호 경로가 필요해지면 authorized 콜백을 추가한다.
 *
 * 제외 대상:
 * - API 인증 라우트 (/api/auth/*) — Auth.js 내부 처리
 * - 정적 파일 (_next/static, favicon 등)
 * - 공개 이미지 (/images/*)
 */
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에서 미들웨어 실행:
     * - api/auth (Auth.js 내부 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, manifest 등 정적 리소스
     */
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|icons/).*)",
  ],
};
