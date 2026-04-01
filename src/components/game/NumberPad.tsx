"use client";

import { memo, useCallback, useMemo } from "react";
import { Delete } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import type { Digit } from "@/types/game";

// ────────────────────────────────────────
// 상수
// ────────────────────────────────────────

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ────────────────────────────────────────
// Props
// ────────────────────────────────────────

interface NumberPadProps {
  /** 외부에서 추가 className을 전달할 때 사용 */
  className?: string;
}

// ────────────────────────────────────────
// NumberPad 컴포넌트
// ────────────────────────────────────────

/**
 * 숫자 입력 패드 (5열 × 2행)
 *
 * 레이아웃:
 * [1] [2] [3] [4] [5]
 * [6] [7] [8] [9] [⌫]
 *
 * - 선택된 셀에 숫자 입력 또는 메모 토글
 * - 숫자가 보드에 9개 모두 배치되면 비활성 표시
 * - 눌림 애니메이션 + 햅틱 피드백
 *
 * @see docs/design/game.md §5 숫자패드
 */
const NumberPad = ({ className = "" }: NumberPadProps) => {
  const board = useGameStore((s) => s.board);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const isNoteMode = useGameStore((s) => s.isNoteMode);
  const isComplete = useGameStore((s) => s.isComplete);
  const isPaused = useGameStore((s) => s.isPaused);
  const setValue = useGameStore((s) => s.setValue);
  const clearValue = useGameStore((s) => s.clearValue);
  const toggleNote = useGameStore((s) => s.toggleNote);

  // ── 각 숫자별 배치 횟수 (9개면 완료) ──
  const digitCounts = useMemo(() => {
    const counts = new Map<Digit, number>();
    for (const d of DIGITS) counts.set(d, 0);

    for (const row of board) {
      for (const cell of row) {
        if (cell.value !== null) {
          counts.set(cell.value, (counts.get(cell.value) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [board]);

  // ── 선택된 셀이 인터랙션 가능한지 (given/locked 제외) ──
  const canInteract = useMemo(() => {
    if (!selectedCell || isComplete || isPaused) return false;
    const cell = board[selectedCell.row]?.[selectedCell.col];
    if (!cell) return false;
    return !cell.isGiven && !cell.isLocked;
  }, [board, selectedCell, isComplete, isPaused]);

  // ── 숫자 입력 가능 여부 (메모 모드에서 값 있는 셀 제외) ──
  const canInputDigit = useMemo(() => {
    if (!canInteract || !selectedCell) return false;
    if (isNoteMode) {
      const cell = board[selectedCell.row]?.[selectedCell.col];
      return cell?.value === null;
    }
    return true;
  }, [canInteract, isNoteMode, board, selectedCell]);

  // ── 햅틱 피드백 ──
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // ── 숫자 버튼 클릭 ──
  const handleDigitPress = useCallback(
    (digit: Digit) => {
      if (!selectedCell || !canInputDigit) return;

      triggerHaptic();

      const { row, col } = selectedCell;
      if (isNoteMode) {
        toggleNote(row, col, digit);
      } else {
        setValue(row, col, digit);
      }
    },
    [selectedCell, canInputDigit, isNoteMode, setValue, toggleNote, triggerHaptic],
  );

  // ── 삭제 버튼 클릭 ──
  const clearNotes = useGameStore((s) => s.clearNotes);

  const handleDelete = useCallback(() => {
    if (!selectedCell || !canInteract) return;

    triggerHaptic();

    const cell = board[selectedCell.row]?.[selectedCell.col];
    if (!cell) return;

    // 값이 있으면 값 삭제, 메모만 있으면 메모 삭제
    if (cell.value !== null) {
      clearValue(selectedCell.row, selectedCell.col);
    } else if (cell.notes.size > 0) {
      clearNotes(selectedCell.row, selectedCell.col);
    }
  }, [selectedCell, canInteract, board, clearValue, clearNotes, triggerHaptic]);

  // 보드가 비어있으면 렌더링하지 않음
  if (board.length === 0) return null;

  return (
    <div
      className={`grid grid-cols-5 gap-[var(--numpad-gap)] pb-[calc(env(safe-area-inset-bottom)+16px)] lg:pb-0 ${className}`}
      role="group"
      aria-label="숫자 입력 패드"
    >
      {DIGITS.map((digit) => {
        const count = digitCounts.get(digit) ?? 0;
        const isDigitComplete = count >= 9;

        return (
          <DigitButton
            key={digit}
            digit={digit}
            isComplete={isDigitComplete}
            disabled={!canInputDigit || isDigitComplete}
            onPress={handleDigitPress}
          />
        );
      })}

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={!canInteract}
        aria-label="선택된 셀 값 지우기"
        className={
          "flex items-center justify-center " +
          "w-[var(--numpad-button-size)] h-[var(--numpad-button-size)] " +
          "rounded-[var(--radius-md)] " +
          "cursor-pointer bg-card shadow-[var(--shadow-numpad)] " +
          "text-muted-foreground " +
          "transition-colors duration-[var(--duration-fast)] " +
          "hover:bg-accent " +
          "active:animate-numpad-press active:bg-sudoku-primary active:text-sudoku-primary-foreground " +
          "disabled:opacity-40 disabled:pointer-events-none"
        }
      >
        <Delete size={20} strokeWidth={2} />
      </button>
    </div>
  );
};

// ────────────────────────────────────────
// DigitButton (개별 숫자 버튼)
// ────────────────────────────────────────

interface DigitButtonProps {
  digit: Digit;
  isComplete: boolean;
  disabled: boolean;
  onPress: (digit: Digit) => void;
}

/**
 * 개별 숫자 버튼
 * - 완료 상태: opacity 0.3, muted 배경
 * - 활성 누름: scale 0.92→1 애니메이션 + primary 배경
 */
const DigitButton = memo(({ digit, isComplete, disabled, onPress }: DigitButtonProps) => {
  const handleClick = useCallback(() => {
    onPress(digit);
  }, [digit, onPress]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`숫자 ${digit}${isComplete ? " (완료)" : ""}`}
      aria-disabled={disabled}
      className={
        "flex items-center justify-center " +
        "w-[var(--numpad-button-size)] h-[var(--numpad-button-size)] " +
        "rounded-[var(--radius-md)] " +
        "font-mono text-(length:--text-numpad) font-medium " +
        "transition-colors duration-[var(--duration-fast)] " +
        (isComplete
          ? "opacity-30 bg-muted text-muted-foreground pointer-events-none "
          : "cursor-pointer bg-card text-foreground shadow-[var(--shadow-numpad)] " +
            "hover:bg-accent " +
            "active:animate-numpad-press active:bg-sudoku-primary active:text-sudoku-primary-foreground " +
            "disabled:opacity-40 disabled:pointer-events-none ")
      }
    >
      {digit}
    </button>
  );
});
DigitButton.displayName = "DigitButton";

export default NumberPad;
