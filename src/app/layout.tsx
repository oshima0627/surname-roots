import type { Metadata } from "next";
import Link from "next/link";
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
      <body className="bg-stone-50 text-stone-900 antialiased">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-wide">
              苗字ルーツ辞典
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-stone-600">
            <p>本サイトの解説は諸説あるうちの一説です。</p>
            <p className="mt-2">
              <Link href="/ranking" className="underline">
                全国ランキング
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
