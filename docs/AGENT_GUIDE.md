# 🚀 Claude Code 에이전트 팀 운영 가이드

## 시작하기 전에

### 파일 배치

프로젝트 루트에 아래 파일들을 복사합니다:

```
sudoku/
├── CLAUDE.md                          # 프로젝트 공통 규칙
├── .claude/
│   └── agents/
│       ├── infra.md                   # 🏗 Infra 에이전트
│       ├── backend.md                 # 🔧 Backend 에이전트
│       ├── frontend.md                # 🎨 Frontend 에이전트
│       └── engine.md                  # 🎮 Engine 에이전트
└── docs/
    └── AGENT_GUIDE.md                 # 이 문서
```

### 사전 준비

1. Claude Code CLI 설치 확인: `claude --version`
2. GitHub repo clone: `git clone https://github.com/leejicircle/sudoku.git`
3. `dev` 브랜치 생성 (없다면): `git checkout -b dev`

---

## 에이전트 실행 방법

### 기본 실행

```bash
# 특정 에이전트로 실행
claude --agent infra
claude --agent backend
claude --agent frontend
claude --agent engine
```

### 작업 지시 예시

```bash
# Infra 에이전트에게 초기 세팅 시작
claude --agent infra
> "Epic #1의 feat/infra-nextjs-init 작업을 시작해줘"

# Engine 에이전트에게 타입 정의 시작
claude --agent engine
> "Epic #3의 feat/engine-types 작업을 시작해줘"
```

### 세션 내에서 에이전트 호출

이미 claude 세션 안에 있다면 `@`로 에이전트를 호출할 수도 있습니다:

```
@infra CI 파이프라인 설정해줘
```

---

## Phase별 실행 순서

### Phase 1: 초기 세팅 + 디자인

```
🏗 Infra: feat/infra-nextjs-init → shadcn-setup → state-setup → (pwa, ci, docs 병렬)
🖌 사람: 디자인 작업 (Figma 등)
```

**시작 조건**: 없음 (첫 단계)

### Phase 2: 엔진 + 인증 (병렬)

```
🎮 Engine: feat/engine-types → generator → solver → difficulty → (validator, hint 병렬) → gamestore
🔧 Backend: feat/api-user-schema → api-auth-config → api-guest-mode
```

**시작 조건**: Phase 1 (#1 초기 세팅) 완료

### Phase 3: 게임 UI

```
🎨 Frontend: feat/ui-board → ui-numpad → ui-timer → ui-controls → ui-difficulty → ui-game-complete
```

**시작 조건**: 디자인 산출물 + Engine 타입 정의 + gameStore 완료

### Phase 4: 랭킹

```
🔧 Backend: feat/api-ranking-schema → api-ranking-endpoints
🎨 Frontend: feat/ui-ranking-hooks → ui-leaderboard (Backend 완료 후)
```

**시작 조건**: Phase 2 (#4 인증) 완료

### Phase 5: 배포 & QA

```
🏗 Infra: vercel-deploy → pwa-final → offline-sync → performance → lighthouse → mobile-test → meta-privacy → readme
```

**시작 조건**: 모든 기능 완료

---

## 작업 흐름

### 1. 브랜치 생성

```bash
git checkout develop
git pull origin develop
git checkout -b feat/engine-types
```

### 2. 에이전트 실행 및 작업

```bash
claude --agent engine
> "feat/engine-types 브랜치에서 타입 정의 작업을 해줘"
```

### 3. 커밋 & PR

```bash
git add .
git commit -m "feat(engine): 스도쿠 엔진 타입 정의"
git push origin feat/engine-types
# GitHub에서 PR 생성 (develop ← feat/engine-types)
```

### 4. 다음 작업으로 이동

PR merge 후 다음 브랜치로 이동하여 반복합니다.

---

## 에이전트 간 협업 포인트

### Engine → Frontend 핸드오프

- Engine이 `src/types/game.ts`에 타입을 정의하면, Frontend가 이를 import하여 사용
- Engine이 `src/stores/gameStore.ts`를 구현하면, Frontend가 UI에서 연결

### Backend → Frontend 핸드오프

- Backend가 API 엔드포인트를 완성하면, Frontend가 React Query 훅으로 연결
- Backend의 auth-config merge 후 Frontend가 로그인 UI 작업 시작

### 공유 타입 규칙

- `src/types/` 하위 파일은 어떤 에이전트든 추가 가능
- 기존 타입을 **변경**할 때는 해당 타입을 사용하는 에이전트의 작업 확인 필요

---

## 트러블슈팅

### 에이전트가 담당 범위를 벗어나는 경우

각 에이전트 프로필에 "담당 파일 범위"가 명시되어 있습니다. 에이전트가 범위 밖 파일을 수정하려 하면 해당 에이전트에게 작업을 요청하세요.

### 의존성 충돌

두 에이전트가 같은 파일을 수정해야 할 경우:

1. 먼저 작업하는 에이전트가 완료 후 merge
2. 나중 에이전트가 develop을 pull 받아 최신 상태에서 작업

### Phase 간 대기

다음 Phase 시작 전, 이전 Phase의 모든 PR이 develop에 merge되었는지 확인합니다.

---

## 유용한 명령어

```bash
# 현재 브랜치 상태 확인
git log --oneline develop..HEAD

# 특정 에이전트의 테스트 실행
pnpm test -- --filter engine
pnpm test -- --filter api

# 전체 린트 + 타입 체크
pnpm lint && pnpm type-check
```
