# ADR-101: 클라이언트 인증 상태 관리 훅 설계

## 상태
승인됨 (Accepted)

## 날짜
2026-03-31

## 컨텍스트

Auth.js v5 설정(ADR-202)과 로그인 UI(PR #35)가 완성된 상태에서,
클라이언트 컴포넌트들이 인증 상태를 일관되게 소비할 수 있는 인터페이스가 필요하다.

### 고려 사항
1. `next-auth/react`의 `useSession`은 범용적이라 반환 타입이 느슨함
2. 여러 컴포넌트(AuthButton, 헤더, 향후 랭킹 페이지 등)에서 인증 상태를 반복 소비함
3. 로그인/로그아웃 액션이 컴포넌트마다 개별 구현되어 있음
4. 보호 페이지(랭킹 기록 등)에서 미인증 리다이렉트 패턴이 반복될 예정
5. 세션에 커스텀 필드(`nickname`)가 이미 추가되어 있어 타입 보장이 필요

### 선택지
- **A) useSession 직접 사용** — 래핑 없이 각 컴포넌트에서 직접 호출
- **B) useAuth 커스텀 훅** — useSession을 래핑하여 타입 안전한 인터페이스 제공
- **C) Zustand 인증 스토어** — 별도 전역 스토어로 인증 상태 관리

## 결정

**선택지 B — `useAuth` + `useAuthGuard` 커스텀 훅**

### 이유
1. useSession의 느슨한 타입을 `AuthUser` 인터페이스로 좁혀서 타입 안전성 확보
2. `login()` / `logout()` 액션을 훅에 캡슐화하여 중복 제거
3. `useAuthGuard`로 보호 페이지 리다이렉트 패턴을 재사용 가능하게 추출
4. SessionProvider가 이미 인증 상태를 관리하므로 Zustand 스토어는 불필요한 중복
5. React Query는 서버 데이터(랭킹 등)에만 사용하고, 세션은 Auth.js 전용 캐시 활용

## 구현 상세

### 파일 구조
```
src/hooks/
├── useAuth.ts         # 인증 상태 + 액션 훅
├── useAuthGuard.ts    # 보호 페이지 가드 훅
└── index.ts           # 배럴 export
```

### useAuth 반환값
```ts
{
  user: AuthUser | null;    // { id, name, email, image, nickname }
  status: AuthStatus;       // "authenticated" | "loading" | "unauthenticated"
  isAuthenticated: boolean;
  isLoading: boolean;
  login(callbackUrl?): void;
  logout(callbackUrl?): Promise<void>;
}
```

### useAuthGuard 반환값
```ts
{
  isReady: boolean;          // 로딩 완료 + 인증됨
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

## 영향

- `AuthButton` — `useSession` → `useAuth`로 교체, 로그아웃 드롭다운 메뉴 추가
- `LoginPage` — 이미 인증된 상태면 홈으로 리다이렉트 로직 추가
- 향후 보호 페이지 — `useAuthGuard` 적용으로 보일러플레이트 최소화
