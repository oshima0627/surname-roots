import Link from "next/link";

export default function SiteFooter() {
  return (
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
  );
}
