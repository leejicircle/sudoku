# ADR-300: game-store.ts 리팩토링 — 잠금 복원, 타입 안전성, 렌더링 최적화

## Status

Accepted

## Context

PR #31에서 구현된 `game-store.ts`에 4가지 구조적 문제가 발견되었다.

### 문제 1: reset 시 잠금 칸이 원래대로 복원되지 않음

`reset()`이 현재 시점의 `lockedCells`를 "원래 목록"으로 사용했다.
게임 중 잠금이 해제되면 `lockedCells`에서 빠지므로, reset 시점에는 이미 줄어든 목록을 참조하게 된다.

```ts
// Before: 이미 줄어든 목록을 원래 목록이라고 가져옴
const result = get();
const originalLockedCells = result.lockedCells; // 해제된 셀은 이미 빠져있음
```

### 문제 2: 불필요한 Set 생성으로 인한 성능 저하

`setValue`, `clearValue`, `toggleNote`, `processUnlocks` 4곳에서 변경하지 않는 셀까지 매번 새 객체 + `new Set()`을 생성했다.

```ts
// Before: 81개 셀 전부 새 객체 생성
return { ...c, notes: new Set(c.notes) }; // 변경 안 하는 셀도 복사
```

이는 9x9=81개 셀을 매 입력마다 전부 복사하는 비용이 발생하고, React에서 `memo`/`useMemo`로 셀 단위 리렌더링 최적화를 할 때 참조가 항상 바뀌어 최적화가 무력화된다.

### 문제 3: 타입 안전성을 우회하는 EMPTY_SOLUTION

```ts
// Before: as unknown as — 타입 시스템을 완전히 우회
const EMPTY_SOLUTION: SolutionGrid = [] as unknown as SolutionGrid;
```

`initGame` 전에 `solution`에 접근하면 빈 배열이지만 타입은 `SolutionGrid`이므로 컴파일러가 경고하지 않는다.

### 문제 4: reset 내부 주석과 실제 동작 불일치

주석은 "원래 목록으로 복원", "원래 solution/puzzle에서 재생성"을 논의하지만, 실제 코드는 현재 시점의 `lockedCells`를 그대로 사용했다.

## Decision

### 1. `initialLockedCells` 필드 추가

- `GameStoreState`에 `initialLockedCells: LockedCell[]` 필드를 추가한다.
- `initGame()`에서 최초 잠금 목록을 `initialLockedCells`에 저장한다.
- `reset()`에서는 `initialLockedCells`를 참조하여 원래 잠금 상태를 복원한다.
- `initialLockedCells`는 게임 진행 중 변경되지 않는다.

### 2. 변경 대상 셀만 새 객체 생성

- `setValue`, `clearValue`, `toggleNote`, `processUnlocks`에서 변경하지 않는 셀은 기존 참조를 그대로 반환한다 (`return c`).
- 변경 대상 셀만 `{ ...c, ... }` + `new Set()`으로 새 객체를 생성한다.
- 이를 통해 React에서 `React.memo` 또는 `useMemo`로 셀 단위 리렌더링 최적화가 가능해진다.

### 3. `solution: SolutionGrid | null`로 변경

- `solution` 타입을 `SolutionGrid | null`로 선언하고, 초기값은 `null`로 둔다.
- `setValue`에서 `!solution` 가드를 추가하여 null일 때 입력을 차단한다.
- `as unknown as` 캐스팅을 제거하여 타입 안전성을 확보한다.

### 4. reset 주석 정리

- 문제 1의 수정으로 주석과 코드의 불일치가 해소된다.
- "원래 목록으로 복원"이 실제로 `initialLockedCells`를 참조하므로 코드가 주석의 의도와 일치한다.

## Consequences

### 긍정적

- **reset 정확성**: 잠금 해제 후 reset해도 원래 잠금 칸이 모두 복원된다.
- **렌더링 최적화**: 변경되지 않은 셀의 참조가 유지되어, React 셀 컴포넌트에서 `memo` 최적화가 유효하게 동작한다. 매 입력마다 81개 → 1개 셀만 새 객체가 생성된다.
- **타입 안전성**: `initGame` 전에 `solution`에 접근하면 `null`이므로 컴파일러가 경고한다.
- **코드 정합성**: 주석과 실제 동작이 일치한다.

### 부정적

- `initialLockedCells` 필드가 추가되어 persist 대상이 늘어난다 (미미한 localStorage 사용량 증가).
- `solution`이 nullable이 되어 사용처에서 null 체크가 필요하다 (현재는 `setValue` 1곳).

---

**변경 파일**: `src/stores/game-store.ts`, `__tests__/sudoku/game-store.test.ts`
**관련 PR**: PR #31 (원본), 이 리팩토링으로 수정
