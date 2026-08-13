import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "苗字ルーツ辞典",
    template: "%s | 苗字ルーツ辞典",
  },
  description: "日本の苗字の由来・語源と、都道府県別の分布を調べられる辞典です。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link
          rel="preload"
          href="/fonts/noto-serif-jp-subset.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-washi text-sumi antialiased">
        <header className="border-b border-keisen">
          <div className="mx-auto max-w-3xl px-4 py-6">
            <Link href="/" className="text-base tracking-[0.2em] text-sumi">
              苗字ルーツ辞典
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>

        <SiteFooter />
      </body>
    </html>
  );
}
