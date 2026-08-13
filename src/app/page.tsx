import Link from "next/link";
import { SurnameSearch } from "@/components/SurnameSearch";
import { getAllSurnames, getSearchIndex } from "@/lib/surnames";

/**
 * カードの漢字サイズを文字数で調整する。
 * 2列グリッド・375px幅でも横スクロールが出ないよう、3文字以上は一段小さくする。
 */
function cardKanjiSizeClass(length: number): string {
  return length >= 3 ? "text-3xl" : "text-4xl";
}

export default function Home() {
  const index = getSearchIndex();
  const top20 = getAllSurnames().slice(0, 20);

  return (
    <div>
      <h1 className="text-2xl font-bold">苗字のルーツを調べる</h1>
      <p className="mt-3 text-sumi-muted">
        漢字でも、ひらがな・カタカナでも探せます。
      </p>

      <div className="mt-10">
        <SurnameSearch entries={index} />
      </div>

      <section className="mt-20">
        <h2 className="flex items-center gap-4 text-lg font-bold after:h-px after:flex-1 after:bg-keisen after:content-['']">
          よく調べられる苗字
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {top20.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/myoji/${entry.slug}`}
                className="block border border-keisen bg-surface px-3 py-6 text-center hover:border-ai"
              >
                <span
                  className={`block font-bold leading-none ${cardKanjiSizeClass(entry.kanji.length)}`}
                >
                  {entry.kanji}
                </span>
                <span className="mt-3 block text-xs text-sumi-muted">{entry.readings[0]}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <Link href="/ranking" className="underline">
            全国ランキングをすべて見る
          </Link>
        </p>
      </section>
    </div>
  );
}
