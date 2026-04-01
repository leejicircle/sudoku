"use client";

import { Lock, ClipboardCheck } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import type { LockCondition } from "@/types/game";

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────

interface LockedCellPopoverProps {
  /** 잠금 해제 조건 목록 */
  conditions: LockCondition[];
  /** 팝오버 열림 상태 */
  open: boolean;
  /** 열림 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 트리거 요소 (Cell 버튼) */
  children: React.ReactNode;
}

// ────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────

/**
 * 잠금 셀 탭 시 표시되는 팝오버
 *
 * 잠금 조건 목록과 진행 상태를 표시한다.
 * 디자인 명세: docs/design/lock-popover.md
 */
const LockedCellPopover = ({
  conditions,
  open,
  onOpenChange,
  children,
}: LockedCellPopoverProps) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger nativeButton={false} render={(props) => <div {...props} style={{ display: "contents" }}>{children}</div>} />

      <PopoverContent
        side="top"
        sideOffset={8}
        className="w-60 gap-0 p-4"
      >
        {/* 제목 행 */}
        <div className="flex items-center gap-2">
          <Lock className="size-[18px] shrink-0 text-muted-foreground" />
          <p className="text-(length:--text-body) font-semibold text-foreground">
            잠금된 칸입니다
          </p>
        </div>

        {/* 설명 */}
        <p className="mt-2 text-(length:--text-caption) text-muted-foreground">
          조건을 충족하면 해금됩니다.
        </p>

        {/* 해금 조건 목록 */}
        <div className="mt-3 flex flex-col gap-1.5">
          {/* TODO: LockCondition에 진행률 데이터 추가 시 진행 상태(예: "3/9 완료") 표시 */}
          {conditions.map((condition) => (
            <div
              key={`${condition.type}-${condition.target}`}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-muted px-3 py-2.5"
            >
              <ClipboardCheck className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="text-[13px] font-medium text-foreground">
                {condition.description}
              </span>
            </div>
          ))}
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={() => onOpenChange(false)}
          className={
            "mt-3 w-full rounded-[var(--radius-md)] " +
            "bg-secondary px-4 py-2 " +
            "text-(length:--text-caption) font-medium text-secondary-foreground " +
            "transition-colors duration-(--duration-fast) " +
            "hover:bg-secondary/80 " +
            "cursor-pointer"
          }
        >
          확인
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default LockedCellPopover;
