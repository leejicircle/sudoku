# 🖌 홈 (스테이지 선택) 화면

> 앱의 메인 진입점. 난이도를 선택하여 게임을 시작하는 화면.

> **v2 — 페이퍼 톤 (2026-08).** 아래 §0을 먼저 적용한 뒤 나머지 절을 읽는다.
> 토큰/장식 근거는 `design-system.md` §14 참조.

---

## 0. v2 변경 요약 (페이퍼 톤)

### 0.1 히어로

| 요소 | v1 | **v2** |
|------|-----|--------|
| 배경 | `.home-mesh-bg` 메시 그라데이션 4겹 + `.sudoku-grid-bg` | **`.paper-bg` 모눈종이 1겹** |
| Eyebrow | `Sparkles` 아이콘 + pill 뱃지 + `backdrop-blur` | **간행 캡션** — `DAILY PUZZLE · NO.{n}`, `font-mono`, `tracking-[0.2em]`, `uppercase`, `text-muted-foreground`, 배경·보더·아이콘 없음 |
| 타이틀 | `S · U · D · O · K · U` 시머 그라데이션 | **`SUDOKU`** 단색 `text-foreground`, 세리프(선택), `tracking-[0.14em]`, 애니메이션 없음 |
| 타이틀 밑줄 | — | 선택: `border-b border-border` 1px 괘선 |

### 0.2 난이도 카드 — 색 → pip 게이지

**난이도는 색으로 구분하지 않는다.** `.gradient-*` / `.card-glow-*` 를 전부 삭제하고
좌측 사이드바를 **종이 + 세로 괘선 + 정사각 pip 게이지**로 바꾼다.

```
┌────────┬──────────────────────────────────┐
│   01   │  쉬움                  ⏱ 03:24  │
│        │  EASY                  ★★★      │
│ ■□□□   │                                  │
└────────┴──────────────────────────────────┘
   ↑ 세로 괘선(border-r border-border)이 구분, 색면 아님
```

| 난이도 | pip | `level` | 톤 토큰 |
|--------|-----|:-------:|---------|
| 쉬움 | `■□□□` | 1 | `--difficulty-easy` |
| 보통 | `■■□□` | 2 | `--difficulty-medium` |
| 어려움 | `■■■□` | 3 | `--difficulty-hard` |
| 전문가 | `■■■■` | 4 | `--difficulty-expert` |

**pip 명세**: 6×6px, 간격 3px, 가로 1행, `rounded-none`.
채움 = `bg-current`(부모에 `toneClass`), 빈 칸 = `border border-current opacity-40`.
컨테이너에 `aria-hidden` — 난이도는 카드 `aria-label` 텍스트가 전달한다.

> **★를 쓰지 않는 이유**: ★는 카드 우측의 **클리어 등급(3개)** 에 이미 쓰인다.
> 난이도까지 ★로 표시하면 한 카드 안에 의미가 다른 별이 두 벌 생긴다.

`difficulty-data.ts`에서 `gradientClass` · `glowClass` · `icon`(Sprout/Flame/Zap/Crown) 3필드를
삭제하고 `level: 1|2|3|4` + `toneClass: string` 2필드로 교체한다.

### 0.3 카드 스타일 (§3.2 를 아래로 대체)

| 속성 | v1 | **v2** |
|------|-----|--------|
| 배경 | `bg-card/80 backdrop-blur-sm` | **`bg-card`** (알파·블러 제거) |
| 보더 | `border-border/60` | **`border-border`** 실선 |
| 모서리 | `--radius-xl` = 14px | 동일 토큰 → 자동 8.4px |
| 그림자 | `shadow-sm` → 호버 `shadow-xl` | `--shadow-sm` 고정 |
| 호버 | `-translate-y-1` + 컬러 글로우 | **`hover:bg-accent`** 만 |
| 활성 | `active:scale-[0.99]` | 유지 |
| 잠금 | `opacity-70` | **`.cell-hatch` 빗금 + `text-muted-foreground`** |
| 좌측 사이드바 | 컬러 그라데이션 면 | 배경 없음 + `border-r border-border` |
| 호버 화살표 | `bg-foreground` 원형 배지 | `rounded-none`, 배경 없이 `text-muted-foreground` |

### 0.4 이어하기 배너 (§4 를 아래로 대체)

| 속성 | **v2** |
|------|--------|
| 배경 | `--card` (그라데이션·알파 없음) |
| 보더 | `1px solid --border` |
| 좌측 강조 | `border-l-[3px] border-l-sudoku-primary` |
| 모서리 | `--radius-md` |
| CTA | Ghost, `--sudoku-primary` 텍스트 (7.69:1) |

---

## 1. 와이어프레임 (375px 모바일)

```
┌─────────────────────────────────────┐  ← 0px
│  Header (56px)                      │
│  🟦 로고       [👤 로그인/프로필]    │
├─────────────────────────────────────┤  ← 56px
│                                     │
│         🧩 스도쿠                    │  ← 타이틀 (text-display, 32px)
│    매일 새로운 퍼즐에 도전하세요       │  ← 서브텍스트 (text-caption, 14px)
│                                     │
│  ┌─────────────────────────────┐    │  ← 난이도 카드 시작
│  │  🟢 쉬움         ⏱ 03:24  │    │
│  │  Easy            ⭐⭐⭐     │    │
│  └─────────────────────────────┘    │
│                                     │  ← gap: 12px
│  ┌─────────────────────────────┐    │
│  │  🟡 보통         ⏱ 07:15  │    │
│  │  Medium          ⭐⭐       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🟠 어려움       🔒 잠금   │    │
│  │  Hard     보통 클리어 시 해금 │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🔴 전문가       🔒 잠금   │    │
│  │  Expert   어려움 클리어 시 해금│    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  BottomNav (64px)                   │
│     🏠 홈(활성)     🏆 랭킹        │
└─────────────────────────────────────┘
```

---

## 2. 레이아웃 명세

### 2.1 전체 구조

| 영역 | 높이 | 설명 |
|------|------|------|
| Header | 56px (고정) | sticky top-0, z-index: `--z-header` |
| 콘텐츠 | flex-1 (스크롤) | padding: 24px 16px |
| BottomNav | 64px + safe-area (고정) | fixed bottom-0, z-index: `--z-bottom-nav` |

### 2.2 타이틀 영역

| 속성 | 값 |
|------|-----|
| 제목 텍스트 | "스도쿠" |
| 제목 폰트 | `--font-geist-sans`, 32px (`--text-display`), weight 700 |
| 제목 색상 | `--foreground` |
| 서브텍스트 | "매일 새로운 퍼즐에 도전하세요" |
| 서브 폰트 | 14px (`--text-caption`), weight 400 |
| 서브 색상 | `--muted-foreground` |
| 정렬 | text-center |
| 하단 간격 | 32px (`--space-8`) |

---

## 3. 난이도 카드 컴포넌트

### 3.1 카드 레이아웃

```
┌──────────────────────────────────────┐
│  ● 난이도명              우측 정보    │
│    English name          부가 정보    │
└──────────────────────────────────────┘
     ↑                       ↑
  좌측 영역               우측 영역
```

### 3.2 카드 스타일

| 속성 | 값 |
|------|-----|
| 너비 | 100% (컨테이너 내) |
| 높이 | 80px |
| 배경 | `--card` |
| 보더 | 1px solid `--border` |
| 모서리 | `--radius-lg` (10px) |
| 그림자 | `--shadow-sm` |
| 패딩 | 16px (`--space-4`) |
| 카드 간 간격 | 12px (`--space-3`) |
| 좌측 인디케이터 | 4px 세로 바, 난이도 색상 |
| 커서/터치 | cursor-pointer, active:scale(0.98) |
| 트랜지션 | `--duration-fast` (100ms) |

### 3.3 난이도별 카드 내용

| 난이도 | 좌측 인디케이터 | 한글명 | 영문명 | 우측 (해금) | 우측 (잠금) |
|--------|----------------|--------|--------|-------------|-------------|
| 쉬움 | `--difficulty-easy` | 쉬움 | Easy | ⏱ 최고기록 + ⭐ 별점 | — (항상 해금) |
| 보통 | `--difficulty-medium` | 보통 | Medium | ⏱ 최고기록 + ⭐ 별점 | 🔒 "쉬움 클리어 시 해금" |
| 어려움 | `--difficulty-hard` | 어려움 | Hard | ⏱ 최고기록 + ⭐ 별점 | 🔒 "보통 클리어 시 해금" |
| 전문가 | `--difficulty-expert` | 전문가 | Expert | ⏱ 최고기록 + ⭐ 별점 | 🔒 "어려움 클리어 시 해금" |

### 3.4 카드 상태별 스타일

| 상태 | 배경 | 텍스트 | 특수효과 |
|------|------|--------|---------|
| 해금 (기본) | `--card` | `--card-foreground` | — |
| 해금 (호버) | `--accent` | `--accent-foreground` | `--shadow-md` |
| 해금 (활성) | `--accent` | `--accent-foreground` | scale(0.98) |
| 잠금 | `--muted` | `--muted-foreground` | opacity: 0.7 |
| 잠금 (탭) | `--muted` | `--muted-foreground` | 잠금 팝오버 표시 |

### 3.5 우측 기록 영역

| 항목 | 스타일 |
|------|--------|
| 최고기록 시간 | `--font-geist-mono`, 16px, `--foreground` |
| 별점 | `Star` 아이콘 (Lucide), 16px, `--warning` 색상 |
| 기록 없음 | "—" 표시, `--muted-foreground` |
| 잠금 아이콘 | `Lock` (Lucide), 20px, `--muted-foreground` |
| 해금 조건 텍스트 | 12px (`--text-small`), `--muted-foreground` |

---

## 4. 이어하기 배너 (조건부)

진행 중인 게임이 있을 때 카드 위에 표시.

```
┌─────────────────────────────────────┐
│  📋 진행 중인 게임이 있습니다         │
│  보통 · 5:23 경과 · 45% 완료         │
│                      [이어하기 →]    │
└─────────────────────────────────────┘
```

| 속성 | 값 |
|------|-----|
| 배경 | `--sudoku-primary` / 10% opacity |
| 보더 | 1px solid `--sudoku-primary` / 20% |
| 모서리 | `--radius-lg` (10px) |
| 패딩 | 16px |
| CTA 버튼 | Ghost 스타일, `--sudoku-primary` 텍스트 |
| 하단 간격 | 16px (`--space-4`) |

---

## 5. 반응형 고려사항

| 브레이크포인트 | 카드 레이아웃 | 카드 높이 |
|---------------|-------------|----------|
| < 375px | 세로 스택 1열 | 72px |
| 375px ~ 767px | 세로 스택 1열 | 80px |
| ≥ 768px | 2×2 그리드 (gap 16px) | 100px |
| ≥ 1024px | 2×2 그리드 (max-w: 600px 중앙) | 100px |
