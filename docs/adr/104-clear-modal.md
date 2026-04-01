# ADR-104: 클리어 결과 모달 설계

## 상태
승인됨 (Accepted)

## 날짜
2026-04-01

## 컨텍스트

퍼즐 완성 시 결과를 보여주는 클리어 모달을 구현해야 한다.
디자인 명세(`docs/design/clear-modal.md`)가 상세한 레이아웃, 애니메이션 타임라인,
접근성 요구사항을 정의하고 있다.

### 고려 사항
1. 기존 `@base-ui/react` Dialog 컴포넌트를 래핑할지, 커스텀 구현할지
2. ~1.7초에 걸친 스태거(stagger) 애니메이션 제어 방식
3. 배경 클릭으로 닫히지 않는 강제 확인 UX
4. 포커스 트랩 + ESC 키 처리
5. 인증 상태에 따른 랭킹 버튼 분기

### 선택지
- **A) base-ui Dialog 래핑**: `DialogContent`/`DialogOverlay` 활용
- **B) 커스텀 fixed 오버레이**: PauseOverlay 패턴과 동일하게 직접 구현

## 결정

**선택지 B — 커스텀 fixed 오버레이**

### 이유
1. 디자인 명세의 스태거 애니메이션 타임라인(7단계, 각기 다른 딜레이)을 정밀 제어 필요
2. 배경 클릭 무시(결과 확인 강제)는 Dialog의 기본 닫기 동작과 충돌
3. 배경색(`oklch(0 0 0 / 0.5)`)과 blur(4px)가 기존 Dialog 오버레이와 다름
4. PauseOverlay와 동일한 `fixed inset-0` 패턴으로 코드베이스 일관성 유지

## 구현 상세

### 파일 구조
```
src/components/game/ClearModal.tsx  — 메인 컴포넌트
src/app/globals.css                 — 키프레임 추가 (bounce-in, star-scale-in 등)
src/app/game/GameContent.tsx        — 통합 (PauseOverlay 다음에 배치)
```

### 애니메이션 전략
CSS `animation` 속성에 `fill-mode: both`와 개별 `animation-delay`를 인라인 스타일로 지정.
Tailwind 클래스 대신 인라인을 사용하는 이유: 7개 요소에 각기 다른 딜레이(300~1500ms)를
적용해야 하므로 유틸리티 클래스로는 표현이 불가능.

### 키프레임 (globals.css에 추가)
| 키프레임 | 용도 | 시간 |
|----------|------|------|
| `clear-fade-in` | 범용 opacity 0→1 | 200~300ms |
| `bounce-in` | 축하 아이콘 scale 0→1.2→1 | 500ms |
| `star-scale-in` | 별 순차 등장 scale 0→1 | 200ms |
| `slide-down-fade` | 해금 배너 등장 | 300ms |
| `modal-enter` | 모달 컨테이너 (기존) | 300ms |

### 별점 로직
| 별점 | 조건 |
|------|------|
| 3별 | hintsUsed === 0 AND 기준 시간 이내 |
| 2별 | hintsUsed 1~2 OR 시간 초과 |
| 1별 | hintsUsed >= 3 |

### 해금 배너
스테이지 구간의 마지막 스테이지(10, 20, 30, 40) 클리어 시
다음 난이도 해금 알림을 표시.

### 접근성
- `role="dialog"`, `aria-modal="true"`, `aria-label`
- Tab 포커스 트랩 (모달 내부 순환)
- ESC 키 → 홈으로 이동
- 초기 포커스: "다음 스테이지" 버튼 (애니메이션 완료 후)
- `aria-live="polite"` on 결과 카드

### 반응형
| 브레이크포인트 | 동작 |
|---------------|------|
| < 375px | 너비 `100vw - 32px`, 패딩 축소 |
| 375~767px | 기본 (max-width 360px) |
| >= 768px | max-width 420px, 패딩 확대 |

## 의존성
- `useGameStore`: isComplete, timer, stage, hintsUsed, initGame
- `useAuth`: isAuthenticated (랭킹 버튼 분기)
- `formatTime` (Timer.tsx 재사용)
- `STAGE_RANGES` (game.ts)
