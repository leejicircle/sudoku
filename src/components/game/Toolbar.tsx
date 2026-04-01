"use client";

import { memo, useCallback, useMemo } from "react";
import { Undo2, Eraser, PenLine, Lightbulb } from "lucide-react";
import { useGameStore } from "@/stores/game-store";

// ────────────────────────────────────────
// ToolButton 서브 컴포넌트
// ────────────────────────────────────────

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  /** 활성 상태 (메모 ON 등) */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * 도구바 개별 버튼
 *
 * - 기본: transparent 배경, muted-foreground 텍스트
 * - 활성: sudoku-primary 색상 + 10% 배경
 * - 비활성: opacity 0.4
 *
 * @see docs/design/game.md §4.2
 */
const ToolButton = memo(
  ({ icon, label, active = false, disabled = false, onClick }: ToolButtonProps) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active ? "true" : undefined}
      className={
        "flex flex-1 flex-col items-center justify-center gap-0.5 " +
        "h-12 rounded-[var(--radius-md)] " +
        "transition-colors duration-[var(--duration-fast)] " +
        (disabled
          ? "opacity-40 pointer-events-none text-muted-foreground "
          : active
            ? "bg-sudoku-primary/10 text-sudoku-primary "
            : "text-muted-foreground hover:bg-accent ")
      }
    >
      {icon}
      <span className="text-[11px] font-normal leading-none">{label}</span>
    </button>
  ),
);
ToolButton.displayName = "ToolButton";

// ────────────────────────────────────────
// Toolbar 컴포넌트
// ────────────────────────────────────────

interface ToolbarProps {
  className?: string;
}

/**
 * 게임 도구바
 *
 * 되돌리기 | 지우기 | 메모 | 힌트(N)
 *
 * - flex 4등분, gap 8px, 48px 높이
 * - 아이콘 20px, 라벨 11px
 *
 * @see docs/design/game.md §4 도구바
 */
const Toolbar = ({ className = "" }: ToolbarProps) => {
  const selectedCell = useGameStore((s) => s.selectedCell);
  const board = useGameStore((s) => s.board);
  const isNoteMode = useGameStore((s) => s.isNoteMode);
  const isComplete = useGameStore((s) => s.isComplete);
  const isPaused = useGameStore((s) => s.isPaused);
  const history = useGameStore((s) => s.history);
  const undo = useGameStore((s) => s.undo);
  const clearValue = useGameStore((s) => s.clearValue);
  const toggleNoteMode = useGameStore((s) => s.toggleNoteMode);

  // ── 되돌리기 가능 여부 ──
  const canUndo = history.length > 0 && !isComplete && !isPaused;

  // ── 지우기 가능 여부 ──
  const canErase = useMemo(() => {
    if (!selectedCell || isComplete || isPaused) return false;
    const cell = board[selectedCell.row]?.[selectedCell.col];
    return !!cell && !cell.isGiven && !cell.isLocked && cell.value !== null;
  }, [selectedCell, board, isComplete, isPaused]);

  // ── 핸들러 ──
  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleErase = useCallback(() => {
    if (!selectedCell) return;
    clearValue(selectedCell.row, selectedCell.col);
  }, [selectedCell, clearValue]);

  const handleToggleMemo = useCallback(() => {
    toggleNoteMode();
  }, [toggleNoteMode]);

  // 보드가 비어있으면 렌더링하지 않음
  if (board.length === 0) return null;

  return (
    <div
      className={`flex gap-2 w-full ${className}`}
      role="toolbar"
      aria-label="게임 도구"
    >
      <ToolButton
        icon={<Undo2 size={20} />}
        label="되돌리기"
        disabled={!canUndo}
        onClick={handleUndo}
      />
      <ToolButton
        icon={<Eraser size={20} />}
        label="지우기"
        disabled={!canErase}
        onClick={handleErase}
      />
      <ToolButton
        icon={<PenLine size={20} />}
        label="메모"
        active={isNoteMode}
        disabled={isComplete || isPaused}
        onClick={handleToggleMemo}
      />
      <ToolButton
        icon={<Lightbulb size={20} />}
        label="힌트(3)"
        disabled={true} // TODO: 힌트 시스템 구현 후 활성화
        onClick={() => {}} // TODO: 힌트 액션 연결
      />
    </div>
  );
};

export default Toolbar;
