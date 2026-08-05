import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import { THEME_COLOR, THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://sudoku-flax-gamma.vercel.app";
const SITE_DESCRIPTION =
  "언제 어디서든 즐기는 무료 스도쿠 퍼즐 게임. 50개 스테이지, 힌트, 랭킹을 지원하는 PWA.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sudoku",
  description: SITE_DESCRIPTION,
  keywords: ["스도쿠", "sudoku", "숫자 퍼즐", "퍼즐 게임", "무료 게임", "PWA"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sudoku",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "Sudoku",
    title: "Sudoku",
    description: SITE_DESCRIPTION,
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512, alt: "Sudoku" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sudoku",
    description: SITE_DESCRIPTION,
    images: ["/icons/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 단일 값(라이트)으로 두고, 다크일 때는 초기화 스크립트/ThemeToggle이 meta를 갱신한다.
  themeColor: THEME_COLOR.light,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // 초기화 스크립트가 첫 페인트 전에 dark 클래스를 붙이므로 서버 HTML과 어긋난다 (의도된 것)
      suppressHydrationWarning
    >
      <head>
        {/* 첫 페인트 전에 dark 클래스를 심어 새로고침 시 라이트 번쩍임(FOUC)을 막는다 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
