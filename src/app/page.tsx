import { AppLayout } from "@/components/layout";

const HomePage = () => {
  return (
    <AppLayout headerVariant="home">
      <div className="flex flex-1 items-center justify-center">
        <h1 className="text-4xl font-bold">Sudoku</h1>
      </div>
    </AppLayout>
  );
};

export default HomePage;
