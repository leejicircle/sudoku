# ADR-203: 게스트(비로그인) 모드 설계

## Status

Accepted

## Context

스도쿠 앱은 비로그인(게스트) 상태에서도 게임 플레이가 가능해야 한다.
ADR-202에서 "모든 페이지 공개, API만 개별 검증" 전략을 결정했으므로,
이제 게스트의 **게임 기록 저장**과 **로그인 전환 시 동기화** 방안을 구체화한다.

### 요구사항

1. 게스트도 게임 클리어 후 기록(시간, 힌트, 별점)을 볼 수 있어야 한다
2. 게스트 기록은 로그인 없이 기기에 보관되어야 한다
3. 게스트가 나중에 로그인하면 기존 기록을 서버로 이전할 수 있어야 한다
4. 서버에 유효하지 않은 기록이 저장되지 않도록 검증해야 한다

## Decision

### 1. 게스트 기록 로컬 저장

게스트 클리어 기록은 **별도의 Zustand persist 스토어**로 관리한다.

```
localStorage['sudoku-guest-records'] = {
  records: GuestGameRecord[]
}
```

기존 `sudoku-game` 스토어(진행 중인 게임 상태)와 분리하여
클리어 "결과" 기록만 별도로 보관한다.

**이유:**
- 게임 상태(board, solution 등)는 진행 중에만 필요
- 클리어 기록은 히스토리로서 누적 보관이 필요
- 관심사 분리: 게임 진행 vs. 기록 보관

### 2. 기록 저장 분기

클리어 시점에서 인증 상태에 따라 처리를 분기한다:

| 상태 | 처리 |
|------|------|
| 로그인 | API로 서버에 직접 저장 (Epic #6) |
| 게스트 | 로컬 스토어에 저장 |

ClearModal에서 `useAuth().isAuthenticated`로 분기한다.

### 3. 로그인 전환 동기화

게스트 → 로그인 전환 시 동기화 플로우:

```
1. 로그인 완료 감지 (useSession status 변경)
2. 로컬에 게스트 기록이 있는지 확인
3. POST /api/game/sync로 일괄 전송
4. 서버 유효성 검증 + 중복 체크
5. 성공 시 로컬 기록 삭제
```

### 4. 서버 유효성 검증

동기화 API에서 각 기록을 검증한다:

- `stage`: 1~50 정수
- `clearTime`: 1~36,000초 (10시간 상한)
- `hintsUsed`: 0~3 정수
- `stars`: 1~3 정수
- `completedAt`: 유효한 ISO 8601, 미래 날짜 불가

유효하지 않은 건은 스킵하고 개별 결과를 응답한다.

### 5. API 설계

```
POST /api/game/sync
Authorization: 필수 (Auth.js session)

Request:
{
  "records": [
    {
      "id": "uuid",
      "stage": 1,
      "clearTime": 245,
      "hintsUsed": 1,
      "stars": 2,
      "completedAt": "2026-04-01T12:00:00.000Z"
    }
  ]
}

Response (200):
{
  "success": true,
  "data": {
    "total": 1,
    "synced": 1,
    "duplicates": 0,
    "invalid": 0,
    "results": [
      { "guestRecordId": "uuid", "status": "synced" }
    ]
  }
}
```

### 6. 저장 제한

- 게스트 기록 최대 200건 (FIFO — 초과 시 오래된 것 삭제)
- 동기화 1회 요청 최대 200건

## Consequences

**긍정적**
- 게스트도 클리어 기록을 확인할 수 있어 사용자 경험 향상
- 로그인 유도 자연스러운 동선 (기록 영구 보관 → 로그인 유도)
- 서버 검증으로 조작된 기록 유입 방지
- 로컬/서버 스토어 분리로 관심사 명확

**부정적**
- 게스트 기록은 기기별이므로 다른 기기에서는 볼 수 없음
- localStorage 용량 한계 (실질적으로 문제 없음 — 200건 약 40KB)
- Epic #6 GameRecord 스키마 완성 전까지 동기화 API가 DB 저장을 수행하지 않음
  (유효성 검증만 수행, DB 저장은 TODO로 남겨둠)

## References

- ADR-202: Auth.js v5 상세 설정
- Epic #4: 인증 시스템 — feat/api-guest-mode
- Epic #6: 랭킹 시스템 — GameRecord 스키마 연계 예정
