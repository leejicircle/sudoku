# ADR-201: Auth.js v5 인증 구성

## Status

Accepted

## Context

스도쿠 웹앱은 사용자 인증이 필요하다. 게임 기록 저장과 랭킹 시스템은 로그인된 사용자에게만 제공된다.
OAuth 기반 소셜 로그인을 지원하며, 한국 사용자를 고려해 Google + Naver를 선택한다.

## Decision

- **Auth.js v5 (next-auth@beta)** 사용
  - Next.js App Router와 네이티브 통합
  - Edge Runtime 호환
  - `@auth/prisma-adapter`로 Prisma 스키마와 직접 연동
- **Provider**: Google OAuth + Naver OAuth
  - Google: 글로벌 표준 소셜 로그인
  - Naver: 한국 사용자 접근성 확보
- **세션 전략**: `database` 방식
  - DB에 세션 저장 → 서버 측에서 세션 무효화 가능
  - Prisma Adapter가 세션 CRUD를 자동 처리
- **미들웨어**: 인증 상태 확인용
  - 정적 파일, API, 공개 페이지는 미들웨어에서 제외
  - 인증이 필요한 페이지 접근 시 `/login`으로 리다이렉트

## Consequences

**긍정적**
- OAuth만 사용하므로 비밀번호 관리/해싱 불필요
- Auth.js의 CSRF 보호 내장
- `auth()` 호출만으로 서버 컴포넌트/API에서 세션 접근 가능

**부정적**
- Auth.js v5가 아직 beta (API 변경 가능성)
- Naver OAuth는 Auth.js 커뮤니티 프로바이더로 업데이트가 느릴 수 있음
