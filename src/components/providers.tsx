"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import useGuestSync from "@/hooks/useGuestSync";

/** 로그인 전환 시 게스트 기록 자동 동기화 (SessionProvider 내부에서 작동) */
const GuestSyncRunner = () => {
  useGuestSync();
  return null;
};

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <GuestSyncRunner />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default Providers;
