/**
 * 스도쿠 실시간 입력 검증
 * 행/열/박스 충돌 감지, 보드 완성 검사 등 순수 검증 함수 모음.
 *
 * @description
 * 1. 전체 보드의 충돌 셀 위치를 탐색 (행·열·박스 중복)
 * 2. Board 객체에 isError 플래그를 갱신한 새 보드 반환
 * 3. 완성 여부(모든 셀이 정답과 일치)를 판별
 * 모든 함수는 사이드 이펙트 없는 순수 함수.
 *
 * @see GitHub Issue #3 — Epic: 스도쿠 엔진 개발
 */

import type { Board, Cell, Digit, SolutionGrid, Position, Grid } from '@/types/game';
import { BOARD_SIZE, BOX_SIZE, posKey } from '@/lib/sudoku/utils';

// ─── 충돌 탐색 ──────────────────────────────────────

/**
 * 보드 전체에서 충돌하는 셀 위치를 찾는다.
 * 같은 행/열/박스에 동일한 숫자가 두 개 이상이면 충돌.
 *
 * @param board - 현재 보드 상태
 * @returns 충돌 셀 위치 키(Set<string>)
 */
export const findAllConflicts = (board: Board): Set<string> => {
  const conflicts = new Set<string>();

  // 행 검사
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c1 = 0; c1 < BOARD_SIZE; c1++) {
      const v1 = board[r][c1].value;
      if (v1 === null) continue;
      for (let c2 = c1 + 1; c2 < BOARD_SIZE; c2++) {
        if (board[r][c2].value === v1) {
          conflicts.add(posKey(r, c1));
          conflicts.add(posKey(r, c2));
        }
      }
    }
  }

  // 열 검사
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r1 = 0; r1 < BOARD_SIZE; r1++) {
      const v1 = board[r1][c].value;
      if (v1 === null) continue;
      for (let r2 = r1 + 1; r2 < BOARD_SIZE; r2++) {
        if (board[r2][c].value === v1) {
          conflicts.add(posKey(r1, c));
          conflicts.add(posKey(r2, c));
        }
      }
    }
  }

  // 3×3 박스 검사
  for (let br = 0; br < BOX_SIZE; br++) {
    for (let bc = 0; bc < BOX_SIZE; bc++) {
      const cells: { r: number; c: number; v: Digit }[] = [];
      for (let r = br * BOX_SIZE; r < br * BOX_SIZE + BOX_SIZE; r++) {
        for (let c = bc * BOX_SIZE; c < bc * BOX_SIZE + BOX_SIZE; c++) {
          const v = board[r][c].value;
          if (v !== null) cells.push({ r, c, v });
        }
      }
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          if (cells[i].v === cells[j].v) {
            conflicts.add(posKey(cells[i].r, cells[i].c));
            conflicts.add(posKey(cells[j].r, cells[j].c));
          }
        }
      }
    }
  }

  return conflicts;
};

// ─── 에러 갱신 ──────────────────────────────────────

/**
 * 보드의 모든 셀에 대해 isError 플래그를 갱신한 새 보드를 반환한다.
 * 충돌이 있는 셀만 isError = true, 나머지는 false.
 *
 * @param board - 현재 보드 상태
 * @returns isError가 갱신된 새 보드 (불변)
 */
export const updateBoardErrors = (board: Board): Board => {
  const conflicts = findAllConflicts(board);

  return board.map((row, r) =>
    row.map((cell, c): Cell => ({
      ...cell,
      notes: new Set(cell.notes),
      isError: conflicts.has(posKey(r, c)),
    })),
  );
};

// ─── 완성 검사 ──────────────────────────────────────

/**
 * 보드가 완전히 채워졌는지 검사한다 (null 셀이 없는지).
 *
 * @param board - 현재 보드
 * @returns 모든 셀에 값이 있으면 true
 */
export const isBoardFilled = (board: Board): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].value === null) return false;
    }
  }
  return true;
};

/**
 * 보드의 모든 셀이 정답과 일치하는지 검사한다.
 * 잠금 해제되지 않은 빈 셀이 있으면 false.
 *
 * @param board - 현재 보드
 * @param solution - 정답 그리드
 * @returns 완전히 정답인지 여부
 */
export const isBoardSolved = (board: Board, solution: SolutionGrid): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].value !== solution[r][c]) return false;
    }
  }
  return true;
};

/**
 * 충돌 없이 완전히 채워졌는지 검사한다 (게임 완료 조건).
 *
 * @param board - 현재 보드
 * @param solution - 정답 그리드
 * @returns 게임 클리어 여부
 */
export const isGameComplete = (board: Board, solution: SolutionGrid): boolean => {
  return isBoardFilled(board) && isBoardSolved(board, solution);
};

// ─── Board ↔ Grid 변환 ──────────────────────────────

/**
 * Board를 Grid로 변환한다 (값만 추출).
 * lockSystem의 조건 검사 함수에 전달할 때 사용.
 *
 * @param board - 현재 보드
 * @returns CellValue[][] 그리드
 */
export const boardToGrid = (board: Board): Grid =>
  board.map((row) => row.map((cell) => cell.value));

// ─── Board 불변 복사 ────────────────────────────────

/**
 * Board를 깊은 복사한다 (Cell의 notes Set 포함).
 *
 * @param board - 원본 보드
 * @returns 독립된 새 보드
 */
export const cloneBoard = (board: Board): Board =>
  board.map((row) =>
    row.map((cell): Cell => ({
      ...cell,
      notes: new Set(cell.notes),
    })),
  );

// ─── Board 생성 ─────────────────────────────────────

/**
 * 퍼즐 Grid + 잠금 정보로부터 게임 Board를 생성한다.
 *
 * @param puzzle - 퍼즐 그리드 (빈 칸 = null)
 * @param lockedCells - 잠금 칸 목록
 * @returns 초기 보드
 */
export const createBoardFromPuzzle = (
  puzzle: Grid,
  lockedCells: { position: Position }[],
): Board => {
  const lockedKeys = new Set(
    lockedCells.map((lc) => posKey(lc.position.row, lc.position.col)),
  );

  return puzzle.map((row, r) =>
    row.map((value, c): Cell => ({
      value,
      isGiven: value !== null,
      notes: new Set<Digit>(),
      isError: false,
      isLocked: lockedKeys.has(posKey(r, c)),
    })),
  );
};
