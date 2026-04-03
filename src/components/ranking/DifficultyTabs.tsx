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
    <div className="relative flex border-b border-border" role="tablist">
      {DIFFICULTY_TABS.map((tab) => {
        const isActive = tab.id === activeId;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              "relative flex-1 py-3 text-sm font-medium transition-colors duration-200",
              isActive
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}

            {/* 활성 인디케이터 */}
            {isActive && (
              <span
                className={cn(
                  "absolute bottom-0 left-1/2 h-0.5 w-3/4 -translate-x-1/2 rounded-full transition-all duration-200",
                  tab.activeClass,
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default DifficultyTabs;
