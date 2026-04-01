# ADR-103: ContinueBanner 하이드레이션 및 뒤로가기 상태 유지

## Status

Accepted

## Context

홈 화면의 ContinueBanner는 진행 중인 게임이 있을 때 이어하기 배너를 표시한다.
초기 구현에서 **뒤로가기(browser back) 시 배너가 사라지는** 버그가 발생했다.

### 근본 원인 분석

두 가지 브라우저/프레임워크 제약이 겹쳐 발생:

1. **`storage` 이벤트 제약**: 브라우저의 `storage` 이벤트는 **다른 탭**에서
   localStorage가 변경될 때만 발생하며, **같은 탭** 내 변경은 감지하지 못한다.
   (`useSyncExternalStore` + `storage` 구독 조합으로는 동일 탭 네비게이션 후
   변경된 데이터를 감지할 수 없음)

2. **Next.js Router Cache**: App Router의 클라이언트 네비게이션은 컴포넌트 트리를
   메모리에 캐싱한다. 뒤로가기 시 컴포넌트가 재마운트되지 않으므로
   `useEffect(fn, [])` 등 마운트 시 실행되는 로직이 다시 호출되지 않는다.

### 시도한 접근들

| # | 접근 | 실패 원인 |
|---|------|---------|
| 1 | `useState` + `useEffect` (hasMounted 패턴) | Router Cache로 useEffect 재실행 안 됨 |
| 2 | Zustand `persist.hasHydrated()` + `onFinishHydration` 커스텀 훅 | 동일 — useEffect 재실행 안 됨 |
| 3 | `useEffect` 내 직접 localStorage 읽기 | 동일 — useEffect 재실행 안 됨 |
| 4 | `useSyncExternalStore` + `storage` 이벤트 구독 | storage 이벤트가 동일 탭 변경 감지 불가 |

### 대안 검토

- **`popstate`/`pageshow` 이벤트 리스너 추가**: 뒤로가기/앞으로가기를 감지하여
  데이터를 재로드하는 방식. 동작하지만 **컴포넌트에 종속**되어 재사용성이 낮고,
  브라우저별 이벤트 타이밍 차이(특히 Safari BFCache)를 개별 처리해야 함.

- **Zustand 스토어 직접 구독**: Zustand 스토어는 JS 모듈 싱글턴이므로
  클라이언트 네비게이션(뒤로가기 포함)에서 **메모리에 상태가 유지**됨.
  별도 이벤트 리스너 없이 React의 표준 구독 메커니즘으로 해결 가능.

## Decision

**localStorage 직접 읽기를 제거하고, Zustand 스토어(`useGameStore`)를 구독한다.**

### 구현 상세

1. **Zustand 스토어 구독**: `useGameStore` 셀렉터로 `isStarted`, `isComplete`,
   `stage`, `timer`, `board`를 구독. 스토어 싱글턴 특성으로 클라이언트 네비게이션
   간 상태가 자동 유지됨.

2. **하이드레이션 감지**: `useSyncExternalStore`로 Zustand persist의
   `hasHydrated()` / `onFinishHydration()`을 구독하여 하이드레이션 완료 시점을 감지.

3. **Skeleton UI**: 하이드레이션 완료 전에는 `BannerSkeleton`을 표시하여
   레이아웃 시프트를 방지.

### 왜 popstate/pageshow가 아닌 Zustand 구독인가?

| 기준 | popstate/pageshow | Zustand 구독 |
|------|------------------|-------------|
| 이벤트 리스너 필요 | O (popstate + pageshow) | X (불필요) |
| 브라우저 호환성 이슈 | Safari BFCache 별도 처리 | 없음 |
| 재사용성 | 컴포넌트별 개별 구현 | 자동 (스토어 구독만으로) |
| 데이터 정합성 | localStorage ↔ UI 싱크 필요 | 항상 최신 (단일 소스) |
| 복잡도 | 중간 | 낮음 |

**핵심 인사이트**: 게임 상태는 이미 Zustand 스토어에 존재한다.
같은 데이터를 localStorage에서 **다시 읽을 이유가 없다**.
Zustand가 persist middleware로 localStorage 싱크를 자동 처리하므로,
컴포넌트는 스토어만 구독하면 된다.

## Consequences

### 긍정적

- **뒤로가기 문제 해결**: Zustand 싱글턴 → 네비게이션 간 상태 유지.
  popstate/pageshow 없이도 배너가 올바르게 표시됨.
- **코드 단순화**: localStorage 파싱 로직(`parseActiveGame`) 제거,
  subscribe/getSnapshot 함수 불필요.
- **레이아웃 안정성**: Skeleton UI로 하이드레이션 지연 시 CLS 방지.
- **단일 데이터 소스**: 스토어가 유일한 진실의 원천(Single Source of Truth).
  localStorage 데이터와 스토어 데이터 간 불일치 가능성 제거.

### 부정적

- **스토어 의존성 증가**: ContinueBanner가 `useGameStore`에 직접 의존.
  (단, 게임 앱 특성상 자연스러운 의존관계)
- **Skeleton 플래시**: 게임 진행 없이 첫 방문 시 Skeleton이 잠깐 보였다 사라짐.
  (< 50ms, 사실상 인지 불가)
