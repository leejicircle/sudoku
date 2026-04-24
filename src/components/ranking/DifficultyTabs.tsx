/**
 * 난이도 필터 탭
 *
 * 쉬움 / 보통 / 어려움 / 전문가 4개 탭을 균등 분할하고,
 * 활성 탭 하단에 난이도 색상 인디케이터를 표시한다.
 *
 * @see docs/design/ranking.md §3 — 난이도 필터 탭
 */

"use client";

import { cn } from "@/lib/utils";
import { DIFFICULTY_TABS, type DifficultyTab } from "./ranking-utils";

interface DifficultyTabsProps {
  /** 현재 선택된 탭 ID */
  activeId: string;
  /** 탭 변경 콜백 */
  onChange: (tab: DifficultyTab) => void;
}

const DifficultyTabs = ({ activeId, onChange }: DifficultyTabsProps) => {
  return (
    <div
      className="mx-4 flex gap-1.5 rounded-full border border-border/60 bg-card/70 p-1.5 backdrop-blur-md"
      role="tablist"
    >
      {DIFFICULTY_TABS.map((tab) => {
        const isActive = tab.id === activeId;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-all duration-(--duration-normal)",
              isActive
                ? "bg-sudoku-primary/12 text-sudoku-primary ring-1 ring-sudoku-primary/25 shadow-sm"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {/* 활성 도트 인디케이터 */}
            <span
              className={cn(
                "size-1.5 rounded-full transition-opacity",
                tab.activeClass,
                isActive ? "opacity-100" : "opacity-40",
              )}
              aria-hidden="true"
            />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default DifficultyTabs;
