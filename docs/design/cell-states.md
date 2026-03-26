# 🖌 셀 상태별 디자인 명세

> 스도쿠 보드 각 셀의 시각적 상태를 정의한다.
> Frontend 에이전트는 이 명세대로 셀 컴포넌트를 구현한다.

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

### 2.2 초기 제공 (Given)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-given` |
| 텍스트 색상 | `--cell-given-foreground` |
| 폰트 크기 | `--text-cell-given` (24px) |
| 폰트 가중치 | **700 (Bold)** |
| 폰트 패밀리 | `--font-geist-mono` |
| 커서 | default (수정 불가 표시) |
| 특이사항 | 숫자 입력 시도 시 무반응 (shake 없음) |

### 2.3 유저 입력 (Filled)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-default` |
| 텍스트 색상 | `--cell-default-foreground` |
| 폰트 크기 | `--text-cell` (24px) |
| 폰트 가중치 | 500 (Medium) |
| 폰트 패밀리 | `--font-geist-mono` |
| 입력 애니메이션 | `animate-cell-pop` |

### 2.4 선택됨 (Selected)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-selected` |
| 텍스트 색상 | `--cell-selected-foreground` |
| 그림자 | `--shadow-cell-selected` (inset 2px border) |
| z-index | `--z-cell-highlight` (20) |
| 트랜지션 | background, box-shadow `--duration-fast` |

### 2.5 같은 행/열/박스 하이라이트 (Highlighted)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-highlighted` |
| 텍스트 색상 | 기존 상태 유지 |
| 보더 | 없음 |
| 트랜지션 | background `--duration-fast` |

### 2.6 같은 숫자 하이라이트 (Same Number)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-same-number` |
| 텍스트 색상 | 기존 상태 유지 |
| 폰트 가중치 | 기존 + Bold 강조 (700) |
| 트랜지션 | background `--duration-fast` |

### 2.7 에러 (Error)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-error` |
| 텍스트 색상 | `--cell-error-foreground` |
| 폰트 크기 | `--text-cell` (24px) |
| 폰트 가중치 | 500 |
| 입력 애니메이션 | `animate-cell-error-shake` |
| 지속 | 에러 상태는 올바른 숫자 입력 또는 삭제까지 유지 |

### 2.8 잠금 (Locked)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-locked` |
| 아이콘 | `Lock` (Lucide), 16px, 중앙 배치 |
| 아이콘 색상 | `--cell-locked-foreground` |
| 숫자 | 표시 안 함 |
| 커서 | not-allowed |
| 탭 동작 | 잠금 팝오버 표시 (`lock-popover.md` 참조) |
| opacity | 0.6 |
| 패턴 | 대각선 빗금 패턴 (선택사항, CSS background) |

### 2.9 완성 플래시 (Completed)

| 속성 | 값 |
|------|-----|
| 배경 | `--cell-completed` → `--cell-default` (애니메이션) |
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
