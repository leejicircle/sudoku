# ADR-200: Prisma + Supabase PostgreSQL 데이터베이스 구성

## Status

Accepted

## Context

스도쿠 웹앱은 사용자 인증(Auth.js v5), 게임 기록 저장, 랭킹 시스템을 위해 관계형 데이터베이스가 필요하다.
ORM 선택과 호스팅 서비스를 결정해야 한다.

## Decision

- **ORM**: Prisma 6.x 사용
  - TypeScript와의 타입 안전성이 뛰어남
  - Auth.js v5 공식 어댑터 지원 (`@auth/prisma-adapter`)
  - 선언적 스키마 + 자동 마이그레이션 제공
- **DB 호스팅**: Supabase PostgreSQL 사용
  - 무료 티어로 개인 프로젝트에 적합
  - Connection Pooling(PgBouncer) 내장으로 서버리스 환경 호환
  - `DATABASE_URL` (pooling, port 6543)과 `DIRECT_URL` (direct, port 5432) 이중 연결 구성
- **Prisma Client**: 싱글톤 패턴으로 `src/lib/prisma.ts`에서 관리
  - 개발 환경에서 Hot Reload 시 연결 누수 방지

## Consequences

**긍정적**
- Prisma가 생성하는 타입을 앱 전체에서 재사용 가능
- 스키마 변경 이력이 마이그레이션 파일로 추적됨
- Supabase 대시보드로 데이터 직접 확인 가능

**부정적**
- Supabase 무료 티어의 연결 수 제한 (최대 60개)
- Prisma의 raw query 사용 시 타입 안전성 상실 (사용 지양)
