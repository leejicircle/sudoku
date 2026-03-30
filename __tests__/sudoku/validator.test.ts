import { describe, it, expect } from 'vitest';
import {
  findAllConflicts,
  updateBoardErrors,
  isBoardFilled,
  isBoardSolved,
  isGameComplete,
  boardToGrid,
  cloneBoard,
  createBoardFromPuzzle,
} from '@/lib/sudoku/validator';
import type { Board, Cell, Digit, SolutionGrid, Grid } from '@/types/game';

// ─── 헬퍼 ──────────────────────────────────────────

const makeCell = (value: Digit | null, overrides?: Partial<Cell>): Cell => ({
  value,
  isGiven: false,
  notes: new Set<Digit>(),
  isError: false,
  isLocked: false,
  ...overrides,
});

const makeEmptyBoard = (): Board =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => makeCell(null)),
  );

const VALID_SOLUTION: SolutionGrid = [
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

const makeSolvedBoard = (): Board =>
  VALID_SOLUTION.map((row) =>
    row.map((v) => makeCell(v, { isGiven: true })),
  );

// ─── findAllConflicts ───────────────────────────────

describe('findAllConflicts', () => {
  it('빈 보드는 충돌 없음', () => {
    const board = makeEmptyBoard();
    expect(findAllConflicts(board).size).toBe(0);
  });

  it('완성된 올바른 보드는 충돌 없음', () => {
    const board = makeSolvedBoard();
    expect(findAllConflicts(board).size).toBe(0);
  });

  it('같은 행에 같은 숫자가 있으면 충돌', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(5);
    board[0][3] = makeCell(5);

    const conflicts = findAllConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,3')).toBe(true);
    expect(conflicts.size).toBe(2);
  });

  it('같은 열에 같은 숫자가 있으면 충돌', () => {
    const board = makeEmptyBoard();
    board[1][2] = makeCell(7);
    board[6][2] = makeCell(7);

    const conflicts = findAllConflicts(board);
    expect(conflicts.has('1,2')).toBe(true);
    expect(conflicts.has('6,2')).toBe(true);
  });

  it('같은 박스에 같은 숫자가 있으면 충돌', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(3);
    board[2][1] = makeCell(3);

    const conflicts = findAllConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('2,1')).toBe(true);
  });

  it('다른 영역의 같은 숫자는 충돌 아님', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(1);
    board[5][5] = makeCell(1); // 다른 행, 열, 박스

    const conflicts = findAllConflicts(board);
    expect(conflicts.size).toBe(0);
  });

  it('3개 이상 충돌 시 모두 포함', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(4);
    board[0][3] = makeCell(4);
    board[0][7] = makeCell(4);

    const conflicts = findAllConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,3')).toBe(true);
    expect(conflicts.has('0,7')).toBe(true);
    expect(conflicts.size).toBe(3);
  });

  it('행+박스 동시 충돌', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(9);
    board[0][1] = makeCell(9); // 같은 행 + 같은 박스

    const conflicts = findAllConflicts(board);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,1')).toBe(true);
  });
});

// ─── updateBoardErrors ──────────────────────────────

describe('updateBoardErrors', () => {
  it('충돌 없으면 모든 셀 isError=false', () => {
    const board = makeSolvedBoard();
    const result = updateBoardErrors(board);

    for (const row of result) {
      for (const cell of row) {
        expect(cell.isError).toBe(false);
      }
    }
  });

  it('충돌 셀만 isError=true로 설정', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(5);
    board[0][4] = makeCell(5);
    board[3][3] = makeCell(7);

    const result = updateBoardErrors(board);
    expect(result[0][0].isError).toBe(true);
    expect(result[0][4].isError).toBe(true);
    expect(result[3][3].isError).toBe(false);
  });

  it('원본 보드를 변경하지 않는다', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(2);
    board[0][1] = makeCell(2);

    const original = board[0][0].isError;
    updateBoardErrors(board);
    expect(board[0][0].isError).toBe(original);
  });

  it('기존 isError를 정확히 갱신한다 (이전 에러 해제)', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(1, { isError: true }); // 이전 에러
    board[5][5] = makeCell(3);

    const result = updateBoardErrors(board);
    expect(result[0][0].isError).toBe(false); // 에러 해제됨
  });
});

// ─── isBoardFilled ──────────────────────────────────

describe('isBoardFilled', () => {
  it('빈 보드는 미완성', () => {
    expect(isBoardFilled(makeEmptyBoard())).toBe(false);
  });

  it('하나라도 빈 셀이 있으면 미완성', () => {
    const board = makeSolvedBoard();
    board[4][4] = makeCell(null);
    expect(isBoardFilled(board)).toBe(false);
  });

  it('모든 셀이 채워져 있으면 완성', () => {
    expect(isBoardFilled(makeSolvedBoard())).toBe(true);
  });
});

// ─── isBoardSolved ──────────────────────────────────

describe('isBoardSolved', () => {
  it('정답 보드는 true', () => {
    const board = makeSolvedBoard();
    expect(isBoardSolved(board, VALID_SOLUTION)).toBe(true);
  });

  it('빈 셀이 있으면 false', () => {
    const board = makeSolvedBoard();
    board[0][0] = makeCell(null);
    expect(isBoardSolved(board, VALID_SOLUTION)).toBe(false);
  });

  it('오답이 있으면 false', () => {
    const board = makeSolvedBoard();
    board[0][0] = makeCell(9); // 정답은 5
    expect(isBoardSolved(board, VALID_SOLUTION)).toBe(false);
  });
});

// ─── isGameComplete ─────────────────────────────────

describe('isGameComplete', () => {
  it('정답 보드는 완료', () => {
    expect(isGameComplete(makeSolvedBoard(), VALID_SOLUTION)).toBe(true);
  });

  it('빈 셀 있으면 미완료', () => {
    const board = makeSolvedBoard();
    board[8][8] = makeCell(null);
    expect(isGameComplete(board, VALID_SOLUTION)).toBe(false);
  });

  it('오답 있으면 미완료', () => {
    const board = makeSolvedBoard();
    board[0][0] = makeCell(1); // 정답은 5
    expect(isGameComplete(board, VALID_SOLUTION)).toBe(false);
  });
});

// ─── boardToGrid ────────────────────────────────────

describe('boardToGrid', () => {
  it('Board의 value만 추출한 Grid를 반환', () => {
    const board = makeSolvedBoard();
    board[0][0] = makeCell(null); // 빈 셀 하나

    const grid = boardToGrid(board);
    expect(grid[0][0]).toBeNull();
    expect(grid[0][1]).toBe(3);
    expect(grid.length).toBe(9);
    expect(grid[0].length).toBe(9);
  });
});

// ─── cloneBoard ─────────────────────────────────────

describe('cloneBoard', () => {
  it('깊은 복사를 반환한다', () => {
    const board = makeEmptyBoard();
    board[0][0] = makeCell(5);
    board[0][0].notes.add(1);
    board[0][0].notes.add(3);

    const cloned = cloneBoard(board);

    // 값 동일
    expect(cloned[0][0].value).toBe(5);
    expect(cloned[0][0].notes.has(1)).toBe(true);
    expect(cloned[0][0].notes.has(3)).toBe(true);

    // 독립된 참조
    cloned[0][0].value = 9 as Digit;
    expect(board[0][0].value).toBe(5); // 원본 불변

    cloned[0][0].notes.add(7);
    expect(board[0][0].notes.has(7)).toBe(false); // Set도 독립
  });
});

// ─── createBoardFromPuzzle ──────────────────────────

describe('createBoardFromPuzzle', () => {
  it('퍼즐에서 올바르게 보드를 생성한다', () => {
    const puzzle: Grid = VALID_SOLUTION.map((row) =>
      row.map((v) => v as Digit | null),
    );
    puzzle[0][0] = null;
    puzzle[4][4] = null;

    const board = createBoardFromPuzzle(puzzle, []);

    // given 셀
    expect(board[0][1].isGiven).toBe(true);
    expect(board[0][1].value).toBe(3);

    // 빈 셀
    expect(board[0][0].isGiven).toBe(false);
    expect(board[0][0].value).toBeNull();
    expect(board[0][0].isLocked).toBe(false);
  });

  it('잠금 셀을 올바르게 표시한다', () => {
    const puzzle: Grid = VALID_SOLUTION.map((row) =>
      row.map((v) => v as Digit | null),
    );
    puzzle[2][3] = null;

    const lockedCells = [
      { position: { row: 2, col: 3 }, conditions: [] },
    ];

    const board = createBoardFromPuzzle(puzzle, lockedCells);

    expect(board[2][3].isLocked).toBe(true);
    expect(board[2][3].value).toBeNull();
    expect(board[2][3].isGiven).toBe(false);
  });

  it('모든 셀의 notes가 빈 Set이다', () => {
    const puzzle: Grid = VALID_SOLUTION.map((row) =>
      row.map((v) => v as Digit | null),
    );
    const board = createBoardFromPuzzle(puzzle, []);

    for (const row of board) {
      for (const cell of row) {
        expect(cell.notes.size).toBe(0);
      }
    }
  });

  it('모든 셀의 isError가 false이다', () => {
    const puzzle: Grid = VALID_SOLUTION.map((row) =>
      row.map((v) => v as Digit | null),
    );
    const board = createBoardFromPuzzle(puzzle, []);

    for (const row of board) {
      for (const cell of row) {
        expect(cell.isError).toBe(false);
      }
    }
  });
});
