"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** 뒤로가기 버튼 — router.back() 호출 */
const BackButton = () => {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors duration-100 hover:bg-accent"
      aria-label="뒤로 가기"
    >
      <ChevronLeft className="size-6" />
    </button>
  );
};

export default BackButton;
