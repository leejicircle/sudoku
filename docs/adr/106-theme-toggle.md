# ADR-106: 라이트/다크 테마 전환

## Status

Accepted

## Context

`globals.css`에는 `:root`(라이트)와 `.dark`(다크) 토큰 세트가 처음부터 정의되어 있었으나,
**`dark` 클래스를 `<html>`에 붙이는 코드가 어디에도 없었다.** 테마 라이브러리도,
`prefers-color-scheme` 매핑도 없었으므로 다크 토큰은 정의만 되고 도달 불가능한 상태였다.

페이퍼/퍼즐북 톤 재정립(PR #69, `docs/design/design-system.md`)에서 다크 모드를
"흰 종이의 반전"이 아니라 **갱지/흑지**로 재해석하며 토큰을 정교하게 다듬었는데,
활성화 경로가 없으면 그 작업이 화면에 나오지 않는다.

함께 드러난 문제가 하나 더 있었다. `viewport.themeColor`가 `#15120f`(어두운 갈색)로
고정되어 있는데 앱은 오프화이트 종이로 렌더된다. themeColor는 모바일 브라우저 상단 크롬과
**설치된 PWA의 상태바** 색을 정하므로, 오프화이트 지면 위에 검은 띠가 붙었다.

## Decision

**테마 라이브러리 없이 직접 구현하고, 전환 버튼을 헤더에 추가한다.**

### 1. `next-themes` 미도입

App Router에서 표준 선택지지만, 실제로 필요한 것은 세 가지뿐이었다.

- `<html>`에 클래스 토글
- 선택을 localStorage에 저장
- 첫 페인트 전 적용(FOUC 방지)

인라인 스크립트 7줄 + 훅 하나로 해결되는 범위라 의존성을 추가하지 않았다.
PWA라 번들 크기가 성능 예산에 직결된다는 점도 근거다(Lighthouse Performance 99).

### 2. FOUC 방지 — `<head>`의 blocking 인라인 스크립트

`THEME_INIT_SCRIPT`(`src/lib/theme.ts`)를 `layout.tsx`의 `<head>`에 주입해
**첫 페인트 전에** `dark` 클래스와 `theme-color` meta를 확정한다.
저장된 선택이 없으면 시스템 설정을 따른다.

이게 없으면 새로고침 때 라이트가 번쩍였다가 다크로 바뀐다.

**대가**: 서버가 렌더한 HTML과 클라이언트의 `<html>` 속성이 달라지므로
`suppressHydrationWarning`이 필요하다. 스크립트가 의도적으로 만드는 불일치이므로
경고를 끄는 것이 맞지만, `<html>` 요소에만 한정해서 적용한다.

### 3. 상태 관리 — `useSyncExternalStore` (`useEffect` + `useState` 아님)

**테마의 진짜 출처는 DOM(`<html class="dark">`)이지 React state가 아니다.**
state로 복사해두면 초기화 스크립트가 심은 값, 토글이 바꾼 값과 어긋날 수 있다.

`MutationObserver`로 `<html>`의 class 변화를 구독하고,
서버 스냅샷은 `false`로 두어 하이드레이션을 일치시킨다.

```
subscribe:          MutationObserver(attributeFilter: ["class"])
getSnapshot:        document.documentElement.classList.contains("dark")
getServerSnapshot:  () => false
```

처음에는 `useEffect` + `setState`로 구현했다가 CI에서
`react-hooks/set-state-in-effect` 린트 에러로 실패했다. 규칙을 억제하는 대신
근본 해결로 교체했고, 결과적으로 렌더가 한 번 줄고(`false` → effect → `setState` → 재렌더)
`aria-label`/`aria-pressed`가 DOM을 정확히 따라가게 됐다.

이 패턴은 이 저장소에서 처음이 아니다 — ADR-103이 같은 훅으로 Zustand 하이드레이션을
구독한다. 이번엔 구독 대상이 스토어가 아니라 DOM이라는 점만 다르다.

### 4. 2단계 토글 (system/light/dark 3단계 아님)

첫 방문은 시스템 설정을 따르고, 사용자가 한 번 누르면 그 선택이 localStorage에 남아
이후 유지된다. 명시적 "시스템" 옵션은 과설계라 넣지 않았다.

배치는 홈·랭킹·로그인 헤더 우측. **게임 화면은 제외**했는데,
해당 헤더의 우측 슬롯을 타이머가 쓰고 있고 플레이 중 테마 전환 수요가 낮다고 봤다.

### 5. themeColor / manifest 색 통일

`--background`의 oklch를 sRGB hex로 변환한 값을 단일 출처(`THEME_COLOR`)로 두고
`viewport.themeColor`, `manifest.ts`의 `theme_color`/`background_color`가 함께 참조한다.

| 테마 | `--background` | hex |
|---|---|---|
| light | `oklch(0.968 0.008 85)` | `#f7f4ee` |
| dark | `oklch(0.185 0.008 70)` | `#15120f` |

토글 시 `<meta name="theme-color">`도 함께 갱신한다(`syncThemeColorMeta`).
이걸 빠뜨리면 수동으로 다크로 바꿔도 상태바만 라이트 색으로 남는다.

`viewport.themeColor`를 미디어쿼리 배열 형식으로 두는 방법도 있으나,
그건 **시스템 설정**을 따를 뿐 수동 토글을 반영하지 못하므로 단일 값 + 런타임 갱신을 택했다.

## Consequences

### 긍정적

- 다크 토큰이 비로소 실제로 쓰인다. 페이퍼 톤의 갱지/흑지 해석이 화면에 나온다.
- 모바일 상단 크롬·PWA 상태바가 지면 색과 이어진다.
- 의존성 0. 테마 로직 전체가 `src/lib/theme.ts` + `ThemeToggle.tsx` 두 파일에 있다.
- DOM을 구독하므로 누가 클래스를 바꾸든(초기화 스크립트, 토글, 확장 프로그램) UI가 따라온다.

### 부정적 / 알려진 한계

- **`<html>`에 `suppressHydrationWarning`이 걸린다.** 의도된 불일치를 감추는 대가로,
  이 요소에 한해 다른 하이드레이션 버그도 조용해진다.
- **인라인 스크립트가 CSP를 제약한다.** 지금은 CSP를 설정하지 않아 문제가 없지만,
  도입 시 이 스크립트에 nonce나 hash가 필요하다.
- **게임 화면에서는 전환할 수 없다.** 우측 슬롯 충돌을 피한 선택이며,
  필요해지면 툴바나 일시정지 오버레이에 배치하는 것이 후보다.
- localStorage 접근이 실패하는 환경(Safari 프라이빗 모드 등)에서는 저장이 안 되고
  세션 내 전환만 유효하다. `try/catch`로 삼켜서 전환 자체는 동작하게 했다.

### 검증

`__tests__/theme/theme-init.test.ts`가 초기화 스크립트의 세 갈래
(저장값이 시스템 설정보다 우선 / 저장값 없으면 시스템 설정 / 저장소 접근 실패)를 검증한다.
스크립트는 첫 페인트 전에 실행되어 브라우저에서 눈으로 잡기 어렵기 때문이다.

## References

- ADR-100: 디자인 시스템 (토큰 체계)
- ADR-103: ContinueBanner 하이드레이션 — 같은 `useSyncExternalStore` 패턴, 구독 대상만 다름
- PR #69 — `feat/ui-paper-tone`
- `docs/design/design-system.md` — 페이퍼 톤 토큰 정의(라이트/다크)
- `src/lib/theme.ts`, `src/components/layout/ThemeToggle.tsx`, `src/app/layout.tsx`

### 관련 미해결 이슈

- `globals.css`의 `--font-sans: var(--font-sans)` 자기 참조로 값이 비어 있어
  `font-sans`가 Noto Sans KR로 떨어진다. 테마와 직접 관련은 없으나 같은 파일의 기존 버그다.
