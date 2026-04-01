# ADR-105: 반응형 디자인 구현 전략

## 상태
승인됨 (Accepted)

## 날짜
2026-04-02

## 컨텍스트

디자인 명세(`docs/design/responsive.md`)에서 정의한 5단계 브레이크포인트를
기존 게임 UI 컴포넌트에 적용해야 한다.

### 고려 사항
1. CSS 변수 기반 스케일링 vs Tailwind 브레이크포인트 클래스 중복
2. 데스크톱(≥1024px) 2컬럼 레이아웃 전환
3. 초소형 뷰포트(< 360px) 대응
4. `prefers-reduced-motion` 접근성

### 선택지
- **A) Tailwind 클래스만**: `md:size-[48px] lg:size-[56px]` 등 모든 컴포넌트에 브레이크포인트 클래스
- **B) CSS 변수 @media 오버라이드**: globals.css에서 `--cell-size` 등을 브레이크포인트별로 변경
- **C) 혼합**: 기반 변수는 @media, 레이아웃 전환은 Tailwind 클래스

## 결정

**선택지 C — 혼합 전략**

### 이유
1. 셀 크기, 숫자패드 크기, 패딩 등 **수치 스케일링**은 CSS 변수 하나를 변경하면
   해당 변수를 참조하는 모든 컴포넌트가 자동 반영 → @media 쿼리로 중앙 관리
2. **레이아웃 전환**(1컬럼→2컬럼, 요소 숨김 등)은 Tailwind의 `lg:flex-row`,
   `max-[359px]:hidden` 등으로 선언적 표현이 자연스러움
3. Cell.tsx에서 `md:size-[--cell-size-md] lg:size-[--cell-size-lg]` 중복 제거 →
   `size-[var(--cell-size)]`만으로 단순화

## 구현 상세

### 브레이크포인트별 CSS 변수 (globals.css)

| 브레이크포인트 | --cell-size | --numpad-button-size | --board-padding |
|--------------|------------|---------------------|----------------|
| < 360px      | 34px       | 42px                | 8px            |
| base (≥360)  | 40px       | 48px                | 16px           |
| sm (≥640px)  | 44px       | 52px                | 24px           |
| md (≥768px)  | 48px       | 52px                | 32px           |
| lg (≥1024px) | 56px       | 56px                | 40px           |

### 데스크톱 2컬럼 레이아웃 (GameContent.tsx)
```
lg:flex-row lg:justify-center lg:items-start lg:gap-6
```
- 좌측: Board (`lg:shrink-0`)
- 우측: Toolbar + NumberPad (`lg:w-auto lg:max-w-none`)

### 컨트롤 너비 매칭
```css
max-w-[calc(var(--cell-size)*9+16px)]
```
셀 9개 + thin gap 6개(6px) + thick gap 2개(4px) + border 2개(6px) = 16px 고정분.
CSS 변수가 변경되면 자동으로 보드 너비와 일치.

### Toolbar 초소형 뷰포트
`max-[359px]:hidden`으로 라벨 숨김 → 아이콘만 표시

### prefers-reduced-motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 변경 파일
- `src/app/globals.css` — @media 쿼리 5개 추가
- `src/components/game/Cell.tsx` — md:/lg: 클래스 제거, CSS 변수 단일화
- `src/app/game/GameContent.tsx` — 데스크톱 2컬럼 레이아웃
- `src/components/game/Toolbar.tsx` — 초소형 라벨 숨김
- `src/components/game/NumberPad.tsx` — 데스크톱 하단 패딩 제거
