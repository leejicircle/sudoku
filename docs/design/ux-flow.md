# 🖌 UX 플로우 (User Experience Flow)

> 스도쿠 웹앱의 전체 유저 여정을 정의한다.
> 모든 페이지 간 이동 경로, 인터랙션 분기, 상태 전환을 포함한다.

---

## 1. 전체 앱 구조 (Site Map)

```
/                    → 홈 (스테이지 선택)
/game?d={난이도}     → 게임 플레이
/ranking             → 랭킹
/login               → 로그인
```

> 단 4개 페이지로 구성. 미니멀한 구조로 사용자 혼란 최소화.

---

## 2. 전체 유저 여정 (Master Flow)

```mermaid
flowchart TD
    START([앱 진입]) --> HOME[🏠 홈 / 스테이지 선택]

    HOME -->|난이도 선택| GAME[🎮 게임 플레이]
    HOME -->|하단 탭: 랭킹| RANKING[🏆 랭킹]
    HOME -->|헤더: 로그인| LOGIN[🔑 로그인]

    GAME -->|퍼즐 완성| CLEAR_MODAL[🎉 클리어 모달]
    GAME -->|뒤로가기/홈| HOME
    GAME -->|일시정지| PAUSE_STATE[⏸ 일시정지 오버레이]

    CLEAR_MODAL -->|다음 스테이지| GAME
    CLEAR_MODAL -->|홈으로| HOME
    CLEAR_MODAL -->|랭킹 보기| RANKING

    RANKING -->|하단 탭: 홈| HOME
    RANKING -->|헤더: 로그인| LOGIN

    LOGIN -->|OAuth 완료| PREV_PAGE[이전 페이지로 복귀]
    LOGIN -->|뒤로가기| PREV_PAGE

    PAUSE_STATE -->|재개| GAME
    PAUSE_STATE -->|홈으로| HOME
```

---

## 3. 페이지별 상세 플로우

### 3.1 홈 (스테이지 선택) 플로우

```mermaid
flowchart TD
    ENTER([홈 진입]) --> CHECK_AUTH{로그인 상태?}

    CHECK_AUTH -->|Yes| SHOW_PROFILE[프로필 아이콘 표시]
    CHECK_AUTH -->|No| SHOW_LOGIN_BTN[로그인 버튼 표시]

    SHOW_PROFILE --> RENDER_HOME[홈 화면 렌더링]
    SHOW_LOGIN_BTN --> RENDER_HOME

    RENDER_HOME --> SHOW_DIFFICULTY[난이도 카드 4개 표시]

    SHOW_DIFFICULTY --> SELECT_DIFF{난이도 선택}
    SELECT_DIFF -->|쉬움| CHECK_LOCK_E{잠금 상태?}
    SELECT_DIFF -->|보통| CHECK_LOCK_M{잠금 상태?}
    SELECT_DIFF -->|어려움| CHECK_LOCK_H{잠금 상태?}
    SELECT_DIFF -->|전문가| CHECK_LOCK_X{잠금 상태?}

    CHECK_LOCK_E -->|해금| START_GAME([게임 시작])
    CHECK_LOCK_M -->|해금| START_GAME
    CHECK_LOCK_H -->|해금| START_GAME
    CHECK_LOCK_X -->|해금| START_GAME

    CHECK_LOCK_E -->|잠금| SHOW_LOCK_INFO[잠금 조건 팝오버]
    CHECK_LOCK_M -->|잠금| SHOW_LOCK_INFO
    CHECK_LOCK_H -->|잠금| SHOW_LOCK_INFO
    CHECK_LOCK_X -->|잠금| SHOW_LOCK_INFO

    SHOW_LOCK_INFO --> RENDER_HOME
```

**난이도별 해금 조건:**

| 난이도 | 해금 조건 | 기본 상태 |
|--------|----------|----------|
| 쉬움 (Easy) | 없음 (항상 해금) | 🔓 열림 |
| 보통 (Medium) | 쉬움 1스테이지 클리어 | 🔒 잠금 |
| 어려움 (Hard) | 보통 1스테이지 클리어 | 🔒 잠금 |
| 전문가 (Expert) | 어려움 1스테이지 클리어 | 🔒 잠금 |

---

### 3.2 게임 플레이 플로우

```mermaid
flowchart TD
    ENTER([게임 진입]) --> GEN_PUZZLE[퍼즐 생성/로드]
    GEN_PUZZLE --> RENDER_BOARD[보드 렌더링]
    RENDER_BOARD --> START_TIMER[타이머 시작]
    START_TIMER --> WAIT_INPUT[사용자 입력 대기]

    WAIT_INPUT -->|셀 탭| SELECT_CELL[셀 선택]
    WAIT_INPUT -->|숫자패드| INPUT_NUM{숫자 입력}
    WAIT_INPUT -->|도구 버튼| TOOL_ACTION{도구 선택}

    SELECT_CELL --> HIGHLIGHT[관련 셀 하이라이트]
    HIGHLIGHT --> WAIT_INPUT

    INPUT_NUM -->|빈 셀| VALIDATE{유효성 검사}
    INPUT_NUM -->|잠금 셀| SHOW_LOCK_POPOVER[잠금 안내 팝오버]

    VALIDATE -->|유효| PLACE_NUMBER[숫자 배치 + cell-pop 애니메이션]
    VALIDATE -->|무효| SHOW_ERROR[에러 표시 + shake 애니메이션]

    PLACE_NUMBER --> CHECK_UNIT{행/열/박스 완성?}
    CHECK_UNIT -->|Yes| FLASH_COMPLETE[완성 플래시 애니메이션]
    CHECK_UNIT -->|No| WAIT_INPUT

    FLASH_COMPLETE --> CHECK_BOARD{보드 전체 완성?}
    CHECK_BOARD -->|No| WAIT_INPUT
    CHECK_BOARD -->|Yes| STOP_TIMER[타이머 정지]
    STOP_TIMER --> CELEBRATE[보드 축하 애니메이션]
    CELEBRATE --> CLEAR_MODAL([🎉 클리어 모달])

    SHOW_ERROR --> WAIT_INPUT
    SHOW_LOCK_POPOVER --> WAIT_INPUT

    TOOL_ACTION -->|힌트| USE_HINT[힌트 제공]
    TOOL_ACTION -->|되돌리기| UNDO[마지막 입력 취소]
    TOOL_ACTION -->|지우기| ERASE[선택 셀 숫자 삭제]
    TOOL_ACTION -->|메모| TOGGLE_MEMO[메모 모드 전환]
    TOOL_ACTION -->|일시정지| PAUSE[보드 숨김 + 타이머 정지]

    USE_HINT --> WAIT_INPUT
    UNDO --> WAIT_INPUT
    ERASE --> WAIT_INPUT
    TOGGLE_MEMO --> MEMO_MODE[메모 모드 활성]
    MEMO_MODE --> WAIT_INPUT
    PAUSE --> RESUME{재개?}
    RESUME -->|Yes| WAIT_INPUT
    RESUME -->|홈으로| HOME([홈으로 이동])
```

---

### 3.3 메모 모드 플로우

```mermaid
flowchart TD
    MEMO_ON([메모 모드 활성화]) --> WAIT[입력 대기]
    WAIT -->|숫자 탭| CHECK_MEMO{해당 숫자 메모 있음?}
    CHECK_MEMO -->|No| ADD_MEMO[메모 추가 - 작은 숫자 표시]
    CHECK_MEMO -->|Yes| REMOVE_MEMO[메모 제거]
    ADD_MEMO --> WAIT
    REMOVE_MEMO --> WAIT
    WAIT -->|메모 버튼 재탭| MEMO_OFF([메모 모드 해제])
    WAIT -->|다른 도구| MEMO_OFF
```

**메모 표시 방식:**
- 셀 내부를 3×3 그리드로 분할
- 각 숫자(1-9)는 고정된 위치에 작은 글씨로 표시
- 해당 숫자를 실제로 입력하면 메모 자동 삭제

```
┌───────────┐
│ 1   2   3 │
│ 4   5   6 │
│ 7   8   9 │
└───────────┘
```

---

### 3.4 클리어 모달 플로우

```mermaid
flowchart TD
    OPEN([클리어 모달 표시]) --> SHOW_RESULT[결과 표시]

    SHOW_RESULT --> DISPLAY[표시 항목]
    DISPLAY --> D1[✅ 난이도]
    DISPLAY --> D2[⏱ 클리어 시간]
    DISPLAY --> D3[💡 힌트 사용 횟수]
    DISPLAY --> D4[⭐ 별점 평가 1~3]

    D1 --> ACTIONS[액션 버튼]
    D2 --> ACTIONS
    D3 --> ACTIONS
    D4 --> ACTIONS

    ACTIONS -->|다음 스테이지| CHECK_NEXT{다음 난이도 해금?}
    ACTIONS -->|홈으로| HOME([홈])
    ACTIONS -->|랭킹 보기| RANKING([랭킹])

    CHECK_NEXT -->|해금됨| NEXT_GAME([다음 게임 시작])
    CHECK_NEXT -->|새 난이도 해금!| UNLOCK_TOAST[해금 알림 토스트]
    UNLOCK_TOAST --> NEXT_GAME
```

**별점 평가 기준:**

| 별점 | 조건 |
|------|------|
| ⭐⭐⭐ | 힌트 0회 + 시간 기준 이내 |
| ⭐⭐ | 힌트 1~2회 또는 시간 초과 |
| ⭐ | 힌트 3회 이상 |

---

### 3.5 인증 플로우

```mermaid
flowchart TD
    TRIGGER([로그인 트리거]) --> LOGIN_PAGE[로그인 페이지]

    LOGIN_PAGE --> SELECT_PROVIDER{OAuth 선택}
    SELECT_PROVIDER -->|Google| GOOGLE_AUTH[Google OAuth]
    SELECT_PROVIDER -->|Naver| NAVER_AUTH[Naver OAuth]

    GOOGLE_AUTH --> AUTH_RESULT{인증 결과}
    NAVER_AUTH --> AUTH_RESULT

    AUTH_RESULT -->|성공| CREATE_SESSION[세션 생성]
    AUTH_RESULT -->|실패| SHOW_ERROR[에러 메시지]
    AUTH_RESULT -->|취소| LOGIN_PAGE

    CREATE_SESSION --> CHECK_USER{기존 사용자?}
    CHECK_USER -->|Yes| REDIRECT[이전 페이지로 복귀]
    CHECK_USER -->|No| CREATE_USER[신규 사용자 생성]
    CREATE_USER --> REDIRECT

    SHOW_ERROR --> LOGIN_PAGE
```

**인증이 필요한 시점:**
- 랭킹 등록 (게임 클리어 후)
- 게임 진행 기록 저장 (자동)
- 랭킹 페이지에서 "내 기록" 필터

> ⚠️ **게임 플레이 자체는 비로그인으로 가능**. 클리어 후 랭킹 등록 시점에만 로그인 유도.

---

### 3.6 랭킹 플로우

```mermaid
flowchart TD
    ENTER([랭킹 진입]) --> CHECK_AUTH{로그인 상태?}

    CHECK_AUTH -->|Yes| SHOW_MY_RANK[내 순위 하이라이트]
    CHECK_AUTH -->|No| SHOW_LOGIN_PROMPT[로그인 유도 배너]

    SHOW_MY_RANK --> RENDER_RANKING[랭킹 리스트 렌더링]
    SHOW_LOGIN_PROMPT --> RENDER_RANKING

    RENDER_RANKING --> FILTER_TABS[난이도 필터 탭]

    FILTER_TABS -->|쉬움| LOAD_EASY[쉬움 랭킹 로드]
    FILTER_TABS -->|보통| LOAD_MEDIUM[보통 랭킹 로드]
    FILTER_TABS -->|어려움| LOAD_HARD[어려움 랭킹 로드]
    FILTER_TABS -->|전문가| LOAD_EXPERT[전문가 랭킹 로드]

    LOAD_EASY --> DISPLAY_LIST[랭킹 리스트 표시]
    LOAD_MEDIUM --> DISPLAY_LIST
    LOAD_HARD --> DISPLAY_LIST
    LOAD_EXPERT --> DISPLAY_LIST

    DISPLAY_LIST --> SCROLL[스크롤 / 더보기]
    SCROLL -->|내 순위로| JUMP_MY[내 순위 위치로 스크롤]
```

**랭킹 표시 항목:**

| 순서 | 항목 | 설명 |
|------|------|------|
| 1 | 순위 | 1, 2, 3... (상위 3위 특별 표시) |
| 2 | 프로필 | 아바타 + 닉네임 |
| 3 | 클리어 시간 | MM:SS 형식 |
| 4 | 별점 | ⭐ 1~3개 |
| 5 | 날짜 | 클리어 일시 |

---

## 4. 네비게이션 구조

### 4.1 공통 레이아웃

```
┌─────────────────────────────────┐
│  Header (로고 / 뒤로가기 / 로그인)  │
├─────────────────────────────────┤
│                                 │
│         페이지 콘텐츠             │
│                                 │
├─────────────────────────────────┤
│  BottomNav (홈 / 랭킹)           │
└─────────────────────────────────┘
```

### 4.2 Header 분기

| 페이지 | 좌측 | 중앙 | 우측 |
|--------|------|------|------|
| 홈 | 로고 | — | 로그인/프로필 |
| 게임 | ← 뒤로 | 난이도 + 타이머 | 일시정지 |
| 랭킹 | 로고 | "랭킹" | 로그인/프로필 |
| 로그인 | ← 뒤로 | "로그인" | — |

### 4.3 BottomNav

| 탭 | 아이콘 | 표시 조건 |
|----|--------|----------|
| 홈 | `Home` | 항상 (게임 화면 제외) |
| 랭킹 | `Trophy` | 항상 (게임 화면 제외) |

> 🎮 **게임 화면에서는 BottomNav 숨김** — 숫자패드가 하단을 차지하므로.

---

## 5. 인터랙션 상태 전환 맵

### 5.1 셀 상태 전환

```mermaid
stateDiagram-v2
    [*] --> Empty : 게임 시작

    Empty --> Selected : 탭
    Selected --> Empty : 다른 셀 선택
    Selected --> Filled : 숫자 입력 (유효)
    Selected --> Error : 숫자 입력 (무효)
    Selected --> Memo : 메모 모드에서 입력

    Filled --> Selected : 재선택
    Filled --> Empty : 지우기

    Error --> Selected : 재선택
    Error --> Empty : 지우기
    Error --> Filled : 올바른 숫자 입력

    Memo --> Selected : 재선택
    Memo --> Filled : 일반 모드에서 숫자 입력
    Memo --> Empty : 지우기

    Given --> Given : 변경 불가 (탭 시 하이라이트만)
    Locked --> Locked : 잠금 팝오버 표시
```

### 5.2 게임 상태 전환

```mermaid
stateDiagram-v2
    [*] --> Loading : 게임 진입
    Loading --> Playing : 퍼즐 로드 완료
    Playing --> Paused : 일시정지
    Paused --> Playing : 재개
    Playing --> Completed : 퍼즐 완성
    Completed --> [*] : 홈/다음 게임
    Playing --> Abandoned : 홈으로 이탈
    Abandoned --> [*] : 홈
```

---

## 6. 에러 & 엣지 케이스

### 6.1 에러 처리 플로우

| 상황 | 처리 | UX |
|------|------|-----|
| 네트워크 오류 (랭킹 로드) | 재시도 버튼 | "연결에 실패했습니다. 다시 시도해주세요." |
| OAuth 실패 | 로그인 페이지 유지 | "로그인에 실패했습니다. 다시 시도해주세요." |
| 세션 만료 | 자동 로그아웃 | 토스트: "세션이 만료되었습니다." |
| 퍼즐 생성 실패 | 재생성 시도 | 로딩 스피너 유지 → 3회 실패 시 에러 화면 |

### 6.2 엣지 케이스

| 상황 | 처리 |
|------|------|
| 게임 중 새로고침 | 로컬 스토리지에서 진행 상태 복원 |
| 게임 중 브라우저 닫기 | 다음 접속 시 이어하기 제안 |
| 같은 퍼즐 재도전 | 기록 초기화, 새 타이머 시작 |
| 모든 힌트 소진 | 힌트 버튼 비활성화 (최대 3회) |
| 오프라인 모드 | 게임 플레이 가능, 랭킹 저장 보류 → 온라인 복귀 시 동기화 |

---

## 7. 화면 전환 애니메이션

| 전환 | 애니메이션 | Duration |
|------|-----------|----------|
| 페이지 → 페이지 | Fade (opacity 0→1) | 200ms |
| 모달 표시 | Slide up + Fade | 300ms |
| 모달 닫기 | Slide down + Fade | 200ms |
| 팝오버 표시 | Scale(0.96→1) + Fade | 200ms |
| 토스트 표시 | Slide down from top | 300ms |
| 토스트 사라짐 | Slide up + Fade | 200ms |

---

## 8. 접근성 (A11y) 플로우

### 8.1 키보드 네비게이션

| 키 | 동작 |
|----|------|
| `←` `→` `↑` `↓` | 보드 내 셀 이동 |
| `1` ~ `9` | 선택된 셀에 숫자 입력 |
| `Backspace` / `Delete` | 선택된 셀 숫자 삭제 |
| `Tab` | 다음 인터랙티브 요소로 이동 |
| `Escape` | 모달/팝오버 닫기 |
| `Space` / `Enter` | 버튼 활성화 |

### 8.2 스크린 리더

| 요소 | aria-label 예시 |
|------|----------------|
| 셀 (빈) | "3행 5열, 비어있음" |
| 셀 (숫자) | "3행 5열, 값 7" |
| 셀 (에러) | "3행 5열, 값 7, 오류" |
| 셀 (잠금) | "3행 5열, 잠김" |
| 숫자패드 | "숫자 5 입력" |
| 힌트 버튼 | "힌트 사용, 남은 횟수 2" |
| 타이머 | "경과 시간 3분 24초" |
