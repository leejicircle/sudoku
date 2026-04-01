import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/stores/game-store';
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
  useGameStore.setState({
    board: [],
    solution: null,
    stage: 0,
    config: null,
    lockedCells: [],
    initialLockedCells: [],
    selectedCell: null,
    isNoteMode: false,
    timer: 0,
    isPaused: false,
    history: [],
    isStarted: false,
    isComplete: false,
    hintsUsed: 0,
  });
});

// ─── clearNotes ─────────────────────────────────────

describe('clearNotes', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('메모가 있는 셀의 notes를 모두 삭제한다', () => {
    useGameStore.getState().toggleNote(0, 0, 1);
    useGameStore.getState().toggleNote(0, 0, 3);
    useGameStore.getState().toggleNote(0, 0, 5);
    expect(useGameStore.getState().board[0][0].notes.size).toBe(3);

    useGameStore.getState().clearNotes(0, 0);
    expect(useGameStore.getState().board[0][0].notes.size).toBe(0);
  });

  it('히스토리에 이전 상태가 저장된다', () => {
    useGameStore.getState().toggleNote(0, 0, 5);
    const historyBefore = useGameStore.getState().history.length;

    useGameStore.getState().clearNotes(0, 0);
    expect(useGameStore.getState().history.length).toBe(historyBefore + 1);

    // 히스토리의 마지막 항목에 메모가 남아있어야 함
    const lastEntry = useGameStore.getState().history.at(-1)!;
    expect(lastEntry.board[0][0].notes.has(5)).toBe(true);
  });

  it('메모가 없는 빈 셀은 무시한다 (히스토리 불변)', () => {
    expect(useGameStore.getState().board[0][0].notes.size).toBe(0);

    useGameStore.getState().clearNotes(0, 0);
    expect(useGameStore.getState().history).toHaveLength(0);
  });

  it('값이 있는 셀은 무시한다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    const historyBefore = useGameStore.getState().history.length;

    useGameStore.getState().clearNotes(0, 0);
    expect(useGameStore.getState().history.length).toBe(historyBefore);
  });

  it('given 셀은 무시한다', () => {
    useGameStore.getState().clearNotes(0, 2); // (0,2)는 given
    expect(useGameStore.getState().history).toHaveLength(0);
  });

  it('잠금 셀은 무시한다', () => {
    // 수동으로 잠금 셀 설정
    const { board } = useGameStore.getState();
    const lockedBoard = board.map((row, r) =>
      row.map((cell, c): Cell => {
        if (r === 0 && c === 0) {
          return { ...cell, notes: new Set<Digit>([1, 3]), isLocked: true };
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

    useGameStore.getState().clearNotes(0, 0);
    expect(useGameStore.getState().board[0][0].notes.size).toBe(2); // 변경 안 됨
  });

  it('게임 완료 후에는 동작하지 않는다', () => {
    useGameStore.getState().toggleNote(0, 0, 1);
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isComplete).toBe(true);

    // 완료 후 다른 셀에 clearNotes — 동작 안 해야 함
    useGameStore.getState().clearNotes(0, 0);
    expect(useGameStore.getState().isComplete).toBe(true);
  });
});

// ─── useHint ────────────────────────────────────────

describe('useHint', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(1);
  });

  it('선택된 빈 셀에 정답을 입력한다', () => {
    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    const { board, hintsUsed } = useGameStore.getState();
    expect(board[0][0].value).toBe(5); // solution[0][0] = 5
    expect(hintsUsed).toBe(1);
  });

  it('힌트 사용 시 메모가 초기화된다', () => {
    useGameStore.getState().toggleNote(0, 0, 1);
    useGameStore.getState().toggleNote(0, 0, 3);
    expect(useGameStore.getState().board[0][0].notes.size).toBe(2);

    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    expect(useGameStore.getState().board[0][0].notes.size).toBe(0);
  });

  it('히스토리에 이전 상태가 저장된다', () => {
    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    const { history } = useGameStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].board[0][0].value).toBeNull(); // 힌트 사용 전 상태
  });

  it('hintsUsed가 3이면 더 이상 사용할 수 없다', () => {
    // hintsUsed를 직접 3으로 설정 (게임 완료 없이 소진 시뮬레이션)
    useGameStore.setState({ hintsUsed: 3 });

    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    expect(useGameStore.getState().board[0][0].value).toBeNull(); // 변경 안 됨
    expect(useGameStore.getState().hintsUsed).toBe(3); // 변경 없음
  });

  it('힌트를 연속 사용하면 hintsUsed가 누적된다', () => {
    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintsUsed).toBe(1);

    useGameStore.getState().selectCell({ row: 0, col: 1 });
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintsUsed).toBe(2);
  });

  it('selectedCell이 없으면 무시한다', () => {
    useGameStore.getState().selectCell(null);
    useGameStore.getState().useHint();

    expect(useGameStore.getState().hintsUsed).toBe(0);
  });

  it('given 셀에는 힌트를 사용할 수 없다', () => {
    useGameStore.getState().selectCell({ row: 0, col: 2 }); // (0,2)는 given
    useGameStore.getState().useHint();

    expect(useGameStore.getState().hintsUsed).toBe(0);
  });

  it('잠금 셀에는 힌트를 사용할 수 없다', () => {
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

    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    expect(useGameStore.getState().board[0][0].value).toBeNull();
    expect(useGameStore.getState().hintsUsed).toBe(0);
  });

  it('이미 값이 있는 셀은 무시한다', () => {
    useGameStore.getState().setValue(0, 0, 3); // 오답이지만 값이 있음
    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    expect(useGameStore.getState().board[0][0].value).toBe(3); // 변경 안 됨
    expect(useGameStore.getState().hintsUsed).toBe(0);
  });

  it('일시정지 중에는 힌트를 사용할 수 없다', () => {
    useGameStore.getState().pause();
    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    expect(useGameStore.getState().board[0][0].value).toBeNull();
    expect(useGameStore.getState().hintsUsed).toBe(0);
  });

  it('게임 완료 후에는 힌트를 사용할 수 없다', () => {
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);
    useGameStore.getState().setValue(4, 4, 5);

    expect(useGameStore.getState().isComplete).toBe(true);

    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();

    expect(useGameStore.getState().hintsUsed).toBe(0);
  });

  it('힌트로 마지막 빈 셀을 채우면 게임이 완료된다', () => {
    // 2개는 수동 입력, 마지막 1개는 힌트
    useGameStore.getState().setValue(0, 0, 5);
    useGameStore.getState().setValue(0, 1, 3);

    useGameStore.getState().selectCell({ row: 4, col: 4 });
    useGameStore.getState().useHint(); // solution[4][4] = 5

    expect(useGameStore.getState().board[4][4].value).toBe(5);
    expect(useGameStore.getState().isComplete).toBe(true);
    expect(useGameStore.getState().isPaused).toBe(true);
    expect(useGameStore.getState().hintsUsed).toBe(1);
  });

  it('initGame 시 hintsUsed가 0으로 리셋된다', () => {
    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintsUsed).toBe(1);

    useGameStore.getState().initGame(1);
    expect(useGameStore.getState().hintsUsed).toBe(0);
  });

  it('reset 시 hintsUsed가 0으로 리셋된다', () => {
    useGameStore.getState().selectCell({ row: 0, col: 0 });
    useGameStore.getState().useHint();
    expect(useGameStore.getState().hintsUsed).toBe(1);

    useGameStore.getState().reset();
    expect(useGameStore.getState().hintsUsed).toBe(0);
  });
});
