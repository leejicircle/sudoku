# ADR-400: Edge 미들웨어 삭제 — 인증은 라우트별 requireAuth()로

## Status

Accepted

## Context

Vercel 프로덕션 배포가 빌드 단계에서 실패했다.

```
Edge Function "_middleware" size is 1.02 MB (limit 1 MB)
```

`src/middleware.ts`는 `export { auth as middleware } from "@/lib/auth"` 한 줄이었지만,
`@/lib/auth` → `authConfig` → `PrismaAdapter(prisma)` 경로로 Prisma Client 전체가
Edge 번들에 딸려 들어가 1MB 상한을 넘겼다.

미들웨어가 실제로 하던 일은 없었다. 접근 제어를 담당하는 `authorized()` 콜백이
게스트 플레이 허용 정책에 따라 **항상 `true`를 반환**하는 no-op이었고
(`src/lib/auth/config.ts`), 인증이 필요한 API는 이미 각 Route가 자체 검증한다.

- `POST /api/game/clear`
- `POST /api/game/sync`
- `GET /api/ranking/me`

세 라우트 모두 `requireAuth()`(`src/lib/auth/helpers.ts`)로 세션을 확인하고
없으면 401을 반환한다. 세션 쿠키 갱신도 `/api/auth/*` 핸들러와 서버측 `auth()`가
처리하므로 미들웨어에 의존하지 않는다.

> 참고: 미들웨어는 이번이 두 번째 삭제다. 초기에도 "Prisma는 Edge Runtime 미지원"을
> 이유로 제거했다가(ADR-201) 다시 도입되어 같은 문제가 재발했다.

## Decision

**`src/middleware.ts`를 삭제한다.** Edge 함수 자체를 없애 크기 문제를 원천 제거한다.
기능 손실은 없다 — 지우기 전에도 접근 제어를 하지 않았다.

인증 규약은 **"보호가 필요한 API Route는 자기 핸들러에서 `requireAuth()`를 호출한다"** 로 고정한다.

## Consequences

**긍정적**

- Edge 함수 부재 → 번들 크기 제약에서 자유롭고, 콜드스타트 1홉 감소
- 인증 검사가 실제 데이터에 접근하는 코드 바로 옆에 있어 추적이 쉬움

**부정적 / 주의**

- **인증이 규약에 의존한다.** 신규 보호 라우트에서 `requireAuth()` 호출을 빠뜨리면
  그대로 인증 구멍이 된다. 미들웨어처럼 경로 패턴으로 일괄 차단해주는 안전망이 없다.
- **리다이렉트형 보호 페이지는 불가.** 현재는 모든 페이지가 공개이고 비인증 사용자에게
  UI로 안내할 뿐이다. "비로그인이면 `/login`으로 리다이렉트"가 필요해지면 미들웨어를
  다시 도입해야 한다.

### 미들웨어 재도입 시 (필수 조건)

같은 실패를 세 번째로 반복하지 않으려면, **어댑터를 제외한 edge-safe config를 분리**하는
Auth.js 권장 패턴을 따라야 한다.

```
auth.config.ts   # providers + callbacks만 (adapter 없음) → 미들웨어가 import
auth.ts          # auth.config + PrismaAdapter + session:database → 서버 전용
```

미들웨어가 `PrismaAdapter`를 참조하는 순간 Prisma가 Edge 번들로 재유입된다.
또한 현재 `session.strategy`가 `"database"`이므로, 미들웨어에서 세션을 읽으려면
JWT 전략 전환 여부까지 함께 검토해야 한다.

## References

- ADR-201: Auth.js v5 설정 (1차 미들웨어 제거 경위)
- ADR-202: 모든 페이지 공개 · API만 개별 검증 전략
- PR #61 — `feat/infra-vercel-deploy`
- `src/lib/auth/config.ts`, `src/lib/auth/helpers.ts`
