# ADR-402: 오프라인 클리어 기록 큐

## Status

Accepted

## Context

**로그인 사용자**가 오프라인에서 퍼즐을 클리어하면 `ClearModal`이 곧바로
`POST /api/game/clear`를 호출하고, 네트워크 실패로 **기록이 조용히 유실**됐다.

ADR-203의 게스트 기록 스토어는 이 경로를 잡지 못한다. 게스트 스토어는 정의상
비로그인 전용이고, 클리어 시점 분기가 `isAuthenticated`로 갈리기 때문에
로그인 사용자는 로컬 저장 경로 자체를 타지 않는다.

핵심 제약: `POST /api/game/clear`는 **append-only**다
(`prisma.gameRecord.create`, 멱등성 없음). 같은 기록을 두 번 보내면 행이 두 개 생긴다.
따라서 "로컬에도 저장하고 서버에도 보낸다" 식의 이중 경로는 쓸 수 없다.

## Decision

**Zustand persist 기반 localStorage 큐**(`sudoku-offline-clears`)에 미전송 기록을 쌓고,
온라인 복귀 시 순차 전송한다. 게스트 스토어와는 별도 스토어다.

### 1. 저장 경로는 상호배타적

`ClearModal`에서 로그인 사용자의 클리어는 정확히 한 경로만 탄다.

| 조건 | 처리 |
|------|------|
| `navigator.onLine === false` | 큐에 저장 (서버 호출 안 함) |
| 온라인 | 서버 저장 시도 → **`onError`일 때만** 큐로 폴백 |

이중 저장이 발생하지 않는 것이 이 설계의 요점이다.

### 2. flush

`useOfflineClearSync`가 **마운트 시 + `online` 이벤트**에 큐를 순차 전송한다.

- 인증 상태 + `navigator.onLine` 확인 후에만 시도
- 성공한 건만 dequeue, **첫 실패에서 중단**(미전송분 보존, 다음 기회에 재시도)
- `isFlushingRef` 가드로 동시 flush 방지
- 하나라도 성공하면 랭킹 쿼리 캐시 무효화

### 3. 큐 상한

최대 100건. 초과 시 가장 오래된 기록부터 버린다(폭주 방지).

## Consequences

**긍정적**

- 오프라인 클리어가 유실되지 않고, 새로고침·앱 종료 후에도 큐가 남는다
- 전송 트리거가 `online` 이벤트라 사용자가 아무것도 하지 않아도 동기화된다
- 이중 저장 불가 → append-only API와 안전하게 공존

**부정적 / 알려진 한계**

- **중복 행 가능(창이 매우 좁음).** POST가 성공했지만 dequeue 직전에 앱이 죽으면
  다음 flush에서 재전송된다. append-only라 중복은 무해한 잉여 행이지만 랭킹에는 보인다.
- **`completedAt`이 클리어 시각이 아니라 서버 저장 시각이다.**
  `GameClearRequest`에 `completedAt` 필드가 없어 서버가 `new Date()`로 채운다.
  즉 오프라인에서 푼 기록은 **온라인 복귀 시각**으로 기록된다.
- **flush가 transient/permanent 오류를 구분하지 않는다.** 모두 `break`이므로
  영구 4xx가 나는 기록 하나가 큐 전체를 막을 수 있다. 다만 큐에 들어가는 payload는
  이미 클리어를 통과한 정상 값이고, 서버 검증은 범위 체크(stage 1~50, clearTime,
  hintsUsed 0~3, stars 1~3)뿐이라 현재 규칙상 영구 400은 도달 불가하다.

### 업그레이드 경로

중복 행이 실제 문제가 되면 서버에 멱등 upsert를 추가한다. 단 위의 `completedAt` 제약 때문에
`(userId, stage, completedAt)`을 그대로 키로 쓸 수 없다 — **클라이언트가 생성한 큐 id를
요청에 실어 보내고 서버가 unique 제약으로 처리**하는 편이 확실하다.

## References

- ADR-203: 게스트(비로그인) 모드 설계
- ADR-204: GameRecord 스키마
- PR #63 — `feat/infra-offline-sync`
- `src/stores/offline-clear-store.ts`, `src/hooks/useOfflineClearSync.ts`, `src/components/game/ClearModal.tsx`
