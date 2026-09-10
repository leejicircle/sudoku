# 🎯 Sudoku Web App

스테이지 기반 스도쿠 퍼즐을 풀고 랭킹을 겨루는 Next.js PWA.

🔗 **Live**: https://sudoku-flax-gamma.vercel.app

## 주요 기능

- **스테이지 모드** — 스테이지별 퍼즐 진행 및 진행 상황 저장
- **힌트 시스템** — 스테이지당 최대 3회 힌트 (사용 횟수가 별점에 반영)
- **랭킹** — 스테이지별 클리어 시간 기준 랭킹, 내 기록 조회
- **게스트 모드** — 로그인 없이 플레이 (기록은 로컬 저장)
- **OAuth 로그인** — Google · Naver 소셜 로그인 (Auth.js v5)
- **라이트 / 다크 테마** — 시스템 설정을 따르되 수동 전환 가능 (선택은 로컬에 유지)
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
- Docker (로컬 개발 DB)
- Supabase 프로젝트 (배포용 PostgreSQL)

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
| `DATABASE_URL`                         | Prisma Client 런타임용 — 로컬은 docker Postgres, 배포는 Supabase Transaction 풀러 URI (port 6543) |
| `DIRECT_URL`                           | Prisma Migrate용 — 로컬은 docker Postgres, 배포는 Supabase Session URI (port 5432) |
| `AUTH_SECRET`                          | Auth.js 세션 암호화 키 (`npx auth secret`로 생성)                    |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`| Google Cloud Console OAuth 2.0 클라이언트 자격 증명                   |
| `AUTH_NAVER_ID` / `AUTH_NAVER_SECRET`  | Naver Developers 애플리케이션 자격 증명                              |
| `NEXT_PUBLIC_APP_URL`                  | 앱 URL (로컬 `http://localhost:3000`, 프로덕션은 실제 도메인)        |

> 값은 절대 커밋하지 않는다 (`.env`는 gitignore 대상).

### DB 준비

```bash
docker compose up -d db   # 로컬 Postgres 17 기동
pnpm db:migrate           # 마이그레이션 생성 + 로컬 DB에 적용
```

#### 개발 DB 정책

**개발은 로컬 docker Postgres에서만 한다. Supabase 클라우드 인스턴스는 배포·프리뷰 전용이다.**
`pnpm db:migrate`(= `prisma migrate dev`)는 실행할 때마다 같은 인스턴스에 shadow DB를 만들었다 지우는데, 이것이 template DB 통째 복사 후 드롭이라 Supabase Free tier의 디스크 I/O 버짓을 한 번에 크게 소모한다. 여기에 에이전트 워크트리마다 `pnpm dev` · `db:studio` · `vitest`가 붙으면 실제 사용자 트래픽이 거의 없어도 쓰로틀링에 걸린다(실제로 발생했다 — [ADR-400](docs/adr/400-local-dev-database.md)). 따라서 `db:migrate` · `db:push` · `db:studio` · 테스트는 **로컬 DB에만** 실행하고, 클라우드 스키마 반영은 shadow DB를 만들지 않는 `pnpm db:deploy`(= `prisma migrate deploy`)로만 한다. 클라우드 접속 문자열은 로컬 `.env`가 아니라 Vercel 환경변수에 둔다.

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
| `pnpm db:push`    | Prisma 스키마 DB 반영 (로컬 전용) |
| `pnpm db:migrate` | Prisma 마이그레이션 생성·적용 (로컬 전용) |
| `pnpm db:deploy`  | 마이그레이션 적용 (클라우드용, shadow DB 없음) |
| `pnpm db:studio`  | Prisma Studio (DB GUI, 로컬 전용) |

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
