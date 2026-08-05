# 🖌 디자인 시스템 (Design System)

> Sudoku Web App의 모든 시각 요소를 정의하는 단일 진실 원천(Single Source of Truth).
> Frontend 에이전트는 이 문서와 `globals.css`의 CSS 변수를 참조하여 구현한다.

> **v2 — 페이퍼 / 퍼즐북 톤 (2026-08)**
> 기존 v1은 메시 그라데이션 배경 + 무지개 난이도 색으로 "AI 생성물" 인상이 강했다.
> v2는 **따뜻한 오프화이트 종이 + 잉크**로 전면 재정립한다. 그라데이션은 전면 배제.
> **토큰 이름은 전부 그대로 두고 값만 교체**한다 → 컴포넌트 수정 최소화.
> 마이그레이션 대조표는 §13, 장식 요소 처리는 §14 참조.

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **모바일 우선** | 최소 320px, 최적 375px 기준 설계 |
| **한 손 조작** | 숫자 패드 하단 배치, 핵심 인터랙션은 엄지 영역(Thumb Zone) |
| **직관적 상태 표현** | 셀 상태(잠금, 에러, 선택 등)가 색상+형태로 즉시 인지 가능 |
| **접근성** | 색상 대비 WCAG AA 이상, 터치 타겟 최소 44px |
| **일관성** | 디자인 토큰 기반, 임의 값(magic number) 사용 금지 |
| **인쇄물 감성 (v2)** | 종이 · 잉크 · 괘선. 그라데이션 · 글로우 · 블러 금지 |

### 1.1 페이퍼 톤 3원칙 (v2)

1. **면이 아니라 선으로 나눈다** — 카드/섹션 구분은 배경색 대신 1px 괘선(`--border`).
2. **색은 기능일 때만 쓴다** — 장식용 색 금지. 색이 붙는 곳은 셀 상태·에러·펜 잉크뿐.
3. **깊이 대신 인쇄** — `blur` / `glow` / 큰 `box-shadow` 금지. 그림자는 1~2px 오프셋까지.

**금지 목록** (v2에서 코드베이스에 남아 있으면 안 되는 것):
`linear-gradient` / `radial-gradient` 로 채운 면, `background-clip: text`,
`backdrop-blur-*`, `blur-2xl` 등 데코 블러, 색상환을 넓게 쓰는 다색 팔레트.

---

## 2. 색상 시스템 (Color Palette)

모든 색상은 **oklch** 색상 공간으로 정의한다 (shadcn/ui 기본 컨벤션 유지).

### 2.0 팔레트 개요

페이퍼 톤은 **두 축**만 쓴다.

| 축 | 색상환 | 역할 |
|----|--------|------|
| **종이 / 잉크** (주축) | hue 65~85, chroma 0.004~0.016 | 배경·표면·텍스트·괘선 전부. 사실상 무채색이지만 미세한 온기를 가진다 |
| **펜 잉크 블루** (보조축) | hue 250, chroma 0.045~0.10 | 유저가 "써넣은" 값, 선택, 같은 숫자 — 인터랙션 신호 전용 |
| **첨삭 레드** (예외축) | hue 28~30 | 오류 **한 곳에만**. 다른 어떤 용도로도 쓰지 않는다 |

> 왜 파랑인가: 인쇄된 문제(검정 잉크)와 **내가 볼펜으로 써넣은 답**(파랑)이 실제 문제집에서 구분되는 방식 그대로다. 기존 브랜드 hue(250)를 유지하므로 값 교체만으로 끝난다.

### 2.1 shadcn/ui 기본 토큰

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--background` | `oklch(0.968 0.008 85)` | `oklch(0.185 0.008 70)` | 페이지 = 종이 / 갱지 |
| `--foreground` | `oklch(0.24 0.012 65)` | `oklch(0.92 0.012 85)` | 본문 잉크 |
| `--card` | `oklch(0.985 0.006 85)` | `oklch(0.235 0.008 70)` | 카드 = 종이 위 한 장 더 |
| `--card-foreground` | `oklch(0.24 0.012 65)` | `oklch(0.92 0.012 85)` | 카드 텍스트 |
| `--popover` | `oklch(0.985 0.006 85)` | `oklch(0.235 0.008 70)` | 팝오버 배경 |
| `--popover-foreground` | `oklch(0.24 0.012 65)` | `oklch(0.92 0.012 85)` | 팝오버 텍스트 |
| `--primary` | `oklch(0.24 0.012 65)` | `oklch(0.92 0.012 85)` | 잉크 (=foreground) |
| `--primary-foreground` | `oklch(0.98 0.005 85)` | `oklch(0.18 0.010 70)` | 잉크 위 종이색 |
| `--secondary` | `oklch(0.935 0.007 85)` | `oklch(0.285 0.008 70)` | 보조 면 |
| `--secondary-foreground` | `oklch(0.24 0.012 65)` | `oklch(0.92 0.012 85)` | 보조 면 텍스트 |
| `--muted` | `oklch(0.935 0.007 85)` | `oklch(0.285 0.008 70)` | 음영 면 |
| `--muted-foreground` | `oklch(0.50 0.010 65)` | `oklch(0.70 0.010 80)` | 보조 텍스트 (연필 톤) |
| `--accent` | `oklch(0.925 0.008 85)` | `oklch(0.30 0.008 70)` | 호버 면 |
| `--accent-foreground` | `oklch(0.24 0.012 65)` | `oklch(0.92 0.012 85)` | 호버 텍스트 |
| `--destructive` | `oklch(0.47 0.17 28)` | `oklch(0.68 0.15 28)` | 파괴적 액션 |
| `--border` | `oklch(0.86 0.010 85)` | `oklch(0.34 0.008 70)` | 괘선 (장식적 구분선) |
| `--input` | `oklch(0.64 0.008 80)` | `oklch(0.54 0.008 70)` | **입력 필드 테두리 — 3:1 확보용으로 border보다 진하다** |
| `--ring` | `oklch(0.42 0.09 250)` | `oklch(0.72 0.095 250)` | 포커스 링 (펜 잉크) |
| `--radius` | `0.375rem` (6px) | 동일 | **10px → 6px. 인쇄물은 덜 둥글다** |

> `--border`(1.4:1)는 **장식적 구분선 전용**이다. 테두리가 요소의 유일한 경계 표시일 때(입력 필드, outline 버튼)는 반드시 `--input`(3.07:1)을 쓴다. §9.2 참조.

**차트/사이드바 토큰** (현재 미사용, 톤 일관성 유지용):

```css
/* :root */
--chart-1: oklch(0.86 0.008 80); --chart-2: oklch(0.66 0.008 80);
--chart-3: oklch(0.52 0.010 70); --chart-4: oklch(0.40 0.012 70);
--chart-5: oklch(0.28 0.014 65);
--sidebar: oklch(0.985 0.006 85); --sidebar-foreground: oklch(0.24 0.012 65);
--sidebar-primary: oklch(0.24 0.012 65); --sidebar-primary-foreground: oklch(0.98 0.005 85);
--sidebar-accent: oklch(0.925 0.008 85); --sidebar-accent-foreground: oklch(0.24 0.012 65);
--sidebar-border: oklch(0.86 0.010 85); --sidebar-ring: oklch(0.42 0.09 250);

/* .dark */
--chart-1: oklch(0.30 0.008 70); --chart-2: oklch(0.46 0.008 70);
--chart-3: oklch(0.60 0.010 75); --chart-4: oklch(0.74 0.010 80);
--chart-5: oklch(0.88 0.012 85);
--sidebar: oklch(0.235 0.008 70); --sidebar-foreground: oklch(0.92 0.012 85);
--sidebar-primary: oklch(0.92 0.012 85); --sidebar-primary-foreground: oklch(0.18 0.010 70);
--sidebar-accent: oklch(0.30 0.008 70); --sidebar-accent-foreground: oklch(0.92 0.012 85);
--sidebar-border: oklch(0.34 0.008 70); --sidebar-ring: oklch(0.72 0.095 250);
```

### 2.2 브랜드 / 게임 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--sudoku-primary` | `oklch(0.42 0.09 250)` | `oklch(0.72 0.095 250)` | 펜 잉크 블루 — CTA, 활성 상태, 포커스 |
| `--sudoku-primary-foreground` | `oklch(0.98 0.005 85)` | `oklch(0.18 0.010 70)` | 펜 잉크 위 텍스트 |
| `--sudoku-accent` | `oklch(0.52 0.08 250)` | `oklch(0.62 0.085 250)` | 보조 강조 (호버) |

### 2.3 셀 상태 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--cell-default` | `oklch(0.99 0.004 85)` | `oklch(0.235 0.008 70)` | 셀 배경 (보드 = 가장 흰 종이) |
| `--cell-default-foreground` | `oklch(0.45 0.10 250)` | `oklch(0.78 0.09 250)` | **유저 입력 = 볼펜 파랑** |
| `--cell-given` | `oklch(0.99 0.004 85)` | `oklch(0.235 0.008 70)` | **default와 동일 — 인쇄된 문제는 배경이 같다** |
| `--cell-given-foreground` | `oklch(0.22 0.012 65)` | `oklch(0.94 0.008 85)` | **초기 제공 = 인쇄 잉크 (Bold)** |
| `--cell-selected` | `oklch(0.86 0.055 250)` | `oklch(0.375 0.075 250)` | 선택 셀 |
| `--cell-selected-foreground` | `oklch(0.22 0.012 65)` | `oklch(0.95 0.008 85)` | 선택 셀 숫자 |
| `--cell-highlighted` | `oklch(0.955 0.005 85)` | `oklch(0.295 0.005 70)` | 같은 행/열/박스 — **무채색 음영** |
| `--cell-same-number` | `oklch(0.905 0.045 250)` | `oklch(0.335 0.06 250)` | 같은 숫자 — **파란 음영 + Bold** |
| `--cell-error` | `oklch(0.895 0.055 30)` | `oklch(0.325 0.08 28)` | 오류 셀 배경 |
| `--cell-error-foreground` | `oklch(0.47 0.17 28)` | `oklch(0.76 0.14 28)` | 오류 숫자 (첨삭 빨간펜) |
| `--cell-locked` | `oklch(0.925 0.005 85)` | `oklch(0.205 0.005 70)` | 잠금 칸 (+ 빗금 패턴 필수) |
| `--cell-locked-foreground` | `oklch(0.50 0.008 65)` | `oklch(0.62 0.008 70)` | 잠금 아이콘 |
| `--cell-completed` | `oklch(0.93 0.045 80)` | `oklch(0.34 0.05 80)` | 완성 플래시 (초록 → **황토 스탬프 톤**) |

> **`--cell-given`을 `--cell-default`와 같게 두는 것은 의도된 설계다.** 실제 문제집에서 인쇄된 숫자와 빈 칸은 배경이 같고, 잉크의 종류로만 구분된다. 구분은 색+굵기가 담당한다 → given = 검정 잉크 Bold(16.85:1) / filled = 파란 볼펜 Medium(7.21:1). 두 톤은 명도·색상이 모두 달라 색각이상에서도 굵기로 분리된다.

### 2.4 난이도 색상 — 무채색 명도 사다리

**v2에서 난이도는 색으로 구분하지 않는다.** 무지개(초록/노랑/주황/빨강)를 폐기하고,
**진해질수록 어렵다**는 단일 잉크 사다리로 바꾼다. 실제 구분 신호는 §14.3의 **pip 게이지(■■□□)** 가 담당하고, 이 토큰은 텍스트/눈금 색으로만 쓰인다.

| 토큰명 | Light Mode | Dark Mode | 의미 |
|--------|------------|-----------|------|
| `--difficulty-easy` | `oklch(0.53 0.010 65)` | `oklch(0.62 0.010 85)` | 옅은 잉크 |
| `--difficulty-medium` | `oklch(0.44 0.012 65)` | `oklch(0.72 0.010 85)` | ↓ |
| `--difficulty-hard` | `oklch(0.36 0.014 65)` | `oklch(0.82 0.010 85)` | ↓ |
| `--difficulty-expert` | `oklch(0.25 0.016 65)` | `oklch(0.94 0.010 85)` | 가장 진한 잉크 |

> 라이트는 진해지고 다크는 밝아진다 — 두 모드 모두 "잉크가 세진다"로 읽힌다.
> 네 값 모두 배경 대비 4.8:1 이상(§9.2)이라 `text-difficulty-*` 를 소형 텍스트에 그대로 써도 AA를 만족한다.

### 2.5 기능 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--success` | `oklch(0.48 0.09 150)` | `oklch(0.70 0.10 150)` | 성공/완료 (채도 낮춘 잉크 그린) |
| `--warning` | `oklch(0.53 0.09 75)` | `oklch(0.76 0.095 75)` | 경고 · 별점 채움 (황토/금박 스탬프) |
| `--info` | `oklch(0.45 0.09 250)` | `oklch(0.72 0.09 250)` | 정보/힌트 (펜 잉크와 동일 계열) |

### 2.6 보드 색상

| 토큰명 | Light Mode | Dark Mode | 용도 |
|--------|------------|-----------|------|
| `--board-border` | `oklch(0.26 0.012 65)` | `oklch(0.78 0.010 85)` | 외곽선 + 3×3 굵은 괘선 |
| `--board-border-thin` | `oklch(0.64 0.008 80)` | `oklch(0.54 0.008 70)` | 셀 간 얇은 괘선 (**3:1 확보를 위해 v1보다 진함**) |
| `--board-bg` | `oklch(0.968 0.008 85)` | `oklch(0.185 0.008 70)` | 보드 배경 = 종이 |

---

## 3. 타이포그래피 (Typography)

### 3.1 폰트 패밀리

| 용도 | 폰트 | CSS 변수 | 비고 |
|------|-------|----------|------|
| UI 텍스트 (한글 포함) | Geist Sans | `--font-geist-sans` | 변경 없음 |
| 셀 숫자 · 메모 · 타이머 | Geist Mono | `--font-geist-mono` | 변경 없음 |
| **워드마크 · 라틴 디스플레이** | **Instrument Serif 400** | `--font-serif` | **v2 신규, 아래 조건부** |

#### 세리프 추가 규칙 (선택적, 권장)

- **무엇**: `Instrument_Serif`, weight 400 단일, `subsets: ["latin"]`, `display: "swap"`.
- **왜**: 페이퍼 톤의 인상은 배경색보다 **활자**가 만든다. 산세리프 워드마크는 그대로 두면 여전히 "앱"으로 읽힌다. 단일 웨이트 라틴 서브셋만 로드하므로 추가 payload는 **1 파일 ≈ 25KB woff2** 수준이다.
- **어디에만**: **라틴 문자열에만.** 구체적으로 딱 두 곳.
  - `BrandWordmark` (`SUDOKU`)
  - `AppLogo` (`SUDOKU`)
- **어디에 쓰면 안 되는가**: **한글에 절대 쓰지 않는다.** Instrument Serif는 한글 글리프가 없어 fallback이 발생하고 줄 높이가 깨진다. 본문·버튼·난이도 라벨·헤딩은 전부 Geist Sans 유지.
- **성능 가드**: Lighthouse Performance가 99 → 97 미만으로 떨어지면 세리프를 되돌리고 워드마크는 Geist Sans + `tracking-[0.18em]` + `font-normal`로 처리한다. 톤의 90%는 색·괘선·그라데이션 제거에서 이미 나오므로 세리프는 **없어도 스펙을 만족**한다.

```ts
// src/app/layout.tsx — 추가분만
import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
// <html className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ...`}>
```

```css
/* globals.css — @theme inline 에 1줄 추가 */
--font-serif: var(--font-serif);
```

### 3.2 타이포그래피 스케일

v1에서 변경 없음.

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

v1에서 변경 없음. (4px 기반, Tailwind 기본 spacing과 호환)

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
= (40 × 9) + (1 × 6) + (2 × 2) + (3 × 2) = 376px → 최적 뷰포트(375px)에 딱 맞음

태블릿(48px): 448px   데스크톱(56px): 520px
```

---

## 5. Border Radius (모서리 둥글기)

**v2에서 기준값이 10px → 6px 로 축소된다.** 인쇄물은 모서리가 덜 둥글다.
`--radius` 한 줄만 바꾸면 `--radius-sm/md/lg/xl/...` 파생값이 전부 따라온다.

| 토큰명 | v1 | **v2** | 용도 |
|--------|-----|--------|------|
| `--radius` (기준) | 0.625rem (10px) | **0.375rem (6px)** | shadcn 파생 기준 |
| `--radius-sm` (×0.6) | 6px | **3.6px** | 작은 버튼, 태그 |
| `--radius-md` (×0.8) | 8px | **4.8px** | 숫자패드 버튼, 입력 필드 |
| `--radius-lg` (×1.0) | 10px | **6px** | 보드 외곽, 카드, 모달 |
| `--radius-xl` (×1.4) | 14px | **8.4px** | 난이도 카드, 팝오버 |
| `--radius-2xl` (×1.8) | 18px | **10.8px** | — |
| — | — | `0` | 셀 (격자형이므로 둥글기 없음) |
| `--radius-full` | 9999px | 9999px | 원형 (아바타). **pill 뱃지에는 쓰지 않는다 → §14.2** |

---

## 6. 그림자 시스템 (Shadows)

**페이퍼 톤에서 그림자는 "떠 있음"이 아니라 "인쇄 자국"이다.** 흐림 반경을 크게 줄이고 오프셋을 1~2px로 고정한다. 글로우·컬러 그림자는 전부 폐기.

| 토큰명 | Light | Dark | 용도 |
|--------|-------|------|------|
| `--shadow-xs` | `0 1px 0 oklch(0.24 0.012 65 / 0.05)` | `0 1px 0 oklch(0 0 0 / 0.3)` | 미세한 깊이감 |
| `--shadow-sm` | `0 1px 2px oklch(0.24 0.012 65 / 0.07)` | `0 1px 2px oklch(0 0 0 / 0.35)` | 버튼, 입력 필드 |
| `--shadow-md` | `0 1px 3px oklch(0.24 0.012 65 / 0.09)` | `0 1px 3px oklch(0 0 0 / 0.4)` | 카드 |
| `--shadow-lg` | `0 2px 6px oklch(0.24 0.012 65 / 0.10)` | `0 2px 6px oklch(0 0 0 / 0.45)` | 팝오버 |
| `--shadow-xl` | `0 8px 24px oklch(0.24 0.012 65 / 0.12), 0 2px 6px oklch(0.24 0.012 65 / 0.06)` | `0 8px 24px oklch(0 0 0 / 0.5), 0 2px 6px oklch(0 0 0 / 0.3)` | 모달 오버레이 |
| `--shadow-board` | `0 1px 2px oklch(0.24 0.012 65 / 0.10), 0 0 0 2px oklch(0.26 0.012 65)` | `0 1px 2px oklch(0 0 0 / 0.4), 0 0 0 2px oklch(0.78 0.010 85)` | 게임 보드 (잉크 링) |
| `--shadow-cell-selected` | `inset 0 0 0 2px oklch(0.42 0.09 250)` | `inset 0 0 0 2px oklch(0.72 0.095 250)` | 선택 셀 인셋 링 |
| `--shadow-numpad` | `0 1px 0 oklch(0.24 0.012 65 / 0.08)` | `0 1px 0 oklch(0 0 0 / 0.35)` | 숫자패드 버튼 (평평하게) |

> `--shadow-cell-selected`는 **장식이 아니라 접근성 장치**다. 선택 셀 배경 대비 5.54:1(라이트)로, 셀 배경색 차이가 미약해도 선택 위치가 항상 읽힌다. 절대 제거 금지. (§9.2, §12)

---

## 7. 애니메이션 & 트랜지션

v1에서 변경 없음. 단, **§14의 장식 애니메이션 2종은 폐기**한다 (`animate-text-shimmer`, `animate-float-slow`).

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

### 7.3 주요 애니메이션 (유지)

| 이름 | 설명 | 트리거 |
|------|------|--------|
| `cell-pop` | 숫자 입력 시 scale(0.9→1) 바운스 | 셀에 숫자 입력 |
| `cell-error-shake` | X축 좌우 흔들림 | 잘못된 숫자 입력 |
| `cell-complete-flash` | 배경 황토 플래시 후 원래로 | 행/열/박스 완성 |
| `board-complete-celebrate` | 전체 보드 살짝 scale up | 퍼즐 완성 (※ `filter: brightness` 스텝 제거 — §14.6) |
| `modal-enter` / `modal-exit` | opacity + translateY | 모달 표시/닫기 |
| `numpad-press` | scale(0.92→1) | 숫자패드 버튼 클릭 |
| `bounce-in` / `star-scale-in` / `slide-down-fade` | 클리어 모달 연출 | 퍼즐 완성 |

---

## 8. Z-Index 스케일

v1에서 변경 없음.

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

v1에서 변경 없음.

| 요소 | 최소 크기 | 권장 크기 |
|------|----------|----------|
| 셀 | 40×40px | 48×48px |
| 숫자패드 버튼 | 44×44px | 48×48px |
| 네비게이션 아이템 | 44×44px | 48×48px |
| 일반 버튼 | 44×36px | 48×40px |
| 아이콘 버튼 | 44×44px | 48×48px |

### 9.2 색상 대비 검증표 (WCAG 2.1)

> 전 조합을 oklch → sRGB 변환 후 WCAG 상대휘도 공식으로 **계산한 실측값**이다.
> 기준: 본문 텍스트 **4.5:1**, 큰 텍스트(≥24px 또는 ≥18.66px Bold)·UI 컴포넌트/그래픽 **3:1**.

#### 라이트 모드 — 텍스트

| 전경 / 배경 | 대비 | 기준 | 판정 |
|------|--------|------|------|
| `--foreground` / `--background` | **15.02:1** | 4.5 | ✅ AAA |
| `--foreground` / `--card` | **15.78:1** | 4.5 | ✅ AAA |
| `--muted-foreground` / `--background` | **5.48:1** | 4.5 | ✅ AA |
| `--muted-foreground` / `--card` | **5.76:1** | 4.5 | ✅ AA |
| `--sudoku-primary` / `--background` | **7.69:1** | 4.5 | ✅ AAA |
| `--sudoku-primary-foreground` / `--sudoku-primary` | **7.97:1** | 4.5 | ✅ AAA |
| `--primary-foreground` / `--destructive` | **7.03:1** | 4.5 | ✅ AAA |
| `--success` / `--background` | **5.71:1** | 4.5 | ✅ AA |
| `--warning` / `--background` | **4.88:1** | 4.5 | ✅ AA |
| `--info` / `--background` | **6.76:1** | 4.5 | ✅ AA |
| `--destructive` / `--background` | **6.79:1** | 4.5 | ✅ AA |

#### 라이트 모드 — 셀 숫자 (본문 기준 4.5:1)

| 전경 / 배경 | 대비 | 판정 |
|------|--------|------|
| `--cell-given-foreground` / `--cell-given` | **16.85:1** | ✅ AAA |
| `--cell-default-foreground` / `--cell-default` | **7.21:1** | ✅ AAA |
| `--cell-default-foreground` / `--cell-highlighted` | **6.51:1** | ✅ AAA |
| `--cell-default-foreground` / `--cell-same-number` | **5.61:1** | ✅ AA |
| `--cell-selected-foreground` / `--cell-selected` | **11.38:1** | ✅ AAA |
| `--cell-given-foreground` / `--cell-selected` | **11.38:1** | ✅ AAA |
| `--cell-error-foreground` / `--cell-error` | **5.34:1** | ✅ AA |
| `--cell-locked-foreground` / `--cell-locked` | **4.82:1** | ✅ AA |
| `--cell-given-foreground` / `--cell-completed` | **14.08:1** | ✅ AAA |
| `--muted-foreground`(메모) / `--cell-default` | **5.84:1** | ✅ AA |
| `--muted-foreground`(메모) / `--cell-highlighted` | **5.27:1** | ✅ AA |

#### 라이트 모드 — 그래픽/UI (3:1)

| 조합 | 대비 | 판정 |
|------|--------|------|
| `--board-border` / `--cell-default` (굵은 괘선) | **15.12:1** | ✅ |
| `--board-border-thin` / `--cell-default` (얇은 괘선) | **3.02:1** | ✅ (v1 2.24:1 → 개선) |
| `--input` / `--background` (입력 테두리) | **3.07:1** | ✅ (v1 1.39:1 → 개선) |
| `--ring` / `--background` (포커스 링) | **7.69:1** | ✅ |
| `--shadow-cell-selected` 링 / `--cell-selected` | **5.54:1** | ✅ |
| `--border` / `--background` (장식 구분선) | 1.39:1 | ⚠️ 장식 전용 — 유일한 경계일 땐 `--input` 사용 |

#### 라이트 모드 — 난이도 사다리 (`text-difficulty-*` 소형 텍스트)

| 조합 | 대비 | 판정 |
|------|--------|------|
| `--difficulty-easy` / `--background` | **4.82:1** | ✅ AA |
| `--difficulty-medium` / `--background` | **7.10:1** | ✅ AAA |
| `--difficulty-hard` / `--background` | **9.93:1** | ✅ AAA |
| `--difficulty-expert` / `--background` | **14.62:1** | ✅ AAA |

#### 다크 모드

| 전경 / 배경 | 대비 | 판정 |
|------|--------|------|
| `--foreground` / `--background` | **14.72:1** | ✅ AAA |
| `--foreground` / `--card` | **13.17:1** | ✅ AAA |
| `--muted-foreground` / `--background` | **6.98:1** | ✅ AA |
| `--muted-foreground` / `--card` | **6.24:1** | ✅ AA |
| `--sudoku-primary` / `--background` | **7.56:1** | ✅ AAA |
| `--sudoku-primary-foreground` / `--sudoku-primary` | **7.63:1** | ✅ AAA |
| `--cell-given-foreground` / `--cell-given` | **13.99:1** | ✅ AAA |
| `--cell-default-foreground` / `--cell-default` | **8.38:1** | ✅ AAA |
| `--cell-default-foreground` / `--cell-highlighted` | **6.98:1** | ✅ AAA |
| `--cell-default-foreground` / `--cell-same-number` | **6.01:1** | ✅ AA |
| `--cell-selected-foreground` / `--cell-selected` | **8.81:1** | ✅ AAA |
| `--cell-error-foreground` / `--cell-error` | **5.67:1** | ✅ AA |
| `--cell-locked-foreground` / `--cell-locked` | **4.92:1** | ✅ AA |
| `--cell-given-foreground` / `--cell-completed` | **9.91:1** | ✅ AAA |
| `--muted-foreground`(메모) / `--cell-default` | **6.24:1** | ✅ AA |
| `--board-border` / `--cell-default` | **8.34:1** | ✅ |
| `--board-border-thin` / `--cell-default` | **3.29:1** | ✅ (v1 1.81:1 → 개선) |
| `--input` / `--background` | **3.68:1** | ✅ |
| `--difficulty-easy` / `--background` | **5.12:1** | ✅ AA |
| `--difficulty-medium` / `--background` | **7.52:1** | ✅ AAA |
| `--difficulty-hard` / `--background` | **10.68:1** | ✅ AAA |
| `--difficulty-expert` / `--background` | **15.64:1** | ✅ AAA |
| `--success` / `--background` | **7.28:1** | ✅ AAA |
| `--warning` / `--background` | **8.59:1** | ✅ AAA |
| `--info` / `--background` | **7.56:1** | ✅ AAA |
| `--destructive` / `--background` | **6.06:1** | ✅ AA |
| `--primary-foreground` / `--destructive` | **6.12:1** | ✅ AA |

#### 셀 상태 배경끼리의 대비는 3:1을 만족하지 않는다 — 의도된 것

| 인접 상태 배경쌍 (Light) | 대비 |
|------|--------|
| selected / default | 1.48:1 |
| same-number / default | 1.28:1 |
| highlighted / default | 1.11:1 |
| error / default | 1.36:1 |
| locked / default | 1.21:1 |

WCAG 1.4.11은 **상태를 색만으로 전달할 때** 3:1을 요구한다. 셀 상태 배경은 **보조 신호**이고,
각 상태는 색 외의 수단으로 반드시 중복 표시된다(§12). 배경끼리 3:1을 강제하면 보드가
체스판처럼 보여 퍼즐 가독성이 무너지므로, **색 이외 신호를 의무화**하는 쪽을 택했다.

### 9.3 포커스 표시

- 모든 인터랙티브 요소에 `focus-visible` 링 표시
- 포커스 링: `2px solid var(--ring)` + `2px offset` (대비 7.69:1 / 7.56:1)
- 키보드 네비게이션: 보드 내 화살표 키 이동 지원

---

## 10. 아이콘 체계

**Lucide React** 사용. `strokeWidth`는 **1.75 기본** (v1의 2~2.5 → 인쇄 라인에 맞춰 얇게).

| 용도 | 아이콘 | 크기 | v2 비고 |
|------|--------|------|---------|
| 잠금 칸 | `Lock` | 16px | 유지 |
| 힌트 | `Lightbulb` | 20px | 유지 |
| 되돌리기 | `Undo2` | 20px | 유지 |
| 지우기 | `Eraser` | 20px | 유지 |
| 메모 모드 | `PenLine` | 20px | 유지 |
| 일시정지 | `Pause` | 20px | 유지 |
| 타이머 | `Clock` | 16px | 유지 |
| 홈 / 랭킹 / 설정 / 프로필 | `Home` `Trophy` `Settings` `User` | 24px | 유지 |
| 뒤로가기 / 닫기 / 체크 | `ChevronLeft` `X` `Check` | 20~24px | 유지 |
| 별점 (클리어 등급) | `Star` | 20px | 유지 — **클리어 등급 전용** |
| 로그인 (Google/Naver) | 커스텀 SVG | 20px | 유지 (브랜드 색 예외 허용) |
| ~~장식 스파클~~ | ~~`Sparkles`~~ | — | **폐기 (§14.2)** |
| ~~난이도 상징~~ | ~~`Sprout` `Flame` `Zap` `Crown`~~ | — | **폐기 → pip 게이지 (§14.3)** |

> ★ 아이콘은 **클리어 등급(3개)에만** 쓴다. 난이도 구분에 ★를 쓰면 두 의미가 충돌하므로 난이도는 **사각 pip**을 쓴다. (§14.3)

---

## 11. Tailwind CSS v4 토큰 매핑

`@theme inline` 블록은 **변경 없다.** v2는 `:root` / `.dark` 의 값만 교체하므로
`bg-cell-default`, `text-difficulty-hard` 같은 기존 유틸리티 클래스는 전부 그대로 동작한다.

`@theme inline` 에 추가되는 것은 §3.1의 세리프 1줄뿐이다.

```css
@theme inline {
  /* ...기존 유지... */
  --font-serif: var(--font-serif);   /* v2 신규 (세리프 채택 시) */
}
```

---

## 12. 셀 상태 구분 방식 (페이퍼 톤)

**원칙: 모든 셀 상태는 "색 + 색이 아닌 신호" 두 겹으로 표현한다.**
색 대비가 낮아진 만큼 비색상 신호가 실제 판별을 책임진다.

| 상태 | 색 신호 | **비색상 신호 (필수)** | 구현 위치 |
|------|---------|----------------------|-----------|
| `default` | 종이 배경 | — | 이미 구현됨 |
| `given` | 검정 잉크 | **font-weight 700** | 이미 구현됨 (`Cell.tsx` textClass) |
| `filled` | 파란 볼펜 잉크 | font-weight 500 + given과 색상(hue) 자체가 다름 | 이미 구현됨 |
| `selected` | 파란 음영 (진함) | **inset 2px 잉크 링** (`--shadow-cell-selected`, 5.54:1) + z-index 상승 | 이미 구현됨 |
| `same-number` | 파란 음영 (옅음) | **font-weight 700** | 이미 구현됨 (`isSameNumber && !isSelected && "font-bold"`) |
| `highlighted` | **무채색** 음영 | 색상축이 다름 — same-number(파랑)와 hue로 분리 | 토큰 값 교체만 |
| `error` | 빨간 배경 + 빨간 잉크 | **밑줄** + `cell-error-shake` + `aria-invalid` | **신규 1줄 → 아래** |
| `locked` | 회색 배경 | **대각 빗금 패턴** + `Lock` 아이콘 + `cursor-not-allowed` | **신규 유틸 → 아래** |
| `completed` | 황토 플래시 | 500ms 일시 효과 (정보 아님) | 토큰 값 교체만 |
| `memo` | 회색 소형 숫자 | 3×3 격자 위치 | 이미 구현됨 |

**selected / same-number / highlighted 3종은 서로 다른 3개 축으로 분리된다:**

| | 배경 색상축 | 배경 진하기 | 링 | 숫자 굵기 |
|---|---|---|---|---|
| selected | 파랑 | **진함** (0.86) | **있음 (2px)** | 상속 |
| same-number | 파랑 | 중간 (0.905) | 없음 | **700** |
| highlighted | **무채색** | 옅음 (0.955) | 없음 | 상속 |

### 12.1 필요한 컴포넌트 변경 (2건, 각 1~2줄)

**(1) 오류 셀 밑줄** — `src/components/game/Cell.tsx` textClass:

```ts
if (cell.isError) return "text-cell-error-foreground underline decoration-2 underline-offset-4";
```

**(2) 잠금 칸 빗금** — `globals.css` 유틸 추가 + `Cell.tsx` className에 조건부 1줄:

```css
/* 잠금 칸 대각 빗금 — 색 없이 "막힌 칸"임을 전달 */
.cell-hatch {
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 3px,
    color-mix(in oklch, var(--cell-locked-foreground) 22%, transparent) 3px 4px
  );
}
```

```ts
// Cell.tsx — 기존 cell.isLocked && "opacity-80" 을 아래로 교체
cell.isLocked && "cell-hatch",
```

> `opacity-80`은 제거한다. 페이퍼 톤에서는 투명도로 상태를 표현하지 않는다(빗금이 대신한다).

---

## 13. v1 → v2 토큰 마이그레이션 대조표

> **`@theme inline` 블록과 토큰 이름은 전혀 건드리지 않는다.**
> 아래 값들만 `:root` / `.dark` 에서 교체하면 된다.

### 13.1 Light (`:root`)

| 토큰 | v1 (기존) | **v2 (신규)** |
|------|-----------|---------------|
| `--background` | `oklch(1 0 0)` | `oklch(0.968 0.008 85)` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.24 0.012 65)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.985 0.006 85)` |
| `--card-foreground` | `oklch(0.145 0 0)` | `oklch(0.24 0.012 65)` |
| `--popover` | `oklch(1 0 0)` | `oklch(0.985 0.006 85)` |
| `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.24 0.012 65)` |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.24 0.012 65)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.98 0.005 85)` |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.935 0.007 85)` |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.24 0.012 65)` |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.935 0.007 85)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.50 0.010 65)` |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.925 0.008 85)` |
| `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.24 0.012 65)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.47 0.17 28)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(0.86 0.010 85)` |
| `--input` | `oklch(0.922 0 0)` | `oklch(0.64 0.008 80)` |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.42 0.09 250)` |
| `--radius` | `0.625rem` | `0.375rem` |
| `--sudoku-primary` | `oklch(0.55 0.18 250)` | `oklch(0.42 0.09 250)` |
| `--sudoku-primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0.005 85)` |
| `--sudoku-accent` | `oklch(0.65 0.15 250)` | `oklch(0.52 0.08 250)` |
| `--cell-default` | `oklch(1 0 0)` | `oklch(0.99 0.004 85)` |
| `--cell-default-foreground` | `oklch(0.25 0 0)` | `oklch(0.45 0.10 250)` |
| `--cell-given` | `oklch(0.97 0 0)` | `oklch(0.99 0.004 85)` |
| `--cell-given-foreground` | `oklch(0.15 0 0)` | `oklch(0.22 0.012 65)` |
| `--cell-selected` | `oklch(0.88 0.08 250)` | `oklch(0.86 0.055 250)` |
| `--cell-selected-foreground` | `oklch(0.20 0 0)` | `oklch(0.22 0.012 65)` |
| `--cell-highlighted` | `oklch(0.93 0.04 250)` | `oklch(0.955 0.005 85)` |
| `--cell-same-number` | `oklch(0.90 0.06 250)` | `oklch(0.905 0.045 250)` |
| `--cell-error` | `oklch(0.90 0.10 25)` | `oklch(0.895 0.055 30)` |
| `--cell-error-foreground` | `oklch(0.50 0.20 25)` | `oklch(0.47 0.17 28)` |
| `--cell-locked` | `oklch(0.94 0 0)` | `oklch(0.925 0.005 85)` |
| `--cell-locked-foreground` | `oklch(0.55 0 0)` | `oklch(0.50 0.008 65)` |
| `--cell-completed` | `oklch(0.90 0.10 145)` | `oklch(0.93 0.045 80)` |
| `--board-border` | `oklch(0.25 0 0)` | `oklch(0.26 0.012 65)` |
| `--board-border-thin` | `oklch(0.80 0 0)` | `oklch(0.64 0.008 80)` |
| `--board-bg` | `oklch(0.97 0 0)` | `oklch(0.968 0.008 85)` |
| `--difficulty-easy` | `oklch(0.72 0.16 145)` 초록 | `oklch(0.53 0.010 65)` |
| `--difficulty-medium` | `oklch(0.75 0.15 85)` 노랑 | `oklch(0.44 0.012 65)` |
| `--difficulty-hard` | `oklch(0.68 0.18 50)` 주황 | `oklch(0.36 0.014 65)` |
| `--difficulty-expert` | `oklch(0.60 0.20 25)` 빨강 | `oklch(0.25 0.016 65)` |
| `--success` | `oklch(0.72 0.16 145)` | `oklch(0.48 0.09 150)` |
| `--warning` | `oklch(0.75 0.15 85)` | `oklch(0.53 0.09 75)` |
| `--info` | `oklch(0.65 0.15 250)` | `oklch(0.45 0.09 250)` |
| `--shadow-board` | `0 2px 8px …/0.08, 0 0 0 3px oklch(0.25 0 0)` | `0 1px 2px oklch(0.24 0.012 65 / 0.10), 0 0 0 2px oklch(0.26 0.012 65)` |
| `--shadow-cell-selected` | `inset 0 0 0 2px oklch(0.55 0.18 250)` | `inset 0 0 0 2px oklch(0.42 0.09 250)` |
| `--shadow-numpad` | `0 2px 4px oklch(0 0 0 / 0.06)` | `0 1px 0 oklch(0.24 0.012 65 / 0.08)` |
| `--shadow-xl` | `0 20px 25px …/0.10, 0 8px 10px …/0.04` | `0 8px 24px oklch(0.24 0.012 65 / 0.12), 0 2px 6px oklch(0.24 0.012 65 / 0.06)` |

간격 / 타이포 / duration / easing / z-index 토큰은 **전부 v1 그대로**.

### 13.2 Dark (`.dark`)

| 토큰 | v1 (기존) | **v2 (신규)** |
|------|-----------|---------------|
| `--background` | `oklch(0.145 0 0)` | `oklch(0.185 0.008 70)` |
| `--foreground` | `oklch(0.985 0 0)` | `oklch(0.92 0.012 85)` |
| `--card` | `oklch(0.205 0 0)` | `oklch(0.235 0.008 70)` |
| `--card-foreground` | `oklch(0.985 0 0)` | `oklch(0.92 0.012 85)` |
| `--popover` | `oklch(0.205 0 0)` | `oklch(0.235 0.008 70)` |
| `--popover-foreground` | `oklch(0.985 0 0)` | `oklch(0.92 0.012 85)` |
| `--primary` | `oklch(0.922 0 0)` | `oklch(0.92 0.012 85)` |
| `--primary-foreground` | `oklch(0.205 0 0)` | `oklch(0.18 0.010 70)` |
| `--secondary` | `oklch(0.269 0 0)` | `oklch(0.285 0.008 70)` |
| `--secondary-foreground` | `oklch(0.985 0 0)` | `oklch(0.92 0.012 85)` |
| `--muted` | `oklch(0.269 0 0)` | `oklch(0.285 0.008 70)` |
| `--muted-foreground` | `oklch(0.708 0 0)` | `oklch(0.70 0.010 80)` |
| `--accent` | `oklch(0.269 0 0)` | `oklch(0.30 0.008 70)` |
| `--accent-foreground` | `oklch(0.985 0 0)` | `oklch(0.92 0.012 85)` |
| `--destructive` | `oklch(0.704 0.191 22.216)` | `oklch(0.68 0.15 28)` |
| `--border` | `oklch(1 0 0 / 10%)` | `oklch(0.34 0.008 70)` |
| `--input` | `oklch(1 0 0 / 15%)` | `oklch(0.54 0.008 70)` |
| `--ring` | `oklch(0.556 0 0)` | `oklch(0.72 0.095 250)` |
| `--sudoku-primary` | `oklch(0.68 0.16 250)` | `oklch(0.72 0.095 250)` |
| `--sudoku-primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.18 0.010 70)` |
| `--sudoku-accent` | `oklch(0.55 0.13 250)` | `oklch(0.62 0.085 250)` |
| `--cell-default` | `oklch(0.22 0 0)` | `oklch(0.235 0.008 70)` |
| `--cell-default-foreground` | `oklch(0.92 0 0)` | `oklch(0.78 0.09 250)` |
| `--cell-given` | `oklch(0.26 0 0)` | `oklch(0.235 0.008 70)` |
| `--cell-given-foreground` | `oklch(0.95 0 0)` | `oklch(0.94 0.008 85)` |
| `--cell-selected` | `oklch(0.35 0.10 250)` | `oklch(0.375 0.075 250)` |
| `--cell-selected-foreground` | `oklch(0.95 0 0)` | `oklch(0.95 0.008 85)` |
| `--cell-highlighted` | `oklch(0.28 0.06 250)` | `oklch(0.295 0.005 70)` |
| `--cell-same-number` | `oklch(0.32 0.08 250)` | `oklch(0.335 0.06 250)` |
| `--cell-error` | `oklch(0.30 0.10 25)` | `oklch(0.325 0.08 28)` |
| `--cell-error-foreground` | `oklch(0.70 0.18 25)` | `oklch(0.76 0.14 28)` |
| `--cell-locked` | `oklch(0.24 0 0)` | `oklch(0.205 0.005 70)` |
| `--cell-locked-foreground` | `oklch(0.60 0 0)` | `oklch(0.62 0.008 70)` |
| `--cell-completed` | `oklch(0.35 0.10 145)` | `oklch(0.34 0.05 80)` |
| `--board-border` | `oklch(0.80 0 0)` | `oklch(0.78 0.010 85)` |
| `--board-border-thin` | `oklch(0.35 0 0)` | `oklch(0.54 0.008 70)` |
| `--board-bg` | `oklch(0.18 0 0)` | `oklch(0.185 0.008 70)` |
| `--difficulty-easy` | `oklch(0.68 0.18 145)` | `oklch(0.62 0.010 85)` |
| `--difficulty-medium` | `oklch(0.72 0.17 85)` | `oklch(0.72 0.010 85)` |
| `--difficulty-hard` | `oklch(0.65 0.20 50)` | `oklch(0.82 0.010 85)` |
| `--difficulty-expert` | `oklch(0.58 0.22 25)` | `oklch(0.94 0.010 85)` |
| `--success` | `oklch(0.65 0.14 145)` | `oklch(0.70 0.10 150)` |
| `--warning` | `oklch(0.68 0.13 85)` | `oklch(0.76 0.095 75)` |
| `--info` | `oklch(0.58 0.13 250)` | `oklch(0.72 0.09 250)` |
| `--shadow-board` | `0 2px 8px …/0.3, 0 0 0 3px oklch(0.80 0 0)` | `0 1px 2px oklch(0 0 0 / 0.4), 0 0 0 2px oklch(0.78 0.010 85)` |
| `--shadow-cell-selected` | `inset 0 0 0 2px oklch(0.68 0.16 250)` | `inset 0 0 0 2px oklch(0.72 0.095 250)` |
| `--shadow-numpad` | `0 2px 4px oklch(0 0 0 / 0.2)` | `0 1px 0 oklch(0 0 0 / 0.35)` |
| `--shadow-xl` | `0 20px 25px …/0.30, 0 8px 10px …/0.15` | `0 8px 24px oklch(0 0 0 / 0.5), 0 2px 6px oklch(0 0 0 / 0.3)` |

> **다크 모드의 "페이퍼" 번역**: 흰 종이를 어둡게 반전하는 대신 **갱지 뒷면 / 흑지(black paper)** 로 해석한다.
> hue 70의 따뜻한 흑갈색(`0.185 0.008 70`)이 종이가 되고, 인쇄 잉크는 **흰 잉크**(`0.92 0.012 85`)로 뒤집힌다.
> 볼펜 파랑은 어두운 지면에서 읽히도록 밝기를 올리되(`0.78 0.09 250`) 채도는 라이트와 동일 수준으로 억제해 네온이 되지 않게 한다.
> 난이도 사다리도 방향만 뒤집혀 **밝을수록 어렵다**로 유지된다.

### 13.3 그 외 1줄 변경

| 파일 | 변경 |
|------|------|
| `src/app/layout.tsx` | `viewport.themeColor: "#09090b"` → `"#15120f"` (다크 갱지) |
| `src/app/layout.tsx` | Instrument Serif 추가 (§3.1, 세리프 채택 시) |

---

## 14. 장식 요소 처리 지침

v1의 "AI 느낌"은 토큰보다 **장식 요소**가 만들었다. 아래는 요소별 처리 방안이다.

### 14.1 배경 — 메시 그라데이션 → 모눈종이

**삭제**: `.home-mesh-bg` (globals.css 521-536) 및 `.dark .home-mesh-bg` 전체.
**삭제**: `.sudoku-grid-bg` (540-551) — 아래 `.paper-bg`로 통합.

**신규**: 종이 자체를 표현하는 단일 클래스. 퍼센트 기반이 아닌 **고정 24px 모눈**이라 리사이즈 시 리플로우가 없다.

```css
/* 모눈종이 지면 — 그라데이션 없음, 색 없음 */
.paper-bg {
  background-color: var(--background);
  background-image:
    linear-gradient(to right, oklch(0.45 0.01 70 / 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.45 0.01 70 / 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}

.dark .paper-bg {
  background-image:
    linear-gradient(to right, oklch(0.85 0.01 85 / 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(0.85 0.01 85 / 0.045) 1px, transparent 1px);
}

/* 모바일 성능: 모눈은 페인트 비용이 낮아 768px 미만에서도 유지해도 된다.
   단, 저사양에서 스크롤 저더가 보이면 아래 한 줄로 비활성화. */
@media (max-width: 359px) {
  .paper-bg { background-image: none; }
}
```

**`AppLayout.tsx` 변경** — 배경 레이어 2개 → 1개:

```tsx
{showAmbientBg && (
  <div aria-hidden="true" className="paper-bg pointer-events-none absolute inset-0 -z-10" />
)}
```

> `Header.tsx`의 `bg-background/70 backdrop-blur-xl` → **`bg-background border-b border-border`** 로 교체한다. 종이 위에 반투명 유리가 떠 있으면 페이퍼 톤이 즉시 깨진다. 블러 제거는 모바일 스크롤 성능에도 이득이다.

### 14.2 워드마크 & 뱃지

**삭제**: `.text-gradient-brand` (585-596), `.animate-text-shimmer` + `@keyframes shimmer` (621-641), `.animate-float-slow` + `@keyframes float-slow` (612-619), `@media (forced-colors)` 폴백 블록(645-653 — 대상 클래스가 사라지므로 함께 삭제).

**`BrandWordmark.tsx`** — 시머 그라데이션 + 가운뎃점 구분 폐기:

| 항목 | v1 | **v2** |
|------|-----|--------|
| 문자열 | `S · U · D · O · K · U` | `SUDOKU` |
| 색 | 시머 그라데이션 (파랑→주황→빨강 순환) | **`text-foreground` 단색 잉크** |
| 폰트 | `font-mono font-black` | **`font-[family-name:var(--font-serif)] font-normal`** (세리프 미채택 시 `font-sans font-normal`) |
| 자간 | `tracking-[0.18em]` | `tracking-[0.14em]` |
| 애니메이션 | shimmer 6s 무한 | **없음** |
| 하단 장식 | — | 선택: 워드마크 아래 `border-b border-border` 1px 괘선 (제목 밑줄) |

**`AppLogo.tsx`** — 그라데이션 점 삭제:

```tsx
// 삭제: <span className="size-1.5 rounded-full bg-gradient-to-br from-sudoku-primary via-difficulty-hard to-difficulty-expert ..." />
// 대체: 없음. 워드마크만 남긴다. 장식이 꼭 필요하면 잉크색 정사각 2×2px.
```

**스파클 pill 뱃지** (`HomeContent.tsx` 33-38) — **삭제**.
`Sparkles` 아이콘 + `rounded-full` + `bg-sudoku-primary/10` + `backdrop-blur-sm` 조합은 v2 금지 목록 3개를 동시에 위반한다.

대체안 — 문제집 표지의 **간행 정보 줄**:

```tsx
<p className="mb-4 font-mono text-(length:--text-small) tracking-[0.2em] uppercase text-muted-foreground">
  DAILY PUZZLE · NO.{stageNo}
</p>
```

pill 없음, 아이콘 없음, 배경 없음. 대문자 모노 + 넓은 자간만으로 인쇄물 캡션이 된다.

### 14.3 난이도 카드

**삭제**: `.gradient-easy/medium/hard/expert` (553-582), `.card-glow-easy/medium/hard/expert` (598-610).

**`difficulty-data.ts` 변경** — 3개 필드 교체:

```ts
// 삭제: gradientClass, glowClass, icon (Sprout/Flame/Zap/Crown)
// 추가:
/** 난이도 등급 1~4 — pip 게이지 채움 개수 */
level: 1 | 2 | 3 | 4;
/** 텍스트/눈금 색 클래스 */
toneClass: string;   // "text-difficulty-easy" | ... | "text-difficulty-expert"
```

**`DifficultyCard.tsx` 좌측 사이드바** — 그라데이션 면 → 종이 + 세로 괘선:

| 항목 | v1 | **v2** |
|------|-----|--------|
| 배경 | `gradientClass` (컬러 그라데이션) | **없음 (카드 배경 그대로)** |
| 구분 | 없음 (색면이 구분) | **`border-r border-border`** 세로 괘선 |
| 상단 | `#01` 흰 모노 텍스트 | `01` — `font-mono text-muted-foreground` |
| 중앙 | 컬러 아이콘 (Sprout 등) | **pip 게이지 (아래)** |
| 호버 | `card-glow-*` 컬러 글로우 | **`hover:bg-accent`** 만. translate/scale/shadow 전부 제거 |

**pip 게이지 명세** — 난이도를 색이 아니라 **개수**로 표현한다:

```
쉬움    ■ □ □ □
보통    ■ ■ □ □
어려움  ■ ■ ■ □
전문가  ■ ■ ■ ■
```

| 속성 | 값 |
|------|-----|
| 개별 pip 크기 | 6×6px |
| 간격 | 3px |
| 배치 | 가로 1행 4개 (사이드바 폭 72px에 여유) |
| 채움 pip | `bg-current` + 부모에 `toneClass` |
| 빈 pip | `border border-current opacity-40`, 배경 없음 |
| 모서리 | `rounded-none` — 정사각 (인쇄 눈금) |
| 접근성 | 부모에 `aria-hidden`, 난이도는 카드 `aria-label`의 텍스트가 전달 |

> **왜 ★가 아니라 ■인가**: ★는 이미 **클리어 등급(3개)** 에 쓰이고 있다(`StarRating`, `DifficultyCard` 우측). 난이도에도 ★를 쓰면 같은 카드 안에 의미가 다른 별이 두 벌 생긴다. 정사각 pip은 스도쿠 격자와도 시각적으로 맞는다.

**카드 전체 스타일**:

| 속성 | v1 | **v2** |
|------|-----|--------|
| 배경 | `bg-card/80 backdrop-blur-sm` | **`bg-card`** (블러 제거) |
| 보더 | `border-border/60` | **`border-border`** (실선) |
| 모서리 | `rounded-[var(--radius-xl)]` = 14px | 동일 토큰 → 자동으로 8.4px |
| 호버 | `-translate-y-1` + `shadow-xl` + 컬러 글로우 | **`hover:bg-accent`** 만 |
| 잠금 | `opacity-70` | **`.cell-hatch` 빗금 + `text-muted-foreground`** (투명도 대신 §12 규칙 일관 적용) |
| 호버 화살표 | `ArrowUpRight` in `bg-foreground` 원형 | 유지하되 `rounded-none`, 배경 없이 `text-muted-foreground` |

### 14.4 랭킹 포디움

**`RankingPodium.tsx`** — 컨테이너 장식 2개 **삭제**:
- 상단 그라데이션 액센트 라인 (`bg-gradient-to-r from-transparent via-sudoku-primary/60`)
- 배경 글로우 (`bg-gradient-to-br from-warning/30 ... blur-2xl`)

대체: 컨테이너를 **표(表)** 로 바꾼다.

| 항목 | v1 | **v2** |
|------|-----|--------|
| 컨테이너 | `rounded-2xl bg-card/80 shadow-lg backdrop-blur-md` + 글로우 2겹 | `rounded-[var(--radius-lg)] border border-border bg-card` |
| 상단 | 그라데이션 헤어라인 | **`border-b border-border` + `TOP 3` 모노 캡션** |
| 순위 표시 | 🥇🥈🥉 이모지 | **`#1` `#2` `#3` 모노 숫자** (`font-mono`, `text-muted-foreground`) |
| 아바타 테두리 | 금/은/동 컬러 | **잉크 명도 사다리** (아래) |
| 1위 강조 | 크기(56px) + 금색 | **크기(56px) + `font-bold` + 테두리 2px** — 색 아님 |

**`ranking-utils.ts` 변경**:

```ts
// MEDAL_EMOJI 삭제 — 이모지는 페이퍼 톤과 충돌한다.
// 대신 순위 숫자를 그대로 렌더한다: `#${rank}`

// MEDAL_COLORS → 잉크 명도 사다리로 교체 (다크 모드 대응을 위해 var() 참조)
export const MEDAL_COLORS = {
  1: "var(--foreground)",        // 가장 진한 잉크
  2: "var(--muted-foreground)",
  3: "var(--board-border-thin)",
} as const;
```

> `var()` 참조로 바꾸면 다크 모드에서 자동 반전된다. 기존 리터럴 oklch 값은 라이트 전용이라 다크에서 대비가 무너지고 있었다 — v2에서 함께 해소된다.

**`RankingList.tsx` / `DifficultyTabs.tsx`**:
- 활성 탭 인디케이터: `bg-difficulty-*` → **`bg-foreground`** (2px 잉크 밑줄). 난이도별로 색이 달라질 이유가 없다.
- 내 순위 하이라이트: 배경색 대신 **좌측 3px `border-l-foreground` + `font-semibold`**.
- 행 구분: `border-b border-border` 1px 괘선 (성적표 느낌).

### 14.5 로그인 배너 / 이어하기 배너

**`LoginBanner.tsx`** — `bg-gradient-to-r from-sudoku-primary/15 via-...` + `backdrop-blur-md` **삭제**:

| 속성 | **v2** |
|------|--------|
| 컨테이너 | `rounded-[var(--radius-md)] border border-border bg-card` |
| 좌측 강조 | `border-l-[3px] border-l-sudoku-primary` (한 줄 잉크 표시) |
| 아이콘 박스 | 배경 제거. `LogIn` 아이콘만 `text-muted-foreground` |
| CTA | `rounded-full` → `rounded-[var(--radius-sm)]`, `bg-sudoku-primary` 유지 (7.97:1) |

`ContinueBanner.tsx`도 동일 규칙 적용 (그라데이션/블러 제거, 좌측 잉크 바 + 괘선).

### 14.6 기타 정리

| 대상 | 조치 |
|------|------|
| `Header.tsx` `backdrop-blur-xl` | 제거 → `bg-background border-b border-border` |
| `board-complete-celebrate` 의 `filter: brightness(1.1)` | 제거 (scale만 유지). 종이는 빛나지 않는다 |
| `BottomNav` 활성 표시 | 색 대신 **상단 2px 잉크 바 + `font-semibold`** |
| 모든 `bg-*/80`, `border-*/60` 등 알파 표면 | 불투명 실색으로 교체 |
| `PauseOverlay` blur | **유지** — 기능적 블러(퍼즐 가리기)이므로 예외 |

---

## 15. 컴포넌트 스타일 가이드 (Quick Reference)

### 15.1 버튼 스타일

| 변형 | 배경 | 텍스트 | 보더 | 호버 |
|------|------|--------|------|------|
| Primary | `--sudoku-primary` | `--sudoku-primary-foreground` | none | `--sudoku-accent` 배경 |
| Secondary | `--secondary` | `--secondary-foreground` | none | `--accent` 배경 |
| Ghost | transparent | `--foreground` | none | `--accent` 배경 |
| Outline | transparent | `--foreground` | **1px `--input`** (3:1) | `--accent` 배경 |
| Destructive | `--destructive` | `--primary-foreground` | none | opacity 0.9 |

> v1의 `hover: opacity 0.9`는 페이퍼 톤에서 색이 바래 보인다. **배경 토큰 교체**로 호버를 표현한다.

### 15.2 카드 스타일

```
배경: var(--card)          — 알파 없음, 블러 없음
보더: 1px solid var(--border)
모서리: var(--radius-lg)   = 6px
그림자: var(--shadow-sm)   — md 이상은 모달/팝오버 전용
패딩: var(--space-4)       = 16px
```

### 15.3 숫자패드 버튼 스타일

```
크기: 48×48px (최소 44px 터치 타겟)
배경: var(--card)
보더: 1px solid var(--border)     ← v2 신규. 그림자만으론 종이 위에서 경계가 안 보인다
텍스트: var(--foreground), font-size: var(--text-numpad), font-mono
모서리: var(--radius-md) = 4.8px
그림자: var(--shadow-numpad)      — 1px 오프셋, 흐림 없음
호버: var(--accent) 배경
활성: scale(0.92→1), var(--sudoku-primary) 배경 + var(--sudoku-primary-foreground) 텍스트
비활성(9개 모두 배치됨): opacity 0.35 + var(--muted) 배경
```

---

## 16. 구현 체크리스트 (Frontend 인계용)

```
[x] globals.css :root 값 교체              → §13.1
[x] globals.css .dark 값 교체              → §13.2
[x] globals.css .paper-bg 추가             → §14.1
[x] globals.css .cell-hatch 추가           → §12.1
[x] globals.css 삭제: .home-mesh-bg, .sudoku-grid-bg, .gradient-*,
    .card-glow-*, .text-gradient-brand, .animate-text-shimmer,
    .animate-float-slow, @keyframes shimmer, @keyframes float-slow,
    @media(forced-colors) 폴백           → §14.1, §14.2, §14.3
[x] AppLayout.tsx 배경 레이어 1개로       → §14.1
[x] Header.tsx backdrop-blur 제거          → §14.1
[x] BrandWordmark.tsx 단색 (세리프 미채택 → §16.1)  → §14.2
[x] AppLogo.tsx 그라데이션 점 삭제         → §14.2
[x] HomeContent.tsx 스파클 뱃지 → 간행 캡션 → §14.2
[x] difficulty-data.ts level/toneClass     → §14.3
[x] DifficultyCard.tsx pip 게이지 + 괘선   → §14.3
[x] Cell.tsx 오류 밑줄 + 빗금 (2줄)        → §12.1
[x] NumberPad.tsx 버튼 보더 1px 추가       → §15.3
[x] RankingPodium.tsx 글로우 2겹 삭제      → §14.4
[x] ranking-utils.ts MEDAL_* 교체          → §14.4
[x] DifficultyTabs/RankingList 잉크 밑줄   → §14.4
[x] LoginBanner/ContinueBanner 평면화      → §14.5
[x] layout.tsx themeColor "#15120f"        → §13.3
[ ] layout.tsx Instrument Serif            → **미채택** (§16.1)
[ ] Lighthouse 재측정: A11y ≥93, Perf ≥97  → 배포 후 측정 (Infra)
```

### 16.1 구현 시 스펙과 다르게 처리한 3건

| 항목 | 스펙 | 구현 | 이유 |
|------|------|------|------|
| **Instrument Serif** | 선택적·권장 | **미채택.** 워드마크는 Geist Sans + `tracking-[0.14em]` + `font-normal` | 앱이 이미 Geist Sans · Geist Mono · Noto Sans KR 3종을 싣고 있다. 라틴 6글자 2곳을 위해 4번째 패밀리를 더하는 건 PWA 페이로드 대비 이득이 낮다. §3.1이 명시한 대체안을 그대로 적용했다. |
| **간행 캡션 문구** | `DAILY PUZZLE · NO.{stageNo}` | `DAILY PUZZLE · 50 STAGES` (`STAGE_RANGES` 마지막 `endStage`에서 산출) | 홈 히어로는 특정 스테이지에 묶이지 않아 `stageNo`가 존재하지 않는다. 진행 중 스테이지는 이미 바로 아래 `ContinueBanner`가 표시한다. |
| **`--shadow-xs/sm/md/lg` 토큰** | §6 표에 정의 | `:root`에 넣지 않음. `--shadow-board` · `--shadow-cell-selected` · `--shadow-numpad` · `--shadow-xl` 4종만 유지 | Tailwind v4의 `shadow-*` 유틸리티는 빌드 타임에 값을 인라인하므로 `:root` 재정의를 읽지 않는다. 실제로 `var()`로 참조되는 4개만 살렸다. |

> 워드마크에는 `font-sans`가 아니라 `font-[family-name:var(--font-geist-sans)]`를 쓴다.
> `@theme inline`의 `--font-sans`가 자기 참조라 비어 있어 `font-sans`는 Noto Sans KR로 떨어진다.
