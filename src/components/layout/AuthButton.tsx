"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";

/** 로그인/프로필 아이콘 버튼 — 세션 상태에 따라 변형 */
const AuthButton = () => {
  const { data: session } = useSession();

  if (session?.user) {
    const img = session.user.image;
    const name = session.user.name ?? "";

    return (
      <Link href="/login" className="flex size-11 items-center justify-center">
        {img ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={img}
            alt={name}
            className="size-8 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="flex size-11 items-center justify-center text-muted-foreground transition-colors duration-100 hover:text-foreground"
      aria-label="로그인"
    >
      <User className="size-6" />
    </Link>
  );
};

export default AuthButton;
