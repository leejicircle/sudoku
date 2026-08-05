# 🖌 셀 상태별 디자인 명세

> 스도쿠 보드 각 셀의 시각적 상태를 정의한다.
> Frontend 에이전트는 이 명세대로 셀 컴포넌트를 구현한다.

> **v2 — 페이퍼 톤 반영 (2026-08).** 토큰 값은 `design-system.md` §2.3, 구분 전략은 §12 참조.
> **핵심 규칙: 모든 상태는 "색 + 색이 아닌 신호" 두 겹으로 표현한다.**
> 페이퍼 톤에서 배경 색차가 얕아진 만큼, 실제 판별은 **굵기 · 링 · 밑줄 · 빗금**이 책임진다.
> 셀 배경끼리의 대비는 3:1을 만족하지 않으며 이는 의도된 설계다(`design-system.md` §9.2 마지막 표).

### 인쇄물 은유

| 실물 | 앱 |
|------|-----|
| 문제집에 **인쇄된 숫자** | `given` — 검정 잉크, Bold |
| 내가 **볼펜으로 써넣은 숫자** | `filled` — 파란 잉크, Medium |
| 연필 **메모** | `memo` — 회색 소형 숫자 |
| 빨간펜 **첨삭** | `error` — 빨간 잉크 + 밑줄 |

---

## 1. 셀 상태 목록

| # | 상태 | 설명 | 사용자 수정 가능 |
|---|------|------|:---------------:|
| 1 | `default` | 빈 셀 (아직 입력 없음) | ✅ |
| 2 | `given` | 초기 제공 숫자 (퍼즐 생성 시) | ❌ |
| 3 | `filled` | 유저가 입력한 숫자 | ✅ |
| 4 | `selected` | 현재 선택된(포커스된) 셀 | — |
| 5 | `highlighted` | 선택 셀과 같은 행/열/박스 | — |
| 6 | `same-number` | 선택 셀과 같은 숫자 | — |
| 7 | `error` | 잘못된 숫자 (중복 검출) | ✅ |
| 8 | `locked` | 잠금 칸 (난이도 해금 전) | ❌ |
| 9 | `completed` | 행/열/박스 완성 시 일시적 플래시 | — |
| 10 | `memo` | 메모 숫자가 있는 셀 | ✅ |

> 상태는 중첩 가능: 예) `filled` + `selected` + `same-number`

---

## 2. 상태별 스타일 명세

### 2.1 기본 상태 (Default — 빈 셀)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-default` |
| 텍스트 | — (숫자 없음) |
| 보더 | 없음 (그리드 선으로 구분) |
| 커서 | pointer |
| 트랜지션 | background `--duration-fast` |

### 2.2 초기 제공 (Given) — "인쇄된 문제"

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-given` — **v2에서 `--cell-default`와 같은 값** |
| 텍스트 색상 | `--cell-given-foreground` (검정 잉크, 16.85:1) |
| 폰트 크기 | `--text-cell-given` (24px) |
| 폰트 가중치 | **700 (Bold)** ← 비색상 구분 신호 |
| 폰트 패밀리 | `--font-geist-mono` |
| 커서 | default (수정 불가 표시) |
| 특이사항 | 숫자 입력 시도 시 무반응 (shake 없음) |

> **배경으로 given을 구분하지 않는다.** 실제 문제집에서 인쇄된 칸과 빈 칸의 종이는 같다.
> 구분은 **잉크 색(검정 vs 파랑) + 굵기(700 vs 500)** 두 축이 담당하므로,
> 색각이상 환경에서도 굵기만으로 분리된다.

### 2.3 유저 입력 (Filled) — "볼펜으로 써넣은 답"

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-default` |
| 텍스트 색상 | `--cell-default-foreground` (**파란 볼펜 잉크**, 7.21:1) |
| 폰트 크기 | `--text-cell` (24px) |
| 폰트 가중치 | 500 (Medium) |
| 폰트 패밀리 | `--font-geist-mono` |
| 입력 애니메이션 | `animate-cell-pop` |

### 2.4 선택됨 (Selected)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-selected` (파란 음영, 가장 진함) |
| 텍스트 색상 | `--cell-selected-foreground` (11.38:1) |
| 그림자 | **`--shadow-cell-selected` (inset 2px 잉크 링) — 필수, 제거 금지** |
| z-index | `--z-cell-highlight` (20) |
| 트랜지션 | background, box-shadow `--duration-fast` |

> 링 대비는 배경 대비 **5.54:1**(라이트) / **4.13:1**(다크)로, 배경색만으로 판별이 어려운
> 환경에서도 선택 위치가 항상 읽힌다. 이 링이 selected를 same-number와 가르는 유일한 형태 신호다.

### 2.5 같은 행/열/박스 하이라이트 (Highlighted)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-highlighted` — **무채색 음영** (파란 계열 아님) |
| 텍스트 색상 | 기존 상태 유지 |
| 보더 | 없음 |
| 트랜지션 | background `--duration-fast` |

> v1에서는 highlighted/same-number/selected가 전부 hue 250 파란 계열이라 명도만으로 갈렸다.
> v2는 highlighted만 **무채색축**으로 옮겨 색상축 자체를 분리한다.

### 2.6 같은 숫자 하이라이트 (Same Number)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-same-number` (파란 음영, 중간) |
| 텍스트 색상 | 기존 상태 유지 |
| 폰트 가중치 | **Bold 강조 (700) ← 비색상 구분 신호** |
| 트랜지션 | background `--duration-fast` |

### 2.7 에러 (Error) — "빨간펜 첨삭"

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-error` |
| 텍스트 색상 | `--cell-error-foreground` (5.34:1) |
| **텍스트 장식** | **`underline decoration-2 underline-offset-4` ← 비색상 구분 신호 (v2 신규)** |
| 폰트 크기 | `--text-cell` (24px) |
| 폰트 가중치 | 500 |
| 입력 애니메이션 | `animate-cell-error-shake` |
| ARIA | `aria-invalid="true"` |
| 지속 | 에러 상태는 올바른 숫자 입력 또는 삭제까지 유지 |

> 오류는 **즉시** 오류로 읽혀야 하므로 신호가 4겹이다: 빨간 배경 + 빨간 잉크 + 밑줄 + shake.
> 이 중 색을 뺀 3겹(밑줄·shake·aria)만으로도 오류 판별이 가능해야 한다.

### 2.8 잠금 (Locked)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-locked` |
| **패턴** | **`.cell-hatch` 대각 45° 빗금 — v2에서 필수 (선택사항 아님)** |
| 아이콘 | `Lock` (Lucide), 16px, 중앙 배치 |
| 아이콘 색상 | `--cell-locked-foreground` (4.82:1) |
| 숫자 | 표시 안 함 |
| 커서 | not-allowed |
| 탭 동작 | 잠금 팝오버 표시 (`lock-popover.md` 참조) |
| ~~opacity~~ | **제거** — 페이퍼 톤은 투명도로 상태를 표현하지 않는다. 빗금이 대신한다 |

```css
/* globals.css */
.cell-hatch {
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 3px,
    color-mix(in oklch, var(--cell-locked-foreground) 22%, transparent) 3px 4px
  );
}
```

### 2.9 완성 플래시 (Completed)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-completed` (v2: 초록 → **황토 스탬프 톤**) → `--cell-default` (애니메이션) |
| 애니메이션 | `animate-cell-complete-flash` (500ms) |
| 적용 대상 | 완성된 행/열/박스의 모든 셀 |
| 트리거 | 행, 열, 또는 3×3 박스가 1-9로 완성될 때 |
| 연쇄 | 동시에 여러 유닛 완성 시 모두 동시 플래시 |

### 2.10 메모 (Memo)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-default` (빈 셀과 동일) |
| 메모 숫자 색상 | `--muted-foreground` |
| 메모 폰트 | `--font-geist-mono`, 10px (`--text-cell-memo`) |
| 메모 레이아웃 | 3×3 그리드 (각 영역 ~12px × 12px) |
| 메모 정렬 | 각 숫자는 고정 위치 (1=좌상, 5=중앙, 9=우하) |
| 메모 숫자 간격 | 1px |

**메모 3×3 위치 매핑:**

```
┌────┬────┬────┐
│ 1  │ 2  │ 3  │
├────┼────┼────┤
│ 4  │ 5  │ 6  │
├────┼────┼────┤
│ 7  │ 8  │ 9  │
└────┴────┴────┘
```

---

## 2.11 비색상 신호 요약 (페이퍼 톤 필수 검증표)

**색을 전부 회색조로 바꿔도 아래 신호만으로 모든 상태가 구별되어야 한다.**
QA 시 브라우저 필터 `grayscale(1)`를 걸고 확인한다.

| 상태 | 배경 색상축 | 배경 명도(L) | 링 | 숫자 굵기 | 밑줄 | 빗금 | 아이콘 |
|------|:---------:|:-----------:|:--:|:--------:|:----:|:----:|:-----:|
| default | 종이 | 0.99 | — | — | — | — | — |
| given | 종이 | 0.99 | — | **700** | — | — | — |
| filled | 종이 | 0.99 | — | 500 | — | — | — |
| selected | 파랑 | **0.86** | **2px** | 상속 | — | — | — |
| same-number | 파랑 | 0.905 | — | **700** | — | — | — |
| highlighted | **무채색** | 0.955 | — | 상속 | — | — | — |
| error | 빨강 | 0.895 | — | 500 | **✓** | — | — |
| locked | 무채색 | 0.925 | — | — | — | **✓** | **Lock** |
| completed | 황토 | 0.93 | — | 상속 | — | — | — |

> 회색조에서 selected(가장 어두운 배경 + 링) → same-number(Bold) → highlighted(가장 옅음)
> 순으로 확실히 갈린다. error는 밑줄, locked는 빗금+아이콘으로 색 없이도 즉시 읽힌다.

---

## 3. 상태 우선순위 (중첩 시)

여러 상태가 동시에 적용될 때의 우선순위:

| 우선순위 | 상태 | 설명 |
|---------|------|------|
| 1 (최고) | `selected` | 현재 포커스는 항상 최우선 |
| 2 | `error` | 에러 표시는 하이라이트보다 우선 |
| 3 | `completed` | 완성 플래시 (일시적) |
| 4 | `same-number` | 같은 숫자 강조 |
| 5 | `highlighted` | 같은 행/열/박스 |
| 6 | `locked` | 잠금 칸 |
| 7 | `given` | 초기 제공 숫자 |
| 8 | `memo` | 메모 숫자 |
| 9 | `filled` | 유저 입력 숫자 |
| 10 (최저) | `default` | 빈 셀 |

**중첩 예시:**
- `given` + `selected` → selected 배경 + given 폰트(Bold)
- `filled` + `highlighted` → highlighted 배경 + filled 텍스트 색상
- `filled` + `error` + `selected` → selected 배경 + error 텍스트 색상
- `memo` + `highlighted` → highlighted 배경 + memo 숫자 표시

---

## 4. 상태 전환 트리거

| 이전 → 이후 | 트리거 |
|-------------|--------|
| `default` → `selected` | 셀 탭 |
| `selected` → `filled` | 숫자패드 입력 (유효) |
| `selected` → `error` | 숫자패드 입력 (무효) |
| `selected` → `memo` | 메모 모드에서 숫자 입력 |
| `filled` → `default` | 지우기 도구 |
| `error` → `filled` | 올바른 숫자 재입력 |
| `error` → `default` | 지우기 도구 |
| `memo` → `filled` | 일반 모드에서 숫자 입력 (메모 자동 삭제) |
| `memo` → `default` | 지우기 도구 |
| `*` → `completed` | 행/열/박스 완성 시 (500ms 후 이전 상태로) |

---

## 5. 접근성 (A11y) 매핑

| 상태 | role | aria-label | aria-selected | aria-invalid |
|------|------|-----------|:------------:|:------------:|
| default | gridcell | "{row}행 {col}열, 비어있음" | — | — |
| given | gridcell | "{row}행 {col}열, 초기값 {n}" | — | — |
| filled | gridcell | "{row}행 {col}열, 값 {n}" | — | — |
| selected | gridcell | "{row}행 {col}열, 선택됨" | true | — |
| error | gridcell | "{row}행 {col}열, 값 {n}, 오류" | — | true |
| locked | gridcell | "{row}행 {col}열, 잠김" | — | — |
| memo | gridcell | "{row}행 {col}열, 메모 {1,3,7}" | — | — |
