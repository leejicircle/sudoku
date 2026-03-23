export { auth as middleware } from "@/lib/auth";

export const config = {
  // Auth.js가 처리할 경로만 미들웨어 적용
  // 정적 파일, API route, 공개 페이지는 제외
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)",
  ],
};
