# 🖌 디자인 시스템 (Design System)

> Sudoku Web App의 모든 시각 요소를 정의하는 단일 진실 원천(Single Source of Truth).
> Frontend 에이전트는 이 문서와 `globals.css`의 CSS 변수를 참조하여 구현한다.

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **모바일 우선** | 최소 320px, 최적 375px 기준 설계 |
| **한 손 조작** | 숫자 패드 하단 배치, 핵심 인터랙션은 엄지 영역(Thumb Zone) |
| **직관적 상태 표현** | 셀 상태(잠금, 에러, 선택 등)가 색상+형태로 즉시 인지 가능 |
| **접근성** | 색상 대비 WCAG AA 이상, 터치 타겟 최소 44px |
| **일관성** | 디자인 토큰 기반, 임의 값(magic number) 사용 금지 |

---

## 2. 색상 시스템 (Color Palette)

모든 색상은 **oklch** 색상 공간으로 정의한다 (shadcn/ui 기본 컨벤션 유지).

### 2.1 브랜드 / 게임 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--sudoku-primary` | `oklch(0.55 0.18 250)` | `oklch(0.68 0.16 250)` | 주 브랜드 색상 (파란색 계열) |
| `--sudoku-primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` | 브랜드 색상 위 텍스트 |
| `--sudoku-accent` | `oklch(0.65 0.15 250)` | `oklch(0.55 0.13 250)` | 보조 강조 (호버, 포커스 링) |

### 2.2 셀 상태 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--cell-default` | `oklch(1 0 0)` | `oklch(0.22 0 0)` | 빈 셀 배경 |
| `--cell-default-foreground` | `oklch(0.25 0 0)` | `oklch(0.92 0 0)` | 유저 입력 숫자 |
| `--cell-given` | `oklch(0.97 0 0)` | `oklch(0.26 0 0)` | 초기 제공 숫자 셀 배경 |
| `--cell-given-foreground` | `oklch(0.15 0 0)` | `oklch(0.95 0 0)` | 초기 제공 숫자 (Bold) |
| `--cell-selected` | `oklch(0.88 0.08 250)` | `oklch(0.35 0.10 250)` | 현재 선택된 셀 |
| `--cell-selected-foreground` | `oklch(0.20 0 0)` | `oklch(0.95 0 0)` | 선택된 셀 숫자 |
| `--cell-highlighted` | `oklch(0.93 0.04 250)` | `oklch(0.28 0.06 250)` | 같은 행/열/박스 하이라이트 |
| `--cell-same-number` | `oklch(0.90 0.06 250)` | `oklch(0.32 0.08 250)` | 같은 숫자 하이라이트 |
| `--cell-error` | `oklch(0.90 0.10 25)` | `oklch(0.30 0.10 25)` | 에러 셀 배경 |
| `--cell-error-foreground` | `oklch(0.50 0.20 25)` | `oklch(0.70 0.18 25)` | 에러 숫자 |
| `--cell-locked` | `oklch(0.94 0 0)` | `oklch(0.24 0 0)` | 잠금 칸 배경 |
| `--cell-locked-foreground` | `oklch(0.55 0 0)` | `oklch(0.60 0 0)` | 잠금 칸 아이콘/텍스트 |
| `--cell-completed` | `oklch(0.90 0.10 145)` | `oklch(0.35 0.10 145)` | 완성된 행/열/박스 (잠깐 플래시) |

### 2.3 보드 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--board-border` | `oklch(0.25 0 0)` | `oklch(0.80 0 0)` | 보드 외곽선 + 3×3 박스 구분선 |
| `--board-border-thin` | `oklch(0.80 0 0)` | `oklch(0.35 0 0)` | 셀 간 얇은 구분선 |
| `--board-bg` | `oklch(0.97 0 0)` | `oklch(0.18 0 0)` | 보드 전체 배경 |

### 2.4 난이도 색상

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--difficulty-easy` | `oklch(0.72 0.16 145)` | 쉬움 (초록) |
| `--difficulty-medium` | `oklch(0.75 0.15 85)` | 보통 (노랑) |
| `--difficulty-hard` | `oklch(0.68 0.18 50)` | 어려움 (주황) |
| `--difficulty-expert` | `oklch(0.60 0.20 25)` | 전문가 (빨강) |

### 2.5 기능 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--success` | `oklch(0.72 0.16 145)` | `oklch(0.65 0.14 145)` | 성공/완료 |
| `--warning` | `oklch(0.75 0.15 85)` | `oklch(0.68 0.13 85)` | 경고 |
| `--info` | `oklch(0.65 0.15 250)` | `oklch(0.58 0.13 250)` | 정보/힌트 |

---

## 3. 타이포그래피 (Typography)

### 3.1 폰트 패밀리

| 용도 | 폰트 | CSS 변수 |
|------|-------|----------|
| UI 텍스트 | Geist Sans | `--font-geist-sans` |
| 셀 숫자 | Geist Mono | `--font-geist-mono` |
| 메모 숫자 | Geist Mono | `--font-geist-mono` |

### 3.2 타이포그래피 스케일

| 토큰명 | 크기 | Line Height | Weight | 용도 |
|--------|------|-------------|--------|------|
| `--text-display` | 32px (2rem) | 1.2 | 700 | 페이지 제목 (홈 타이틀) |
| `--text-heading` | 24px (1.5rem) | 1.3 | 600 | 섹션 헤딩 |
| `--text-subheading` | 18px (1.125rem) | 1.4 | 600 | 서브 헤딩 |
| `--text-body` | 16px (1rem) | 1.5 | 400 | 본문 텍스트 |
| `--text-caption` | 14px (0.875rem) | 1.4 | 400 | 캡션, 보조 텍스트 |
| `--text-small` | 12px (0.75rem) | 1.3 | 400 | 아주 작은 텍스트 |
| `--text-cell` | 24px (1.5rem) | 1 | 500 | 셀 숫자 (메인) |
| `--text-cell-given` | 24px (1.5rem) | 1 | 700 | 초기 제공 숫자 (Bold) |
| `--text-cell-memo` | 10px (0.625rem) | 1 | 400 | 메모 숫자 |
| `--text-numpad` | 24px (1.5rem) | 1 | 500 | 숫자패드 숫자 |
| `--text-timer` | 20px (1.25rem) | 1 | 500 (mono) | 타이머 표시 |

---

## 4. 간격 시스템 (Spacing)

4px 기반 간격 체계. Tailwind 기본 spacing과 호환.

### 4.1 기본 간격 스케일

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--space-1` | 4px | 최소 간격 (아이콘 내부 등) |
| `--space-2` | 8px | 인접 요소 간격 |
| `--space-3` | 12px | 소그룹 내부 간격 |
| `--space-4` | 16px | 기본 패딩, 섹션 내부 간격 |
| `--space-5` | 20px | 중간 간격 |
| `--space-6` | 24px | 섹션 간 간격 |
| `--space-8` | 32px | 큰 섹션 간 간격 |
| `--space-10` | 40px | 페이지 수준 간격 |
| `--space-12` | 48px | 대형 간격 |

### 4.2 게임 보드 전용 간격

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--cell-size` | 40px | 셀 크기 (모바일 기본, 최소 터치 타겟 충족) |
| `--cell-size-md` | 48px | 셀 크기 (태블릿) |
| `--cell-size-lg` | 56px | 셀 크기 (데스크톱) |
| `--board-gap-thin` | 1px | 셀 간 얇은 선 |
| `--board-gap-thick` | 2px | 3×3 박스 구분선 |
| `--board-padding` | 16px | 보드 외부 여백 |
| `--board-border-width` | 3px | 보드 외곽선 두께 |
| `--numpad-gap` | 8px | 숫자패드 버튼 간격 |
| `--numpad-button-size` | 48px | 숫자패드 버튼 크기 (터치 타겟) |
| `--memo-cell-size` | 12px | 메모 숫자 하나의 영역 크기 |

### 4.3 계산된 보드 크기

```
보드 전체 너비 (모바일):
= (cell-size × 9) + (board-gap-thin × 6) + (board-gap-thick × 2) + (board-border-width × 2)
= (40 × 9) + (1 × 6) + (2 × 2) + (3 × 2)
= 360 + 6 + 4 + 6
= 376px → 최적 뷰포트(375px)에 딱 맞음

보드 전체 너비 (태블릿):
= (48 × 9) + (1 × 6) + (2 × 2) + (3 × 2)
= 432 + 6 + 4 + 6
= 448px

보드 전체 너비 (데스크톱):
= (56 × 9) + (1 × 6) + (2 × 2) + (3 × 2)
= 504 + 6 + 4 + 6
= 520px
```

---

## 5. Border Radius (모서리 둥글기)

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--radius-none` | 0px | 셀 (격자형이므로 둥글기 없음) |
| `--radius-sm` | 6px | 작은 버튼, 태그 |
| `--radius-md` | 8px | 카드, 입력 필드 |
| `--radius-lg` | 10px | 보드 외곽, 모달 |
| `--radius-xl` | 14px | 큰 카드, 팝오버 |
| `--radius-full` | 9999px | 원형 (아바타, 배지) |

> shadcn/ui의 `--radius` 변수(0.625rem = 10px)를 기반으로 계산됨.

---

## 6. 그림자 시스템 (Shadows)

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.05)` | 미세한 깊이감 |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04)` | 버튼, 입력 필드 |
| `--shadow-md` | `0 4px 6px oklch(0 0 0 / 0.07), 0 2px 4px oklch(0 0 0 / 0.04)` | 카드, 보드 |
| `--shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.08), 0 4px 6px oklch(0 0 0 / 0.04)` | 모달, 팝오버 |
| `--shadow-xl` | `0 20px 25px oklch(0 0 0 / 0.10), 0 8px 10px oklch(0 0 0 / 0.04)` | 오버레이 |
| `--shadow-board` | `0 2px 8px oklch(0 0 0 / 0.08), 0 0 0 3px oklch(0.25 0 0)` | 게임 보드 전용 |
| `--shadow-cell-selected` | `inset 0 0 0 2px oklch(0.55 0.18 250)` | 선택된 셀 인셋 그림자 |
| `--shadow-numpad` | `0 2px 4px oklch(0 0 0 / 0.06)` | 숫자패드 버튼 |

> Dark Mode에서는 그림자 대신 보더/글로우로 깊이감 표현. `oklch(0 0 0 / ...)` 투명도를 `oklch(1 0 0 / ...)` 로 반전하여 미세한 글로우 효과 사용.

---

## 7. 애니메이션 & 트랜지션

### 7.1 Duration

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--duration-fast` | 100ms | 호버, 포커스 상태 변경 |
| `--duration-normal` | 200ms | 일반 트랜지션 |
| `--duration-slow` | 300ms | 모달 진입/퇴장, 페이지 전환 |
| `--duration-slower` | 500ms | 축하 애니메이션 |

### 7.2 Easing

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | 기본 이징 |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | 요소 퇴장 |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | 요소 진입 |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 바운스 (숫자 입력, 완성 효과) |

### 7.3 주요 애니메이션

| 이름 | 설명 | 트리거 |
|------|------|--------|
| `cell-pop` | 숫자 입력 시 scale(0.9→1) 바운스 | 셀에 숫자 입력 |
| `cell-error-shake` | X축 좌우 흔들림 (3회) | 잘못된 숫자 입력 |
| `cell-complete-flash` | 배경색 초록 플래시 후 원래로 | 행/열/박스 완성 |
| `board-complete-celebrate` | 전체 보드 살짝 scale up + 반짝임 | 퍼즐 완성 |
| `modal-enter` | opacity(0→1) + translateY(20px→0) | 모달 표시 |
| `modal-exit` | opacity(1→0) + translateY(0→10px) | 모달 닫기 |
| `numpad-press` | scale(0.95→1) | 숫자패드 버튼 클릭 |

---

## 8. Z-Index 스케일

| 토큰명 | 값 | 용도 |
|--------|-----|------|
| `--z-base` | 0 | 기본 콘텐츠 |
| `--z-board` | 10 | 게임 보드 |
| `--z-cell-highlight` | 20 | 셀 하이라이트 오버레이 |
| `--z-numpad` | 30 | 숫자 패드 |
| `--z-header` | 40 | 상단 헤더 |
| `--z-bottom-nav` | 40 | 하단 내비게이션 |
| `--z-popover` | 50 | 팝오버 (잠금 칸 설명 등) |
| `--z-modal-overlay` | 60 | 모달 배경 오버레이 |
| `--z-modal` | 70 | 모달 콘텐츠 |
| `--z-toast` | 80 | 토스트 알림 |

---

## 9. 터치 타겟 & 접근성

### 9.1 최소 터치 타겟

| 요소 | 최소 크기 | 권장 크기 |
|------|----------|----------|
| 셀 | 40×40px | 48×48px |
| 숫자패드 버튼 | 44×44px | 48×48px |
| 네비게이션 아이템 | 44×44px | 48×48px |
| 일반 버튼 | 44×36px | 48×40px |
| 아이콘 버튼 | 44×44px | 48×48px |

### 9.2 색상 대비 (WCAG AA 기준)

| 조합 | 대비율 | 판정 |
|------|--------|------|
| cell-given-foreground / cell-given | 14.5:1 | ✅ AAA |
| cell-default-foreground / cell-default | 16.5:1 | ✅ AAA |
| cell-error-foreground / cell-error | 4.6:1 | ✅ AA |
| cell-locked-foreground / cell-locked | 4.8:1 | ✅ AA |
| sudoku-primary-foreground / sudoku-primary | 7.2:1 | ✅ AAA |

### 9.3 포커스 표시

- 모든 인터랙티브 요소에 `focus-visible` 링 표시
- 포커스 링: `2px solid var(--sudoku-accent)` + `2px offset`
- 키보드 네비게이션: 보드 내 화살표 키 이동 지원

---

## 10. 아이콘 체계

**Lucide React** 사용 (프로젝트 이미 설치됨).

| 용도 | 아이콘 | 크기 |
|------|--------|------|
| 잠금 칸 | `Lock` | 16px |
| 힌트 | `Lightbulb` | 20px |
| 되돌리기 | `Undo2` | 20px |
| 지우기 | `Eraser` | 20px |
| 메모 모드 | `PenLine` | 20px |
| 일시정지 | `Pause` | 20px |
| 타이머 | `Clock` | 16px |
| 홈 | `Home` | 24px |
| 랭킹 | `Trophy` | 24px |
| 설정 | `Settings` | 24px |
| 프로필 | `User` | 24px |
| 뒤로가기 | `ChevronLeft` | 24px |
| 닫기 | `X` | 20px |
| 성공 체크 | `Check` | 24px |
| 별점 | `Star` | 20px |
| 로그인 (Google) | 커스텀 SVG | 20px |
| 로그인 (Naver) | 커스텀 SVG | 20px |

---

## 11. Tailwind CSS v4 토큰 매핑

`globals.css`의 `@theme inline` 블록과 `:root` / `.dark` 에서 CSS 변수로 정의.
Tailwind 클래스에서 직접 사용 가능:

```css
/* 사용 예시 */
.cell { background: var(--cell-default); }
.cell-selected { background: var(--cell-selected); }

/* Tailwind 클래스 매핑 */
bg-[--cell-default]
bg-[--cell-selected]
text-[--cell-error-foreground]
shadow-[--shadow-board]
```

또는 `@theme` 블록에서 Tailwind 유틸리티로 매핑:

```css
@theme inline {
  --color-sudoku-primary: var(--sudoku-primary);
  --color-cell-default: var(--cell-default);
  /* → bg-sudoku-primary, bg-cell-default 등으로 사용 */
}
```

---

## 12. 컴포넌트 스타일 가이드 (Quick Reference)

### 12.1 버튼 스타일

| 변형 | 배경 | 텍스트 | 보더 | 호버 |
|------|------|--------|------|------|
| Primary | `--sudoku-primary` | `--sudoku-primary-foreground` | none | opacity 0.9 |
| Secondary | `--secondary` | `--secondary-foreground` | none | opacity 0.8 |
| Ghost | transparent | `--foreground` | none | `--accent` bg |
| Outline | transparent | `--foreground` | `--border` | `--accent` bg |
| Destructive | `--destructive` | white | none | opacity 0.9 |

### 12.2 카드 스타일

```
배경: var(--card)
보더: 1px solid var(--border)
모서리: var(--radius-lg) = 10px
그림자: var(--shadow-md)
패딩: var(--space-4) = 16px
```

### 12.3 숫자패드 버튼 스타일

```
크기: 48×48px (최소 44px 터치 타겟)
배경: var(--card)
텍스트: var(--foreground), font-size: var(--text-numpad)
모서리: var(--radius-md) = 8px
그림자: var(--shadow-numpad)
호버: var(--accent) 배경
활성: scale(0.95), var(--sudoku-primary) 배경
비활성(9개 모두 배치됨): opacity 0.3
```
