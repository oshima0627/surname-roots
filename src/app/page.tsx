import Link from "next/link";
import { SurnameSearch } from "@/components/SurnameSearch";
import { getAllSurnames, getSearchIndex } from "@/lib/surnames";

export default function Home() {
  const index = getSearchIndex();
  const top20 = getAllSurnames().slice(0, 20);

  return (
    <div>
      <h1 className="text-2xl font-bold">苗字のルーツを調べる</h1>
      <p className="mt-2 text-sumi-muted">
        漢字でも、ひらがな・カタカナでも探せます。
      </p>

      <div className="mt-6">
        <SurnameSearch entries={index} />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-bold border-l-4 border-ai pl-3">よく調べられる苗字</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {top20.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/myoji/${entry.slug}`}
                className="block rounded-lg border border-keisen bg-surface px-3 py-4 text-center hover:border-ai"
              >
                <span className="block font-bold">{entry.kanji}</span>
                <span className="block text-xs text-sumi-muted">{entry.readings[0]}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href="/ranking" className="underline">
            全国ランキングをすべて見る
          </Link>
        </p>
      </section>
    </div>
  );
}
