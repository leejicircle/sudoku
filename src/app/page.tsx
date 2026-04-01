import { AppLayout } from "@/components/layout";
import HomeContent from "./HomeContent";

const HomePage = () => {
  return (
    <AppLayout headerVariant="home">
      <HomeContent />
    </AppLayout>
  );
};

export default HomePage;
