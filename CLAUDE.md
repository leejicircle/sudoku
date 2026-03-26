# 🎯 Sudoku Web App — Claude Code 프로젝트 규칙

## 프로젝트 개요

Next.js 15 기반 스도쿠 웹앱 (PWA). 개인 프로젝트이며 Claude Code 에이전트 팀으로 개발한다.

## 기술 스택

- **Framework**: Next.js 15 (App Router) + TypeScript 5.x
- **Styling**: Tailwind CSS 3.x + shadcn/ui
- **State**: Zustand 5.x + TanStack React Query 5.x
- **DB/ORM**: Prisma 6.x + Supabase PostgreSQL
- **Auth**: Auth.js v5 (Google + Naver OAuth)
- **Package**: pnpm

## 에이전트 역할 (5개)

| 에이전트     | 아이콘 | 담당 Epic | 담당 영역                           |
| ------------ | ------ | --------- | ----------------------------------- |
| **Infra**    | 🏗     | #1, #7    | 프로젝트 세팅, CI/CD, 배포, PWA     |
| **Design**   | 🖌     | #2        | 디자인 시스템, 와이어프레임, 컴포넌트 명세 |
| **Backend**  | 🔧     | #4, #6    | Prisma 스키마, API Routes, Auth     |
| **Frontend** | 🎨     | #5        | 게임 UI, 상태관리, 컴포넌트         |
| **Engine**   | 🎮     | #3        | 스도쿠 생성/검증/힌트 알고리즘      |

> #4, #6은 Backend가 API를, Frontend가 UI를 나눠 작업한다.

## Phase 순서 (의존성)

```
Phase 1: #1 초기 세팅 + #2 디자인 (병렬)
Phase 2: #3 엔진 + #4 인증 (병렬, #1 완료 후)
Phase 3: #5 게임 UI (#2 디자인 + #3 엔진 타입 완료 후)
Phase 4: #6 랭킹 (#4 인증 완료 후)
Phase 5: #7 배포 & QA (모두 완료 후)
```

## Git 규칙

### 브랜치 전략

- `main` — 프로덕션 (직접 커밋 금지)
- `dev` — 통합 브랜치
- `feat/*` — 기능 브랜치 (이슈의 브랜치명 그대로 사용)

### 커밋 컨벤션

```
<type>(<scope>): <subject>

feat(engine): 스도쿠 퍼즐 생성 알고리즘 구현
fix(api): 세션 만료 시 401 응답 처리
chore(infra): ESLint 설정 추가
docs(adr): ADR-001 상태관리 라이브러리 선택
```

### PR 규칙

- PR 제목: `[에이전트] feat/브랜치명 — 작업 요약`
- PR 본문: 구현 목록 + 관련 이슈 번호 + 테스트 결과
- self-merge 가능 (개인 프로젝트)

## 코드 규칙

### 디렉토리 구조

```
src/
├── app/                  # Next.js App Router pages
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   └── game/             # 게임 전용 컴포넌트
├── lib/
│   ├── engine/           # 🎮 스도쿠 엔진 (순수 로직)
│   ├── api/              # 🔧 API 유틸리티
│   ├── auth/             # 🔧 Auth 설정
│   └── utils/            # 공통 유틸
├── stores/               # Zustand 스토어
├── hooks/                # 커스텀 훅
├── types/                # 타입 정의
└── prisma/               # Prisma 스키마 + 마이그레이션
```

### 작성 원칙

- TypeScript strict mode 필수
- 컴포넌트는 함수형 + 화살표 함수
- 서버 컴포넌트 우선, 클라이언트 컴포넌트는 `'use client'` 명시
- API Route는 `src/app/api/` 하위에 배치
- 에이전트는 자기 담당 영역 외 파일을 수정하지 않는다
- 공유 타입(`src/types/`)은 어떤 에이전트든 추가 가능하되, 기존 타입 변경 시 관련 에이전트와 협의

### 테스트

- 엔진 로직: 단위 테스트 필수 (vitest)
- API Route: 통합 테스트 권장
- UI 컴포넌트: 스토리북 or 스냅샷 선택

## 문서화

- `docs/adr/` — Architecture Decision Record
  - 1xx: Frontend 결정
  - 2xx: Backend 결정
  - 3xx: Engine 결정
  - 4xx: Infra 결정
