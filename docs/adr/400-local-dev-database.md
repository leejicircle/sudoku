# ADR-400: 개발 DB를 로컬 Docker Postgres로 분리

## Status

Accepted

## Context

Supabase로부터 "프로젝트의 디스크 I/O 예산이 부족합니다" 경고를 받았다 (project ref `ckuvhkckcqcoudgqjgis`, ap-northeast-2, Postgres 17). 원인 조사 결과 흔한 후보들은 모두 배제됐다.

- **앱 트래픽 아님** — 지난 24시간 실제 인증 클라이언트 연결 32건 (supavisor_logs 실측)
- **데이터량 아님** — DB 전체가 `prisma/backup-2026-09-09.json` 기준 13KB 수준
- **인덱스 누락 아님** — `game_records`에 `@@unique([userId, stage])`, `@@index([stage, clearTime])`가 있고 랭킹 쿼리를 커버함
- **CI/빌드 아님** — `build`는 `prisma generate && next build`뿐이고, `.github/workflows/ci.yml`의 prisma 스텝은 주석 처리 상태
- pgbouncer_logs 8,915줄은 전부 Supabase 자체 헬스체크(`pgbouncer@127.0.0.1`) 노이즈

실제 원인은 **로컬 개발 환경 전체가 프로덕션 클라우드 DB를 직접 쓰고 있었다**는 것이다.

- 로컬 Postgres가 없었다 (`supabase/` 디렉토리도, docker 설정도 없음)
- `.env`의 `DATABASE_URL`(pooler:6543)과 `DIRECT_URL`(session:5432)이 둘 다 프로덕션 인스턴스를 가리킴
- 에이전트 워크트리 2개가 각각 `pnpm dev` / `db:migrate` / `db:studio` / `vitest`를 프로덕션 DB에 실행
- 결정타는 `pnpm db:migrate`(= `prisma migrate dev`)다. 실행할 때마다 같은 인스턴스에 shadow DB를 생성했다 삭제하는데, template DB를 통째로 복사한 뒤 드롭하는 동작이라 Free tier IO 버짓을 한 번에 크게 깎는다.

조사 시점에는 이미 쓰로틀링에 걸려 `select 1`조차 연결 타임아웃이 반복되는 상태였다.

## Decision

1. **개발용 Postgres를 로컬 Docker로 띄운다.** `docker-compose.yml`에 `postgres:17` 서비스 하나 (`sudoku/sudoku/sudoku`, 5432, 명명 볼륨 `pgdata`). Supabase CLI 스택은 도입하지 않는다 — 필요한 건 Postgres 하나뿐이다.
2. **`.env.example`의 기본값을 로컬 URL로 바꾼다.** 클라우드 접속 문자열은 "배포/프리뷰 전용" 경고와 함께 별도 섹션에 두고, 로컬 `.env`가 아니라 Vercel 환경변수에 설정한다.
3. **스크립트에 대상 DB를 명시한다.** `db:migrate` · `db:push` · `db:studio`는 로컬 전용임을 `//key` 주석 필드로 못 박고, 클라우드 스키마 반영용으로 `db:deploy`(= `prisma migrate deploy`)를 추가한다. `migrate deploy`는 shadow DB를 만들지 않으므로 IO 비용이 사실상 없다.
4. Prisma 스키마는 그대로 둔다. `url` / `directUrl`이 이미 환경변수 기반이라 접속 문자열만 바꾸면 된다.

## Consequences

**긍정적**

- 개발·테스트·마이그레이션 IO가 클라우드에서 완전히 빠져, Free tier 버짓은 실제 배포 트래픽에만 쓰인다.
- 워크트리를 몇 개 띄우든 서로의 DB를 오염시키지 않는다. 마이그레이션 실패나 시드 데이터 실험이 프로덕션에 닿지 않는다.
- 오프라인에서도 개발이 된다.

**부정적 / 트레이드오프**

- 개발자(및 에이전트)가 Docker를 실행해야 한다. `docker compose up -d db`가 한 단계 늘어난다.
- 로컬과 클라우드 스키마가 갈릴 수 있다. 클라우드 반영은 `pnpm db:deploy` 한 경로로만 하도록 강제해서 완화한다.
- 로컬 DB는 비어 있으므로 실데이터가 필요하면 별도 시드가 필요하다.
- 스크립트의 `//key` 주석은 컨벤션일 뿐 강제력이 없다. 실수로 클라우드 URL에 `migrate dev`를 돌리는 것을 기술적으로 막지는 못한다.
