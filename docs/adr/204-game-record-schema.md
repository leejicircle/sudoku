# ADR-204: GameRecord 스키마 설계

## Status

Accepted

## Context

Epic #6 랭킹 시스템의 핵심 데이터 모델인 **게임 클리어 기록(GameRecord)**의 스키마를 설계한다.

### 요구사항

1. 로그인 사용자의 게임 클리어 기록을 영구 저장
2. 스테이지별 랭킹(최단 시간) 조회를 효율적으로 지원
3. 사용자별 기록 이력 관리 (같은 스테이지 복수 기록 허용)
4. 게스트 동기화 API(`POST /api/game/sync`)의 DB 저장 연결

### 기존 구조

- ADR-203에서 게스트 기록은 클라이언트 `GuestGameRecord` 타입으로 정의
- `/api/game/sync` 라우트가 유효성 검증만 수행하고 DB 저장은 TODO로 남겨둠
- 필드: `stage(1~50)`, `clearTime(초)`, `hintsUsed(0~3)`, `stars(1~3)`, `completedAt`

## Decision

### 1. GameRecord 모델

```prisma
model GameRecord {
  id          String   @id @default(cuid())
  userId      String
  stage       Int      @db.SmallInt   // 1~50
  clearTime   Int                     // 클리어 시간 (초)
  hintsUsed   Int      @db.SmallInt   // 0~3
  stars       Int      @db.SmallInt   // 1~3
  completedAt DateTime               // 실제 클리어 일시

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([stage, clearTime])
  @@index([userId, stage])
  @@map("game_records")
}
```

### 2. 설계 결정 사항

#### 복수 기록 허용

같은 사용자가 같은 스테이지를 여러 번 클리어할 수 있다. `@@unique([userId, stage])` 제약을 두지 않음.

- 랭킹 조회 시 사용자별 최고 기록을 쿼리로 추출
- 기록 이력 확인, 성장 추적 등 확장 가능

#### 인덱스 전략

| 인덱스 | 용도 |
|--------|------|
| `[userId]` | 사용자별 전체 기록 조회 |
| `[stage, clearTime]` | 스테이지별 랭킹 (최단 시간 정렬) |
| `[userId, stage]` | 사용자의 특정 스테이지 기록 조회 |

#### SmallInt 사용

`stage`, `hintsUsed`, `stars`는 값 범위가 작으므로 `@db.SmallInt`로 저장 공간 최적화.

### 3. 동기화 API 연결

`/api/game/sync` 라우트에서 검증 통과한 기록을 `prisma.gameRecord.createMany()`로 일괄 저장.
저장 성공 시 결과 상태를 `pending` → `synced`로 전환.

## Consequences

### 긍정적

- 스테이지별 랭킹 쿼리가 `[stage, clearTime]` 인덱스로 최적화됨
- 복수 기록 허용으로 사용자 이력 추적, 통계 분석 등 향후 확장 가능
- 게스트 동기화 → DB 저장 파이프라인이 완성됨

### 고려사항

- 기록이 누적되면 랭킹 쿼리에서 사용자별 최고 기록 추출 비용 발생
  → 데이터 규모에 따라 Materialized View 또는 별도 BestRecord 테이블 도입 검토
- 현재는 서버 사이드 유효성 검증(범위 체크)만 수행
  → 치팅 방지를 위한 추가 검증은 별도 이슈로 관리
