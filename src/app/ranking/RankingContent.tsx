/**
 * 랭킹 페이지 메인 콘텐츠 (클라이언트)
 *
 * 난이도 탭 선택 → 스테이지별 랭킹 조회 → 포디움 + 리스트 표시.
 * 비로그인 시 LoginBanner, 로딩 시 스켈레톤, 에러 시 재시도 버튼.
 *
 * @see docs/design/ranking.md — 와이어프레임
 * @see GitHub Issue #6 — Epic: 랭킹 시스템
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks";
import { useStageRanking } from "@/hooks/useRanking";
import {
  DifficultyTabs,
  StagePicker,
  RankingPodium,
  RankingList,
  RankingEmpty,
  RankingSkeleton,
  RankingError,
  LoginBanner,
  DIFFICULTY_TABS,
  stagesOf,
  type DifficultyTab,
} from "@/components/ranking";

const RankingContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<DifficultyTab>(DIFFICULTY_TABS[0]);
  const [stage, setStage] = useState<number>(DIFFICULTY_TABS[0].startStage);

  const stages = useMemo(() => stagesOf(activeTab), [activeTab]);

  const { data, isLoading, isError, refetch } = useStageRanking(stage);

  // 탭을 바꾸면 그 구간의 첫 스테이지를 기본 선택으로
  const handleTabChange = useCallback((tab: DifficultyTab) => {
    setActiveTab(tab);
    setStage(tab.startStage);
  }, []);

  // 포디움 (1~3위) / 리스트 (4위~) 분리
  const podiumData = data?.rankings.slice(0, 3) ?? [];
  const listData = data?.rankings.slice(3) ?? [];

  return (
    <div className="flex flex-1 flex-col">
      {/* 비로그인 배너 */}
      {!isAuthenticated && (
        <div className="pt-4">
          <LoginBanner />
        </div>
      )}

      {/* 난이도 필터 탭 */}
      <div className="mt-4">
        <DifficultyTabs activeId={activeTab.id} onChange={handleTabChange} />
      </div>

      {/* 스테이지 선택 — key로 탭 전환 시 가로 스크롤 위치를 처음으로 되돌린다 */}
      <StagePicker
        key={activeTab.id}
        stages={stages}
        activeStage={stage}
        onChange={setStage}
      />

      {/* 현재 조회 중인 대상 — 탭 라벨만으로는 어느 스테이지인지 알 수 없다 */}
      <p
        aria-live="polite"
        className="mx-4 text-sm font-semibold text-foreground"
      >
        {activeTab.label}
        <span className="text-muted-foreground"> · </span>
        스테이지 {stage}
        <span className="font-medium text-muted-foreground"> 랭킹</span>
      </p>

      {/* 콘텐츠 영역 */}
      <div className="mx-auto w-full max-w-[600px] flex-1 py-4 lg:max-w-full">
        {isLoading ? (
          <RankingSkeleton />
        ) : isError ? (
          <RankingError onRetry={() => void refetch()} />
        ) : !data || data.rankings.length === 0 ? (
          <RankingEmpty />
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            {/* 포디움 */}
            <div className="lg:w-[360px] lg:shrink-0">
              <RankingPodium rankings={podiumData} />
            </div>

            {/* 리스트 */}
            <div className="flex-1">
              <RankingList
                rankings={listData}
                currentUserId={user?.id ?? null}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingContent;
