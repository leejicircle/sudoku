# ADR-102: 스도쿠 보드 컴포넌트 설계

## 상태
승인됨 (Accepted)

## 날짜
2026-03-31

## 컨텍스트

Epic #5 게임 UI의 핵심인 9×9 스도쿠 보드를 구현해야 한다.
디자인 명세(`game.md`, `cell-states.md`)와 엔진의 `gameStore`가 완성된 상태.

### 고려 사항
1. 셀 10가지 시각 상태(default, given, filled, selected, highlighted, same-number, error, locked, completed, memo)를 표현해야 함
2. 상태 중첩 시 우선순위 기반 배경색 결정 필요
3. 반응형 셀 크기 (40px → 48px → 56px)
4. 키보드 네비게이션 (방향키 이동, 1~9 입력, Backspace 삭제)
5. 81개 셀의 렌더링 성능 최적화 필요
6. 3×3 박스 구분선(두꺼운 선) vs 셀 간 구분선(얇은 선) 표현

### 선택지
- **A) CSS Grid + gap 기반**: grid-template으로 박스/셀 간격을 구분
- **B) border 기반**: 각 셀에 border를 적용, 위치별로 두께 변경
- **C) 중첩 그리드**: 3×3 박스 9개 안에 3×3 셀 그리드

## 결정

**선택지 B — border 기반 단일 그리드**

### 이유
1. 셀별 border 두께 제어로 박스/셀 구분선을 정밀하게 표현
2. CSS 변수(`--board-gap-thin`, `--board-gap-thick`)와 직접 매핑
3. 81개 셀 flat 구조로 키보드 네비게이션 로직 단순화
4. 외곽 border는 보드 컨테이너에서 처리하여 관심사 분리

## 구현 상세

### 파일 구조
```
src/components/game/
├── Board.tsx     # 9×9 보드 컨테이너 + 키보드 네비게이션
├── Cell.tsx      # 개별 셀 (상태 기반 스타일 + 메모 그리드)
└── index.ts      # 배럴 export
```

### 셀 상태 우선순위 (배경색)
1. selected → `--cell-selected`
2. error → `--cell-error`
3. same-number → `--cell-same-number`
4. highlighted → `--cell-highlighted`
5. locked → `--cell-locked`
6. given → `--cell-given`
7. default → `--cell-default`

### 성능 최적화
- Cell 컴포넌트: `React.memo`로 래핑, props 변경 시만 리렌더
- 배경/텍스트/보더 클래스: `useMemo`로 계산
- 이벤트 핸들러: `useCallback`으로 참조 안정화
- gameStore: selector 기반 구독으로 필요한 상태만 소비

### 키보드 네비게이션
- 방향키: 셀 이동 (순환: 0→8→0)
- 1~9: 숫자 입력 (메모 모드 시 메모 토글)
- Backspace/Delete: 셀 값 삭제
- window 레벨 이벤트 리스너로 포커스 관리

### 접근성
- Board: `role="grid"`, `aria-label="스도쿠 보드"`
- Row: `role="row"`
- Cell: `role="gridcell"`, `aria-label`, `aria-selected`, `aria-invalid`
- 선택된 셀만 `tabIndex=0`, 나머지 `-1` (roving tabindex)

## 영향
- gameStore의 `selectCell`, `setValue`, `clearValue`, `toggleNote` 액션 직접 소비
- 향후 NumberPad는 같은 gameStore 액션을 호출하여 보드와 연동
