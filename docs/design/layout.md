# 🖌 공통 레이아웃 (Header + BottomNav)

> 모든 페이지에 공유되는 레이아웃 구조를 정의한다.
> Header와 BottomNav는 페이지별로 변형되며, 이 문서에서 모든 변형을 명세한다.

---

## 1. 전체 레이아웃 구조

### 1.1 와이어프레임

```
┌─────────────────────────────────────┐
│  env(safe-area-inset-top)           │  ← iOS 노치 영역
├─────────────────────────────────────┤
│  Header (56px)                      │  ← sticky top-0
│  [좌측]      [중앙]       [우측]    │
├─────────────────────────────────────┤
│                                     │
│                                     │
│            콘텐츠 영역               │  ← flex-1, overflow-y-auto
│         (페이지별 콘텐츠)            │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  BottomNav (64px)                   │  ← fixed bottom-0
│     [홈]              [랭킹]        │
├─────────────────────────────────────┤
│  env(safe-area-inset-bottom)        │  ← iOS 홈 인디케이터
└─────────────────────────────────────┘
```

### 1.2 CSS 구조

```css
/* 전체 레이아웃 */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;             /* 동적 뷰포트 높이 */
}

/* 콘텐츠 영역 */
.app-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
  /* BottomNav가 없는 페이지에서는 padding-bottom: 0 */
}
```

---

## 2. Header 컴포넌트

### 2.1 기본 명세

| 속성 | 값 |
|------|-----|
| 높이 | 56px |
| position | sticky |
| top | 0 (+ `env(safe-area-inset-top)`) |
| z-index | `--z-header` (40) |
| 배경 | `--background` |
| 하단 보더 | 1px solid `--border` |
| 패딩 좌우 | 16px (`--space-4`) |
| 레이아웃 | flex, items-center, justify-between |
| 3분할 | 좌측(flex-1 start) / 중앙(flex-0 center) / 우측(flex-1 end) |

### 2.2 페이지별 Header 변형

| 페이지 | 좌측 | 중앙 | 우측 |
|--------|------|------|------|
| **홈** | 앱 로고 | — | 로그인 or 프로필 아이콘 |
| **게임** | ← 뒤로가기 | 난이도 라벨 + 타이머 | ⏸ 일시정지 |
| **랭킹** | 앱 로고 | "랭킹" 제목 | 로그인 or 프로필 아이콘 |
| **로그인** | ← 뒤로가기 | "로그인" 제목 | — (빈 공간) |

### 2.3 Header 요소 명세

#### 앱 로고

| 속성 | 값 |
|------|-----|
| 유형 | 텍스트 로고 "SUDOKU" 또는 아이콘 + 텍스트 |
| 폰트 | `--font-geist-sans`, 18px, weight 700 |
| 색상 | `--foreground` |
| 터치 영역 | 44px 높이 |
| 동작 | 홈으로 이동 (`/`) |

#### 뒤로가기 버튼

| 속성 | 값 |
|------|-----|
| 아이콘 | `ChevronLeft` (Lucide), 24px |
| 색상 | `--foreground` |
| 터치 영역 | 44×44px |
| 패딩 | 10px (아이콘 24px + 패딩 = 44px) |
| 동작 | `router.back()` 또는 홈으로 |
| 호버 | `--accent` 배경, `--radius-md` |

#### 중앙 제목

| 속성 | 값 |
|------|-----|
| 폰트 | 16px (`--text-body`), weight 600 |
| 색상 | `--foreground` |
| 정렬 | text-center |
| max-width | 50% (좌우 영역 침범 방지) |

#### 게임 중앙 (난이도 + 타이머)

```
┌────────────────────┐
│ 보통 · 03:24       │
└────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 난이도 라벨 | 12px (`--text-small`), weight 500, `--difficulty-*` 색상 |
| 구분자 | " · " (가운데 점) |
| 타이머 | 20px (`--text-timer`), `--font-geist-mono`, weight 500 |
| 타이머 색상 | `--foreground` |
| 전체 레이아웃 | inline-flex, items-baseline, gap: 6px |

#### 로그인/프로필 아이콘 (우측)

| 상태 | 내용 | 스타일 |
|------|------|--------|
| 비로그인 | `User` 아이콘 | 24px, `--muted-foreground`, 44×44px 터치 |
| 로그인 | 프로필 이미지 | 32px 원형, `--border` 보더 1px |
| 로그인 (이미지 없음) | 이니셜 아바타 | 32px 원형, `--muted` 배경, 14px bold 텍스트 |
| 동작 | — | 비로그인: 로그인 페이지 이동, 로그인: 프로필 드롭다운 (v2) |

#### 일시정지 버튼 (게임 우측)

| 속성 | 값 |
|------|-----|
| 아이콘 | `Pause` (Lucide), 20px |
| 색상 | `--foreground` |
| 터치 영역 | 44×44px |
| 호버 | `--accent` 배경 |
| 동작 | 일시정지 오버레이 표시 |

---

## 3. BottomNav 컴포넌트

### 3.1 와이어프레임

```
┌──────────────────┬──────────────────┐
│       🏠         │       🏆         │
│       홈         │      랭킹        │
└──────────────────┴──────────────────┘
```

### 3.2 기본 명세

| 속성 | 값 |
|------|-----|
| 높이 | 64px (내부) + `env(safe-area-inset-bottom)` (패딩) |
| position | fixed |
| bottom | 0 |
| left / right | 0 |
| z-index | `--z-bottom-nav` (40) |
| 배경 | `--background` |
| 상단 보더 | 1px solid `--border` |
| 레이아웃 | flex, items-center |
| 탭 분할 | flex-1 × 2 (균등) |

### 3.3 표시 조건

| 페이지 | BottomNav 표시 |
|--------|:--------------:|
| 홈 (`/`) | ✅ |
| 게임 (`/game`) | ❌ (숫자패드가 하단 차지) |
| 랭킹 (`/ranking`) | ✅ |
| 로그인 (`/login`) | ❌ |

### 3.4 탭 아이템 명세

| 속성 | 값 |
|------|-----|
| 레이아웃 | flex-col, items-center, justify-center, gap: 2px |
| 터치 영역 | 전체 flex-1 × 64px (최소 44px) |
| 아이콘 크기 | 24px |
| 라벨 폰트 | 11px, weight 500 |

### 3.5 탭 상태별 스타일

| 상태 | 아이콘 색상 | 라벨 색상 | 특수효과 |
|------|-----------|----------|---------|
| 비활성 | `--muted-foreground` | `--muted-foreground` | — |
| 활성 | `--sudoku-primary` | `--sudoku-primary` | — |
| 탭 (누름) | `--sudoku-primary` | `--sudoku-primary` | scale(0.95), 100ms |

### 3.6 탭 목록

| 순서 | 아이콘 | 라벨 | 경로 | aria-label |
|------|--------|------|------|-----------|
| 1 | `Home` (Lucide) | "홈" | `/` | "홈으로 이동" |
| 2 | `Trophy` (Lucide) | "랭킹" | `/ranking` | "랭킹으로 이동" |

---

## 4. Safe Area 처리

### 4.1 iOS 노치 & 홈 인디케이터

```css
/* Header 상단 safe area */
header {
  padding-top: env(safe-area-inset-top);
}

/* BottomNav 하단 safe area */
nav.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 콘텐츠 하단 여유 (BottomNav 있는 페이지) */
.content-with-nav {
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
}

/* 콘텐츠 하단 여유 (BottomNav 없는 페이지 — 게임, 로그인) */
.content-without-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 4.2 viewport-fit 설정

`layout.tsx`에서 이미 설정됨:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
```

---

## 5. 반응형

### 5.1 Header 반응형

| 브레이크포인트 | 변경사항 |
|---------------|---------|
| < 375px | 로고 텍스트 축소 16px, 타이머 18px |
| 375px ~ 767px | 기본 (위 명세) |
| ≥ 768px | 높이 64px, 패딩 좌우 24px, 최대 너비 768px 중앙 |
| ≥ 1024px | 최대 너비 1024px 중앙, 네비게이션 링크 추가 가능 |

### 5.2 BottomNav 반응형

| 브레이크포인트 | 변경사항 |
|---------------|---------|
| < 375px | 라벨 숨김, 아이콘만 표시 |
| 375px ~ 767px | 기본 (위 명세) |
| ≥ 768px | 숨김 → Header에 네비게이션 통합 (선택사항) |

### 5.3 데스크톱 레이아웃 (≥ 1024px)

```
┌─────────────────────────────────────────────┐
│  Header (전체 너비, 콘텐츠 중앙 정렬)        │
│  로고    [홈] [랭킹]              프로필      │
├─────────────────────────────────────────────┤
│                                             │
│       ┌─────────────────────────┐           │
│       │   콘텐츠 (max-w 600px)  │           │
│       └─────────────────────────┘           │
│                                             │
│  (BottomNav 숨김)                           │
└─────────────────────────────────────────────┘
```

---

## 6. 접근성

### 6.1 Header

| 속성 | 값 |
|------|-----|
| HTML 태그 | `<header>` |
| role | banner |
| 뒤로가기 | aria-label="뒤로 가기" |
| 일시정지 | aria-label="일시정지" |
| 로고 | aria-label="스도쿠 홈" |

### 6.2 BottomNav

| 속성 | 값 |
|------|-----|
| HTML 태그 | `<nav>` |
| role | navigation |
| aria-label | "메인 내비게이션" |
| 활성 탭 | aria-current="page" |
| 탭 역할 | `<a>` 또는 `<Link>` (Next.js) |

---

## 7. 구현 컴포넌트 매핑

| 문서 요소 | React 컴포넌트 경로 | 비고 |
|----------|---------------------|------|
| Header | `src/components/layout/Header.tsx` | 페이지별 props로 변형 |
| BottomNav | `src/components/layout/BottomNav.tsx` | 경로 기반 활성 탭 |
| AppLayout | `src/components/layout/AppLayout.tsx` | Header + children + BottomNav 조합 |

> Frontend 에이전트가 위 경로에 컴포넌트를 생성할 것을 권장.
