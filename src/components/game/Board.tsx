"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import type { Digit, LockCondition, Position } from "@/types/game";
import Cell from "./Cell";
import LockedCellPopover from "./LockedCellPopover";

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

/** 같은 3×3 박스에 속하는지 확인 */
const isSameBox = (a: Position, b: Position): boolean =>
  Math.floor(a.row / 3) === Math.floor(b.row / 3) &&
  Math.floor(a.col / 3) === Math.floor(b.col / 3);

/** 같은 행, 열, 또는 박스에 속하는지 확인 */
const isRelated = (a: Position, b: Position): boolean =>
  a.row === b.row || a.col === b.col || isSameBox(a, b);

// ────────────────────────────────────────
// 보드 컴포넌트
// ────────────────────────────────────────

const Board = () => {
  const boardRef = useRef<HTMLDivElement>(null);

  const board = useGameStore((s) => s.board);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const isNoteMode = useGameStore((s) => s.isNoteMode);
  const isComplete = useGameStore((s) => s.isComplete);
  const isPaused = useGameStore((s) => s.isPaused);
  const selectCell = useGameStore((s) => s.selectCell);
  const setValue = useGameStore((s) => s.setValue);
  const clearValue = useGameStore((s) => s.clearValue);
  const toggleNote = useGameStore((s) => s.toggleNote);
  const lockedCells = useGameStore((s) => s.lockedCells);

  // ── 잠금 셀 팝오버 상태 ──
  const [lockedPopoverCell, setLockedPopoverCell] = useState<Position | null>(null);
  const boardDataRef = useRef(board);
  useEffect(() => {
    boardDataRef.current = board;
  }, [board]);

  // 잠금 셀별 조건 맵 (키: "row-col")
  const lockedConditionsMap = useMemo(() => {
    const map = new Map<string, LockCondition[]>();
    for (const lc of lockedCells) {
      map.set(`${lc.position.row}-${lc.position.col}`, lc.conditions);
    }
    return map;
  }, [lockedCells]);

  // 선택된 셀의 값 (같은 숫자 하이라이트용)
  const selectedValue = selectedCell
    ? board[selectedCell.row]?.[selectedCell.col]?.value
    : null;

  // ── 셀 선택 핸들러 (row/col 개별 전달로 Cell memo 최적화) ──
  const handleCellSelect = useCallback(
    (row: number, col: number) => {
      if (isComplete || isPaused) return;
      selectCell({ row, col });

      // 잠금 셀 팝오버 토글
      const cell = boardDataRef.current[row]?.[col];
      if (cell?.isLocked) {
        setLockedPopoverCell((prev) =>
          prev && prev.row === row && prev.col === col ? null : { row, col },
        );
      } else {
        setLockedPopoverCell(null);
      }
    },
    [selectCell, isComplete, isPaused],
  );

  // ── 키보드 네비게이션 ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || isPaused) return;

      // 숫자 입력 (1~9)
      const digit = parseInt(e.key);
      if (digit >= 1 && digit <= 9 && selectedCell) {
        e.preventDefault();
        if (isNoteMode) {
          toggleNote(selectedCell.row, selectedCell.col, digit as Digit);
        } else {
          setValue(selectedCell.row, selectedCell.col, digit as Digit);
        }
        return;
      }

      // 삭제 (Backspace / Delete)
      if ((e.key === "Backspace" || e.key === "Delete") && selectedCell) {
        e.preventDefault();
        clearValue(selectedCell.row, selectedCell.col);
        return;
      }

      // 방향키 이동
      if (!selectedCell) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          selectCell({ row: 0, col: 0 });
        }
        return;
      }

      const { row, col } = selectedCell;
      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case "ArrowUp":
          newRow = row > 0 ? row - 1 : 8;
          break;
        case "ArrowDown":
          newRow = row < 8 ? row + 1 : 0;
          break;
        case "ArrowLeft":
          newCol = col > 0 ? col - 1 : 8;
          break;
        case "ArrowRight":
          newCol = col < 8 ? col + 1 : 0;
          break;
        default:
          return;
      }

      e.preventDefault();
      selectCell({ row: newRow, col: newCol });
      setLockedPopoverCell(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, isComplete, isPaused, isNoteMode, selectCell, setValue, clearValue, toggleNote]);

  // 보드가 비어있으면 렌더링하지 않음
  if (board.length === 0) return null;

  return (
    <div
      ref={boardRef}
      role="grid"
      aria-label="스도쿠 보드"
      className={
        /* 외곽선 + 배경 + 그림자 */
        "border-[length:var(--board-border-width)] border-board-border " +
        "bg-board-bg rounded-[var(--radius-lg)] " +
        "shadow-[var(--shadow-board)] " +
        /* 보드 크기: 셀 9개 + 간격 */
        "w-fit mx-auto " +
        /* 일시정지 시 블러 */
        (isPaused ? "blur-[12px] pointer-events-none select-none" : "")
      }
    >
      {board.map((row, rowIdx) => (
        <div key={rowIdx} role="row" className="flex">
          {row.map((cell, colIdx) => {
            const isSelected =
              selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
            const isHighlighted =
              !isSelected &&
              !!selectedCell &&
              isRelated(selectedCell, { row: rowIdx, col: colIdx });
            const isSameNumber =
              !isSelected &&
              !!selectedValue &&
              !!cell.value &&
              cell.value === selectedValue;

            const cellKey = `${rowIdx}-${colIdx}`;

            if (cell.isLocked) {
              const isPopoverOpen = !!(
                !isPaused &&
                !isComplete &&
                lockedPopoverCell &&
                lockedPopoverCell.row === rowIdx &&
                lockedPopoverCell.col === colIdx
              );

              return (
                <LockedCellPopover
                  key={cellKey}
                  conditions={lockedConditionsMap.get(cellKey) ?? []}
                  open={isPopoverOpen}
                  onOpenChange={(open) => {
                    if (!open) setLockedPopoverCell(null);
                  }}
                >
                  <Cell
                    cell={cell}
                    row={rowIdx}
                    col={colIdx}
                    isSelected={isSelected}
                    isHighlighted={isHighlighted}
                    isSameNumber={isSameNumber}
                    onSelect={handleCellSelect}
                  />
                </LockedCellPopover>
              );
            }

            return (
              <Cell
                key={cellKey}
                cell={cell}
                row={rowIdx}
                col={colIdx}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isSameNumber={isSameNumber}
                onSelect={handleCellSelect}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Board;
