"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import useGuestSync from "@/hooks/useGuestSync";
import useOfflineClearSync from "@/hooks/useOfflineClearSync";
import { registerServiceWorker } from "@/lib/utils/sw-register";

/** 로그인 전환 시 게스트 기록 자동 동기화 (SessionProvider 내부에서 작동) */
const GuestSyncRunner = () => {
  useGuestSync();
  return null;
};

/** 온라인 복귀 시 오프라인 클리어 큐 자동 전송 */
const OfflineClearSyncRunner = () => {
  useOfflineClearSync();
  return null;
};

/** 서비스워커 등록 (프로덕션에서만 — 개발 중 캐싱 혼란 방지) */
const ServiceWorkerRunner = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") registerServiceWorker();
  }, []);
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
        <OfflineClearSyncRunner />
        <ServiceWorkerRunner />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default Providers;
