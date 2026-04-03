import { AppLayout } from "@/components/layout";
import RankingContent from "./RankingContent";

export const metadata = {
  title: "랭킹 | 스도쿠",
  description: "난이도별 스도쿠 클리어 랭킹을 확인하세요",
};

const RankingPage = () => {
  return (
    <AppLayout headerVariant="ranking">
      <RankingContent />
    </AppLayout>
  );
};

export default RankingPage;
