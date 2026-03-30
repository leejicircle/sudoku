# ADR-202: Auth.js v5 상세 설정 — 콜백, 세션 전략, 미들웨어

## Status

Accepted

## Context

ADR-201에서 Auth.js v5의 기본 구성을 결정했다.
이번에는 세션 수명, 콜백 상세 설정, 미들웨어 경로 보호, API Route용 인증 헬퍼를 구체화한다.

스도쿠 앱은 비로그인(게스트) 플레이를 허용하므로, 페이지 접근은 전면 공개하되
게임 기록 저장·랭킹 등 특정 API만 인증을 요구하는 구조가 필요하다.

## Decision

### 1. 세션 설정

```typescript
session: {
  strategy: "database",
  maxAge: 7 * 24 * 60 * 60,   // 7일
  updateAge: 24 * 60 * 60,    // 24시간마다 갱신
}
```

- 7일간 미접속 시 세션 만료 → 재로그인 필요
- 접속할 때마다 24시간 단위로 만료일 자동 연장

### 2. 세션 콜백 — 커스텀 필드 추가

```typescript
session({ session, user }) {
  session.user.id = user.id;
  session.user.nickname = user.nickname ?? null;
  return session;
}
```

- `session.user.id`: 모든 API에서 사용자 식별에 필수
- `session.user.nickname`: UI에서 바로 표시 가능 (추가 DB 조회 불필요)
- NextAuth 타입 확장 (`src/types/next-auth.d.ts`)으로 TypeScript 지원

### 3. 경로 보호 전략 — API 개별 검증 방식

미들웨어의 `authorized` 콜백에서 모든 경로를 허용하고,
인증이 필요한 API Route에서 `requireAuth()` 헬퍼로 개별 검증한다.

**이유:**
- ADR-201에서 결정한 대로 Edge Runtime에서 Prisma 사용 불가
- 게스트 모드를 지원하므로 페이지 자체를 차단할 필요 없음
- API별로 인증 요구사항이 다름 (예: 랭킹 조회는 공개, 기록 저장은 인증 필요)

### 4. Auth 헬퍼 함수

```typescript
// 인증 필수 API에서 사용
const session = await requireAuth();
if (!session) return 401;

// DB에서 상세 사용자 정보 필요 시
const user = await getCurrentUser();
```

## Consequences

**긍정적**
- NextAuth 타입 확장으로 `session.user.nickname` 등 타입 안전하게 접근
- `requireAuth()` 패턴으로 API Route 인증 로직 일관성 확보
- 게스트 모드와 인증 모드를 유연하게 병행 가능
- 미들웨어가 세션 쿠키 갱신을 처리하여 세션 수명 자동 관리

**부정적**
- API마다 `requireAuth()` 호출을 잊지 않도록 주의 필요
- 미들웨어가 모든 경로에서 실행되므로 약간의 오버헤드 (세션 쿠키 체크)
