import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useGameStore,
  serializeCell,
  deserializeCell,
  serializeBoard,
  deserializeBoard,
  serializeHistory,
  deserializeHistory,
} from '@/stores/game-store';
import type { Digit, SolutionGrid, Grid, Cell } from '@/types/game';

// ─── 헬퍼 ──────────────────────────────────────────

const SOLUTION: SolutionGrid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

/**
 * generatePuzzle을 모킹하여 고정된 퍼즐과 솔루션을 반환하도록 설정.
 * 빈 위치 3개: (0,0)=5, (0,1)=3, (4,4)=5
 */
const EMPTY_POSITIONS: [number, number][] = [[0, 0], [0, 1], [4, 4]];

const createMockPuzzle = (): Grid => {
  const puzzle: Grid = SOLUTION.map((row) => row.map((v) => v as Digit | null));
  for (const [r, c] of EMPTY_POSITIONS) {
    puzzle[r][c] = null;
  }
  return puzzle;
};

// generatePuzzle 모킹
vi.mock('@/lib/sudoku/difficulty', () => ({
  generatePuzzle: vi.fn(() => ({
    puzzle: createMockPuzzle(),
    solution: SOLUTION,
    config: {
      stage: 1,
      emptyCells: 3,
      lockedCellCount: 0,
      allowedLockTypes: [],
      allowChainLocks: false,
    },
    lockedCells: [],
  })),
}));

// ─── 스토어 초기화 ──────────────────────────────────

beforeEach(() => {
  // 스토어 초기화 (persist 상태 포함)
  useGameStore.setState({
    board: [],
    solution: [] as unknown as SolutionGrid,
    stage: 0,
    config: null,
    lockedCells: [],
    selectedCell: null,
    isNoteMode: false,
    timer: 0,
    isPaused: false,
    history: [],
    isStarted: false,
    isComplete: false,
  });
});

// ─── initGame ───────────────────────────────────────

describe('initGame', () => {
  it('스테이지로 게임을 초기화한다', () => {
    const { initGame } = useGameStore.getState();
    initGame(1);

    const state = useGameStore.getState();
    expect(state.isStarted).toBe(true);
    expect(state.stage).toBe(1);
    expect(state.board.length).toBe(9);
    expect(state.board[0].length).toBe(9);
    expect(state.timer).toBe(0);
    expect(state.isComplete).toBe(false);
    expect(state.history).toHaveLength(0);
  });

  it('빈 셀은 value=null, isGiven=false', () => {
    useGameStore.getState().initGame(1);
    const { board } = useGameStore.getState();

    expect(board[0][0].value).toBeNull();
    expect(board[0][0].isGiven).toBe(false);
  });

  it('주어진 셀은 isGiven=true', () => {
    useGameStore.getState().initGame(1);
    const { board } = useGameStore.getState();

    // (0,2)는 빈 위치가 아니므로 given
    expect(board[0][2].value).toBe(4);
    expect(board[0][2].isGiven).toBe(true);
  });
});

// ─── setValue ────────────────────────────────────────

describe('setValue', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('빈 셀에 숫자를 입력한다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    const { board } = useGameStore.getState();

    expect(board[0][0].value).toBe(5);
  });

  it('given 셀은 변경할 수 없다', () => {
    useGameStore.getState().setValue(0, 2, 9); // (0,2)는 given
    const { board } = useGameStore.getState();

    expect(board[0][2].value).toBe(4); // 원래 값 유지
  });

  it('히스토리에 이전 상태가 저장된다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    const { history } = useGameStore.getState();

    expect(history).toHaveLength(1);
    expect(history[0].board[0][0].value).toBeNull(); // 이전 상태
  });

  it('잘못된 값 입력 시 충돌이 표시된다', () => {
    // (0,0)에 정답은 5이지만 3을 넣으면 (0,1)의 정답인 3과 같은 행 충돌
    // 단, (0,1)도 빈 셀이므로 실제 충돌은 다른 주어진 셀과 확인해야 함
    // solution[0] = [5, 3, 4, 6, 7, 8, 9, 1, 2]
    // (0,2)=4가 given → (0,0)에 4 입력 시 충돌
    useGameStore.getState().setValue(0, 0, 4);
    const { board } = useGameStore.getState();

    expect(board[0][0].isError).toBe(true);
    expect(board[0][2].isError).toBe(true); // 충돌 상대
  });

  it('정답 입력 시 isError=false', () => {
    useGameStore.getState().setValue(0, 0, 5); // 정답
    const { board } = useGameStore.getState();

    expect(board[0][0].isError).toBe(false);
  });

  it('기존 값이 있는 셀에 덮어쓸 수 있다', () => {
    useGameStore.getState().setValue(0, 0, 3);
    useGameStore.getState().setValue(0, 0, 5);
    const { board } = useGameStore.getState();

    expect(board[0][0].value).toBe(5);
  });

  it('값 입력 시 메모가 초기화된다', () => {
    // 먼저 메모 추가
    useGameStore.getState().toggleNote(0, 0, 5);
    useGameStore.getState().toggleNote(0, 0, 3);
    expect(useGameStore.getState().board[0][0].notes.size).toBe(2);

    // 값 입력
    useGameStore.getState().setValue(0, 0, 5);
    expect(useGameStore.getState().board[0][0].notes.size).toBe(0);
  });

  it('게임 완료 후에는 입력할 수 없다', () => {
    // 모든 빈 셀을 정답으로 채움
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isComplete).toBe(true);

    // 완료 후 입력 시도
    useGameStore.getState().setValue(0, 0, 1);
    expect(useGameStore.getState().board[0][0].value).toBe(5); // 변경 안 됨
  });
});

// ─── clearValue ─────────────────────────────────────

describe('clearValue', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('입력된 값을 삭제한다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().clearValue(0, 0);

    expect(useGameStore.getState().board[0][0].value).toBeNull();
  });

  it('given 셀은 삭제할 수 없다', () => {
    useGameStore.getState().clearValue(0, 2); // given
    expect(useGameStore.getState().board[0][2].value).toBe(4);
  });

  it('이미 빈 셀은 히스토리에 추가하지 않는다', () => {
    useGameStore.getState().clearValue(0, 0); // 이미 빈 셀
    expect(useGameStore.getState().history).toHaveLength(0);
  });

  it('삭제 후 관련 충돌이 해소된다', () => {
    useGameStore.getState().setValue(0, 0, 4); // (0,2)=4와 충돌
    expect(useGameStore.getState().board[0][0].isError).toBe(true);

    useGameStore.getState().clearValue(0, 0);
    const { board } = useGameStore.getState();
    expect(board[0][0].isError).toBe(false);
    expect(board[0][2].isError).toBe(false);
  });

  it('히스토리에 이전 상태가 저장된다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().clearValue(0, 0);

    const { history } = useGameStore.getState();
    expect(history).toHaveLength(2); // setValue + clearValue
    expect(history[1].board[0][0].value).toBe(5); // clearValue 직전 상태
  });
});

// ─── toggleNote ─────────────────────────────────────

describe('toggleNote', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('빈 셀에 메모를 추가한다', () => {
    useGameStore.getState().toggleNote(0, 0, 5);
    const { board } = useGameStore.getState();

    expect(board[0][0].notes.has(5)).toBe(true);
  });

  it('이미 있는 메모를 제거한다', () => {
    useGameStore.getState().toggleNote(0, 0, 5);
    useGameStore.getState().toggleNote(0, 0, 5);
    const { board } = useGameStore.getState();

    expect(board[0][0].notes.has(5)).toBe(false);
  });

  it('여러 메모를 동시에 가질 수 있다', () => {
    useGameStore.getState().toggleNote(0, 0, 1);
    useGameStore.getState().toggleNote(0, 0, 3);
    useGameStore.getState().toggleNote(0, 0, 5);
    const { board } = useGameStore.getState();

    expect(board[0][0].notes.size).toBe(3);
    expect(board[0][0].notes.has(1)).toBe(true);
    expect(board[0][0].notes.has(3)).toBe(true);
    expect(board[0][0].notes.has(5)).toBe(true);
  });

  it('값이 있는 셀에는 메모를 추가할 수 없다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().toggleNote(0, 0, 3);
    const { board } = useGameStore.getState();

    expect(board[0][0].notes.size).toBe(0);
  });

  it('given 셀에는 메모를 추가할 수 없다', () => {
    useGameStore.getState().toggleNote(0, 2, 1); // given
    const { board } = useGameStore.getState();

    expect(board[0][2].notes.size).toBe(0);
  });

  it('히스토리에 이전 상태가 저장된다', () => {
    useGameStore.getState().toggleNote(0, 0, 5);
    const { history } = useGameStore.getState();

    expect(history).toHaveLength(1);
    expect(history[0].board[0][0].notes.size).toBe(0);
  });
});

// ─── undo ───────────────────────────────────────────

describe('undo', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('마지막 동작을 되돌린다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().undo();

    expect(useGameStore.getState().board[0][0].value).toBeNull();
  });

  it('여러 번 undo', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);

    useGameStore.getState().undo(); // (0,1) 되돌림
    expect(useGameStore.getState().board[0][1].value).toBeNull();

    useGameStore.getState().undo(); // (0,0) 되돌림
    expect(useGameStore.getState().board[0][0].value).toBeNull();
  });

  it('히스토리가 비어있으면 아무 것도 하지 않는다', () => {
    const boardBefore = useGameStore.getState().board;
    useGameStore.getState().undo();
    const boardAfter = useGameStore.getState().board;

    // 빈 배열이거나 동일한 참조 유지
    expect(boardAfter).toBe(boardBefore);
  });

  it('undo 후 히스토리가 줄어든다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    expect(useGameStore.getState().history).toHaveLength(2);

    useGameStore.getState().undo();
    expect(useGameStore.getState().history).toHaveLength(1);
  });

  it('메모 undo도 동작한다', () => {
    useGameStore.getState().toggleNote(0, 0, 5);
    expect(useGameStore.getState().board[0][0].notes.has(5)).toBe(true);

    useGameStore.getState().undo();
    expect(useGameStore.getState().board[0][0].notes.has(5)).toBe(false);
  });
});

// ─── timer ──────────────────────────────────────────

describe('timer', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('tick으로 1초 증가', () => {
    useGameStore.getState().tick();
    expect(useGameStore.getState().timer).toBe(1);

    useGameStore.getState().tick();
    expect(useGameStore.getState().timer).toBe(2);
  });

  it('일시정지 시 tick이 동작하지 않는다', () => {
    useGameStore.getState().tick();
    useGameStore.getState().pause();
    useGameStore.getState().tick();

    expect(useGameStore.getState().timer).toBe(1);
    expect(useGameStore.getState().isPaused).toBe(true);
  });

  it('재개 후 tick이 다시 동작한다', () => {
    useGameStore.getState().pause();
    useGameStore.getState().tick();
    useGameStore.getState().resume();
    useGameStore.getState().tick();

    expect(useGameStore.getState().timer).toBe(1);
  });

  it('게임 완료 후 tick이 동작하지 않는다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isComplete).toBe(true);

    useGameStore.getState().tick();
    expect(useGameStore.getState().timer).toBe(0); // 증가 안 함
  });

  it('게임 미시작 시 tick이 동작하지 않는다', () => {
    // initGame 없이
    useGameStore.setState({ isStarted: false });
    useGameStore.getState().tick();
    expect(useGameStore.getState().timer).toBe(0);
  });
});

// ─── selectCell / toggleNoteMode ────────────────────

describe('UI 상태', () => {
  it('셀 선택', () => {
    useGameStore.getState().selectCell({ row: 3, col: 5 });
    expect(useGameStore.getState().selectedCell).toEqual({ row: 3, col: 5 });
  });

  it('셀 선택 해제', () => {
    useGameStore.getState().selectCell({ row: 3, col: 5 });
    useGameStore.getState().selectCell(null);
    expect(useGameStore.getState().selectedCell).toBeNull();
  });

  it('메모 모드 토글', () => {
    expect(useGameStore.getState().isNoteMode).toBe(false);
    useGameStore.getState().toggleNoteMode();
    expect(useGameStore.getState().isNoteMode).toBe(true);
    useGameStore.getState().toggleNoteMode();
    expect(useGameStore.getState().isNoteMode).toBe(false);
  });
});

// ─── completion ─────────────────────────────────────

describe('게임 완료', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('모든 빈 셀을 정답으로 채우면 완료', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isComplete).toBe(true);
  });

  it('오답이 있으면 미완료', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 1); // 오답 (정답은 5)

    expect(useGameStore.getState().isComplete).toBe(false);
  });

  it('완료 시 isPaused가 true로 설정된다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isPaused).toBe(true);
  });
});

// ─── reset ──────────────────────────────────────────

describe('reset', () => {
  it('보드를 초기 상태로 되돌린다', () => {
    useGameStore.getState().initGame(1);
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);

    useGameStore.getState().reset();
    const { board, timer, history, isComplete } = useGameStore.getState();

    // 빈 셀은 초기화
    expect(board[0][0].value).toBeNull();
    expect(board[0][1].value).toBeNull();

    // given 셀은 유지
    expect(board[0][2].value).toBe(4);

    // 타이머, 히스토리, 완료 상태 초기화
    expect(timer).toBe(0);
    expect(history).toHaveLength(0);
    expect(isComplete).toBe(false);
  });

  it('게임이 시작되지 않았으면 아무 것도 하지 않는다', () => {
    useGameStore.getState().reset();
    expect(useGameStore.getState().stage).toBe(0);
  });
});

// ─── 잠금 해제 통합 ────────────────────────────────

describe('잠금 셀 해제', () => {
  it('잠금 셀에는 값을 입력할 수 없다', () => {
    useGameStore.getState().initGame(1);

    // 수동으로 잠금 셀 설정
    const { board } = useGameStore.getState();
    const lockedBoard = board.map((row, r) =>
      row.map((cell, c): Cell => {
        if (r === 0 && c === 0) {
          return { ...cell, notes: new Set(cell.notes), isLocked: true };
        }
        return { ...cell, notes: new Set(cell.notes) };
      }),
    );
    useGameStore.setState({
      board: lockedBoard,
      lockedCells: [{
        position: { row: 0, col: 0 },
        conditions: [{ type: 'row-complete', target: 1, description: '2행 완성' }],
      }],
    });

    useGameStore.getState().setValue(0, 0, 5);
    expect(useGameStore.getState().board[0][0].value).toBeNull(); // 입력 안 됨
  });

  it('잠금 셀에는 메모를 추가할 수 없다', () => {
    useGameStore.getState().initGame(1);

    const { board } = useGameStore.getState();
    const lockedBoard = board.map((row, r) =>
      row.map((cell, c): Cell => {
        if (r === 0 && c === 0) {
          return { ...cell, notes: new Set(cell.notes), isLocked: true };
        }
        return { ...cell, notes: new Set(cell.notes) };
      }),
    );
    useGameStore.setState({ board: lockedBoard });

    useGameStore.getState().toggleNote(0, 0, 5);
    expect(useGameStore.getState().board[0][0].notes.size).toBe(0);
  });
});

// ─── 히스토리 크기 제한 ─────────────────────────────

describe('히스토리 크기 제한', () => {
  it('MAX_HISTORY(50)를 초과하면 가장 오래된 항목이 제거된다', () => {
    useGameStore.getState().initGame(1);

    // 51번 setValue 호출 (0,0)에 교대로 값 설정/삭제
    for (let i = 0; i < 51; i++) {
      if (i % 2 === 0) {
        useGameStore.getState().setValue(0, 0, 5);
      } else {
        useGameStore.getState().clearValue(0, 0);
      }
    }

    expect(useGameStore.getState().history.length).toBeLessThanOrEqual(50);
  });
});

// ─── 직렬화 / 역직렬화 ─────────────────────────────

describe('직렬화', () => {
  const sampleCell: Cell = {
    value: 5,
    isGiven: true,
    notes: new Set<Digit>([1, 3, 7]),
    isError: false,
    isLocked: false,
  };

  it('serializeCell — Set을 Array로 변환한다', () => {
    const serialized = serializeCell(sampleCell);
    expect(serialized.value).toBe(5);
    expect(serialized.isGiven).toBe(true);
    expect(Array.isArray(serialized.notes)).toBe(true);
    expect(serialized.notes).toContain(1);
    expect(serialized.notes).toContain(3);
    expect(serialized.notes).toContain(7);
    expect(serialized.notes).toHaveLength(3);
  });

  it('deserializeCell — Array를 Set으로 복원한다', () => {
    const serialized = serializeCell(sampleCell);
    const restored = deserializeCell(serialized);
    expect(restored.notes instanceof Set).toBe(true);
    expect(restored.notes.has(1)).toBe(true);
    expect(restored.notes.has(3)).toBe(true);
    expect(restored.notes.has(7)).toBe(true);
    expect(restored.value).toBe(5);
  });

  it('serializeCell → deserializeCell 왕복이 동등하다', () => {
    const restored = deserializeCell(serializeCell(sampleCell));
    expect(restored.value).toBe(sampleCell.value);
    expect(restored.isGiven).toBe(sampleCell.isGiven);
    expect(restored.isError).toBe(sampleCell.isError);
    expect(restored.isLocked).toBe(sampleCell.isLocked);
    expect([...restored.notes].sort()).toEqual([...sampleCell.notes].sort());
  });

  it('빈 notes도 올바르게 직렬화된다', () => {
    const emptyNoteCell: Cell = { ...sampleCell, notes: new Set() };
    const serialized = serializeCell(emptyNoteCell);
    expect(serialized.notes).toEqual([]);

    const restored = deserializeCell(serialized);
    expect(restored.notes.size).toBe(0);
  });

  it('serializeBoard → deserializeBoard 왕복', () => {
    useGameStore.getState().initGame(1);
    const { board } = useGameStore.getState();

    const serialized = serializeBoard(board);
    expect(Array.isArray(serialized)).toBe(true);
    expect(serialized).toHaveLength(9);

    const restored = deserializeBoard(serialized);
    expect(restored).toHaveLength(9);

    // notes가 Set으로 복원되었는지
    for (const row of restored) {
      for (const cell of row) {
        expect(cell.notes instanceof Set).toBe(true);
      }
    }

    // 값이 동일한지
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(restored[r][c].value).toBe(board[r][c].value);
        expect(restored[r][c].isGiven).toBe(board[r][c].isGiven);
      }
    }
  });

  it('serializeHistory → deserializeHistory 왕복', () => {
    useGameStore.getState().initGame(1);
    useGameStore.getState().setValue(0, 0, 5);
    const { history } = useGameStore.getState();

    expect(history.length).toBeGreaterThan(0);

    const serialized = serializeHistory(history);
    const restored = deserializeHistory(serialized);

    expect(restored).toHaveLength(history.length);
    expect(restored[0].board).toHaveLength(9);
    expect(restored[0].board[0][0].notes instanceof Set).toBe(true);
    expect(Array.isArray(restored[0].lockedCells)).toBe(true);
  });

  it('빈 히스토리도 올바르게 직렬화된다', () => {
    const serialized = serializeHistory([]);
    expect(serialized).toEqual([]);
    const restored = deserializeHistory([]);
    expect(restored).toEqual([]);
  });
});

// ─── 완료 후 resume 방지 ────────────────────────────

describe('완료 후 상태', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('완료 후 resume이 동작하지 않는다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isComplete).toBe(true);
    expect(useGameStore.getState().isPaused).toBe(true);

    useGameStore.getState().resume();
    expect(useGameStore.getState().isPaused).toBe(true); // 여전히 일시정지
  });

  it('완료 후 undo가 동작하지 않는다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isComplete).toBe(true);

    useGameStore.getState().undo();
    expect(useGameStore.getState().board[4][4].value).toBe(5); // 변경 안 됨
  });

  it('완료 후 clearValue가 동작하지 않는다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    useGameStore.getState().clearValue(0, 0);
    expect(useGameStore.getState().board[0][0].value).toBe(5);
  });

  it('완료 후 toggleNote가 동작하지 않는다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    useGameStore.getState().clearValue(0, 0); // 동작 안 함
    useGameStore.getState().toggleNote(0, 0, 1); // 동작 안 함
    expect(useGameStore.getState().board[0][0].notes.size).toBe(0);
  });
});
