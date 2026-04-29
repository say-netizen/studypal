import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import dynamic from "next/dynamic";
import "@/styles/tokens.css";
import "@/styles/animations.css";
import "./globals.css";

// Firebase はブラウザ専用のため SSR を無効にして動的インポート
const ClientProviders = dynamic(
  () => import("@/components/providers/ClientProviders"),
  { ssr: false }
);

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyPal — AIで楽しく学ぶ、ゲーム感覚の学習アプリ",
  description:
    "小学5年生〜中学3年生向けのAI学習アプリ。Duolingo×Linearの体験で、毎日続けたくなる学びを。",
  keywords: ["学習アプリ", "AI", "小学生", "中学生", "ゲーミフィケーション", "StudyPal"],
  manifest: "/manifest.json",
  themeColor: "#A0522D",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "StudyPal" },
  openGraph: {
    title: "StudyPal — AIで楽しく学ぶ",
    description: "毎日続けたくなるAI学習体験",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${nunito.variable} ${inter.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased">
        <ClientProviders>{children}</ClientProviders>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}} />
      </body>
    </html>
  );
}
