import Link from "next/link";
import type { Metadata } from "next";
import { getAllSurnames } from "@/lib/surnames";

export const metadata: Metadata = {
  title: "全国ランキング",
  description: "収録している苗字を全国順位の順に一覧できます。",
};

export default function RankingPage() {
  const all = getAllSurnames();

  return (
    <div>
      <h1 className="text-2xl font-bold">全国ランキング</h1>
      <p className="mt-2 text-sm text-stone-600">順位は概略です。</p>

      <table className="mt-6 w-full border-collapse bg-white text-left">
        <caption className="sr-only">全国順位順の苗字一覧</caption>
        <thead>
          <tr className="border-b border-stone-300 text-sm text-stone-600">
            <th scope="col" className="px-3 py-2 w-16">順位</th>
            <th scope="col" className="px-3 py-2">苗字</th>
            <th scope="col" className="px-3 py-2">読み</th>
          </tr>
        </thead>
        <tbody>
          {all.map((entry) => (
            <tr key={entry.slug} className="border-b border-stone-200">
              <td className="px-3 py-3 text-stone-600">{entry.rankNational ?? "―"}</td>
              <td className="px-3 py-3">
                <Link href={`/myoji/${entry.slug}`} className="font-bold underline">
                  {entry.kanji}
                </Link>
              </td>
              <td className="px-3 py-3 text-stone-600">{entry.readings.join(" / ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
