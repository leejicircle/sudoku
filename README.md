# 🎯 Sudoku Web App

스테이지 기반 스도쿠 퍼즐을 풀고 랭킹을 겨루는 Next.js PWA.

🔗 **Live**: https://sudoku-flax-gamma.vercel.app

## 주요 기능

- **스테이지 모드** — 스테이지별 퍼즐 진행 및 진행 상황 저장
- **힌트 시스템** — 스테이지당 최대 3회 힌트 (사용 횟수가 별점에 반영)
- **랭킹** — 스테이지별 클리어 시간 기준 랭킹, 내 기록 조회
- **게스트 모드** — 로그인 없이 플레이 (기록은 로컬 저장)
- **OAuth 로그인** — Google · Naver 소셜 로그인 (Auth.js v5)
- **PWA / 오프라인** — 설치형 앱, 오프라인 플레이 후 온라인 복귀 시 기록 자동 동기화

## 기술 스택

| 영역        | 사용 기술                                          |
| ----------- | -------------------------------------------------- |
| Framework   | Next.js 16 (App Router) + React 19 + TypeScript 5  |
| Styling     | Tailwind CSS 4 + shadcn/ui                         |
| State       | Zustand 5 + TanStack React Query 5                 |
| DB / ORM    | Prisma 6 + Supabase (PostgreSQL)                   |
| Auth        | Auth.js v5 (next-auth) — Google · Naver OAuth      |
| Package     | pnpm 10                                            |
| Test        | Vitest                                             |

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- pnpm 10 이상
- Supabase 프로젝트 (PostgreSQL)

### 설치

```bash
pnpm install
```

### 환경변수 설정

`.env.example`를 복사해 `.env`를 만들고 값을 채운다.

```bash
cp .env.example .env
```

| 키                                     | 설명                                                                 |
| -------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                         | Supabase Transaction 풀러 URI (port 6543) — Prisma Client 런타임용   |
| `DIRECT_URL`                           | Supabase Session URI (port 5432) — Prisma Migrate용                  |
| `AUTH_SECRET`                          | Auth.js 세션 암호화 키 (`npx auth secret`로 생성)                    |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`| Google Cloud Console OAuth 2.0 클라이언트 자격 증명                   |
| `AUTH_NAVER_ID` / `AUTH_NAVER_SECRET`  | Naver Developers 애플리케이션 자격 증명                              |
| `NEXT_PUBLIC_APP_URL`                  | 앱 URL (로컬 `http://localhost:3000`, 프로덕션은 실제 도메인)        |

> 값은 절대 커밋하지 않는다 (`.env`는 gitignore 대상).

### DB 준비

```bash
pnpm db:push      # 스키마를 DB에 반영 (개발 초기)
# 또는
pnpm db:migrate   # 마이그레이션 생성 + 적용
```

### 개발 서버 실행

```bash
pnpm dev
```

http://localhost:3000 에서 확인.

## 주요 스크립트

| 스크립트          | 설명                              |
| ----------------- | --------------------------------- |
| `pnpm dev`        | 개발 서버 (Turbopack)             |
| `pnpm build`      | 프로덕션 빌드 (prisma generate 포함) |
| `pnpm start`      | 프로덕션 서버 실행                |
| `pnpm lint`       | ESLint                            |
| `pnpm type-check` | TypeScript 타입 검사              |
| `pnpm test`       | Vitest 단위 테스트                |
| `pnpm db:push`    | Prisma 스키마 DB 반영             |
| `pnpm db:migrate` | Prisma 마이그레이션               |
| `pnpm db:studio`  | Prisma Studio (DB GUI)            |

## 프로젝트 구조

```
src/
├── app/                  # App Router 페이지 · API Routes
│   ├── api/              #   game/clear · game/sync · ranking · auth
│   ├── game/             #   게임 화면
│   ├── ranking/          #   랭킹 화면
│   ├── login/ · privacy/ #   로그인 · 개인정보처리방침
│   └── manifest.ts       #   PWA manifest
├── components/           # UI · 게임 컴포넌트
├── lib/
│   ├── engine/ · sudoku/ # 스도쿠 생성 · 검증 · 힌트 로직
│   ├── api/ · auth/      # API 유틸 · Auth 설정
│   └── utils/
├── stores/               # Zustand 스토어 (game · guest-record · offline-clear)
├── hooks/ · types/
└── prisma/               # Prisma 스키마
public/                   # 정적 자산 · PWA 아이콘 · sw.js
docs/adr/                 # Architecture Decision Records
```

## 배포

Vercel에 배포된다.

- **Production** = `main` 브랜치 (자동 배포)
- 환경변수는 Vercel 대시보드 > Settings > Environment Variables에서 설정
- 빌드 시 `prisma generate`가 자동 실행됨

## 문서

주요 설계 결정은 [`docs/adr/`](docs/adr)에 ADR로 기록되어 있다 (Frontend 1xx · Backend 2xx · Engine 3xx · Infra 4xx).
