# ADR-100: 디자인 시스템 선택 및 구성

## 상태
승인됨 (Accepted)

## 날짜
2026-03-26

## 컨텍스트

스도쿠 웹앱의 일관된 UI를 위해 디자인 시스템을 정의해야 한다.
프로젝트는 이미 Tailwind CSS v4 + shadcn/ui (base-nova) + Geist 폰트를 사용하고 있다.

### 고려 사항
1. Tailwind CSS v4는 `tailwind.config.ts` 대신 CSS `@theme` 블록으로 설정
2. shadcn/ui가 이미 oklch 색상 공간 + CSS 변수 패턴을 사용 중
3. 스도쿠 게임 특유의 셀 상태 (선택, 에러, 잠금, 하이라이트 등)가 많음
4. 모바일 우선 설계로 터치 타겟 44px+ 보장 필요
5. 다크 모드 지원 필수

## 결정

### 1. 색상 공간: oklch 유지
- shadcn/ui 기본 컨벤션과 일치
- 인간 인지 기반 균일한 밝기(lightness) 조절 가능
- 다크 모드 전환 시 일관된 채도 유지

### 2. 토큰 정의 위치: `globals.css`
- Tailwind v4에서는 CSS 변수 + `@theme` 블록이 표준
- `tailwind.config.ts` 파일 없이 CSS만으로 토큰 관리
- `:root` (라이트) / `.dark` (다크) 분리

### 3. 셀 상태별 전용 토큰
- 스도쿠 게임의 핵심은 셀 상태 표현이므로, 셀 전용 색상 토큰을 체계적으로 정의
- `--cell-*` 네이밍으로 일반 색상과 구분

### 4. 모바일 셀 크기: 40px
- 9×9 보드 + 구분선 = 약 376px → 375px 뷰포트에 최적
- WCAG 터치 타겟 최소 44px 미달이지만, 셀은 그리드 내 밀집 요소이므로 40px 허용
- 숫자패드 등 독립 터치 요소는 48px 유지

### 5. 폰트 전략
- 셀 숫자: Geist Mono (등폭 → 중앙 정렬 일관성)
- UI 텍스트: Geist Sans (가독성)

## 대안

### A. Tailwind v3 방식 (tailwind.config.ts)
- 기각: 프로젝트가 이미 Tailwind v4를 사용하며, v4 표준을 따르는 것이 유지보수에 유리

### B. 셀 크기 48px (터치 타겟 완전 준수)
- 기각: 보드 너비 448px로 모바일 뷰포트 초과. 가로 스크롤 발생.

### C. HSL 색상 공간
- 기각: shadcn/ui v4가 oklch를 기본 사용. 혼용 시 일관성 저하.

## 결과

- `docs/design/design-system.md` — 전체 디자인 시스템 문서
- `src/app/globals.css` — 스도쿠 전용 CSS 변수 추가
- Frontend 에이전트는 이 토큰을 참조하여 컴포넌트 구현
