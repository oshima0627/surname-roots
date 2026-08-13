import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-keisen">
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-sumi-muted">
        <p>本サイトの解説は諸説あるうちの一説です。</p>
        <p className="mt-3">
          <Link href="/ranking" className="underline">
            全国ランキング
          </Link>
        </p>
      </div>
    </footer>
  );
}
