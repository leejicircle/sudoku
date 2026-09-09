/**
 * 스테이지 선택 칩 목록
 *
 * 난이도 탭 아래에서 그 구간의 스테이지를 하나 고른다.
 * 스도쿠는 스테이지마다 퍼즐이 달라 같은 스테이지끼리만 기록을 겨룰 수 있으므로,
 * 구간을 묶지 않고 스테이지 단위로 랭킹을 조회한다.
 *
 * 한 줄 가로 스크롤 — 전문가 구간 20개도 세로 공간을 먹지 않고,
 * 데스크톱에서는 스크롤 없이 한 줄에 다 들어간다.
 */

"use client";

import { cn } from "@/lib/utils";

interface StagePickerProps {
  /** 표시할 스테이지 번호 목록 */
  stages: number[];
  /** 현재 선택된 스테이지 */
  activeStage: number;
  /** 스테이지 변경 콜백 */
  onChange: (stage: number) => void;
}

const StagePicker = ({ stages, activeStage, onChange }: StagePickerProps) => {
  return (
    <div
      role="group"
      aria-label="스테이지 선택"
      className="flex gap-1.5 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {stages.map((stage) => {
        const isActive = stage === activeStage;

        return (
          <button
            key={stage}
            type="button"
            aria-pressed={isActive}
            aria-label={`스테이지 ${stage}`}
            onClick={() => onChange(stage)}
            className={cn(
              "size-11 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border text-sm tabular-nums transition-colors duration-(--duration-normal)",
              isActive
                ? "border-foreground bg-foreground font-semibold text-background"
                : "border-input font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {stage}
          </button>
        );
      })}
    </div>
  );
};

export default StagePicker;
