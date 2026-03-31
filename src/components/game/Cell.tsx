"use client";

import { memo, useCallback, useMemo } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cell as CellType, Digit } from "@/types/game";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface CellProps {
  /** 셀 데이터 */
  cell: CellType;
  /** 행 인덱스 */
  row: number;
  /** 열 인덱스 */
  col: number;
  /** 현재 선택된 셀인지 */
  isSelected: boolean;
  /** 같은 행/열/박스 하이라이트 */
  isHighlighted: boolean;
  /** 선택된 셀과 같은 숫자 */
  isSameNumber: boolean;
  /** 셀 클릭 핸들러 */
  onSelect: (row: number, col: number) => void;
}

// ────────────────────────────────────────
// 메모 숫자 3×3 그리드
// ────────────────────────────────────────

const MEMO_POSITIONS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const MemoGrid = memo(({ notes }: { notes: Set<Digit> }) => (
  <div className="grid grid-cols-3 grid-rows-3 size-full place-items-center p-px">
    {MEMO_POSITIONS.map((digit) => (
      <span
        key={digit}
        className={cn(
          "flex items-center justify-center",
          "text-[length:var(--text-cell-memo)] font-mono font-normal leading-none",
          notes.has(digit) ? "text-muted-foreground" : "text-transparent",
        )}
      >
        {digit}
      </span>
    ))}
  </div>
));
MemoGrid.displayName = "MemoGrid";

// ────────────────────────────────────────
// 셀 컴포넌트
// ────────────────────────────────────────

const Cell = memo(
  ({
    cell,
    row,
    col,
    isSelected,
    isHighlighted,
    isSameNumber,
    onSelect,
  }: CellProps) => {
    const handleClick = useCallback(() => {
      onSelect(row, col);
    }, [onSelect, row, col]);

    // ── 배경색 결정 (우선순위 기반) ──
    const bgClass = useMemo(() => {
      if (isSelected) return "bg-cell-selected";
      if (cell.isError) return "bg-cell-error";
      if (isSameNumber) return "bg-cell-same-number";
      if (isHighlighted) return "bg-cell-highlighted";
      if (cell.isLocked) return "bg-cell-locked";
      if (cell.isGiven) return "bg-cell-given";
      return "bg-cell-default";
    }, [isSelected, cell.isError, isSameNumber, isHighlighted, cell.isLocked, cell.isGiven]);

    // ── 텍스트 색상 결정 ──
    const textClass = useMemo(() => {
      if (cell.isError) return "text-cell-error-foreground";
      if (isSelected) return "text-cell-selected-foreground";
      if (cell.isGiven) return "text-cell-given-foreground font-bold";
      return "text-cell-default-foreground";
    }, [cell.isError, isSelected, cell.isGiven]);

    // ── 박스 경계 보더 ──
    const borderClass = useMemo(() => {
      const classes: string[] = [];

      // 우측 보더: 3열, 6열 뒤에 두꺼운 선
      if (col === 2 || col === 5) {
        classes.push("border-r-[length:var(--board-gap-thick)] border-r-board-border");
      } else if (col < 8) {
        classes.push("border-r-[length:var(--board-gap-thin)] border-r-board-border-thin");
      }

      // 하단 보더: 3행, 6행 뒤에 두꺼운 선
      if (row === 2 || row === 5) {
        classes.push("border-b-[length:var(--board-gap-thick)] border-b-board-border");
      } else if (row < 8) {
        classes.push("border-b-[length:var(--board-gap-thin)] border-b-board-border-thin");
      }

      return classes.join(" ");
    }, [row, col]);

    // ── 접근성 라벨 ──
    const ariaLabel = useMemo(() => {
      const pos = `${row + 1}행 ${col + 1}열`;
      if (cell.isLocked) return `${pos}, 잠김`;
      if (cell.value) {
        const prefix = cell.isGiven ? "초기값" : "값";
        const suffix = cell.isError ? ", 오류" : "";
        return `${pos}, ${prefix} ${cell.value}${suffix}`;
      }
      if (cell.notes.size > 0) {
        const noteList = Array.from(cell.notes).sort().join(",");
        return `${pos}, 메모 ${noteList}`;
      }
      return `${pos}, 비어있음`;
    }, [row, col, cell.value, cell.isGiven, cell.isError, cell.isLocked, cell.notes]);

    // ── 셀 콘텐츠 ──
    const renderContent = () => {
      if (cell.isLocked) {
        return (
          <div className="flex flex-col items-center gap-0.5">
            <Lock
              className="size-5 text-cell-locked-foreground"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </div>
        );
      }

      if (cell.value) {
        return (
          <span
            className={cn(
              "font-mono text-[length:var(--text-cell)] leading-none",
              "select-none",
              textClass,
              isSameNumber && !isSelected && "font-bold",
            )}
          >
            {cell.value}
          </span>
        );
      }

      if (cell.notes.size > 0) {
        return <MemoGrid notes={cell.notes} />;
      }

      return null;
    };

    return (
      <button
        type="button"
        role="gridcell"
        aria-label={ariaLabel}
        aria-selected={isSelected || undefined}
        aria-invalid={cell.isError || undefined}
        tabIndex={isSelected ? 0 : -1}
        onClick={handleClick}
        className={cn(
          /* 크기 */
          "size-[var(--cell-size)] md:size-[var(--cell-size-md)] lg:size-[var(--cell-size-lg)]",
          /* 레이아웃 */
          "relative flex items-center justify-center",
          /* 배경 & 보더 */
          bgClass,
          borderClass,
          /* 선택된 셀 그림자 */
          isSelected && "shadow-[var(--shadow-cell-selected)] z-[var(--z-cell-highlight)]",
          /* 트랜지션 */
          "transition-[background-color,box-shadow] duration-(--duration-fast) ease-out",
          /* 커서 */
          cell.isLocked ? "cursor-not-allowed" : cell.isGiven ? "cursor-default" : "cursor-pointer",
          /* 잠금 셀 */
          cell.isLocked && "opacity-80",
        )}
      >
        {renderContent()}
      </button>
    );
  },
);
Cell.displayName = "Cell";

export default Cell;
