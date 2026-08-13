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
      <p className="mt-2 text-sm text-sumi-muted">
        順位は名字由来netの集計に基づく参考値です。他の資料では順位が異なることがあります。
      </p>

      <table className="mt-6 w-full border-collapse bg-surface text-left">
        <caption className="sr-only">全国順位順の苗字一覧</caption>
        <thead>
          <tr className="border-b border-keisen text-sm text-sumi-muted">
            <th scope="col" className="px-3 py-2 w-16">順位</th>
            <th scope="col" className="px-3 py-2">苗字</th>
            <th scope="col" className="px-3 py-2">読み</th>
          </tr>
        </thead>
        <tbody>
          {all.map((entry) => (
            <tr key={entry.slug} className="border-b border-keisen">
              <td className="px-3 py-3 text-sumi-muted">{entry.rankNational ?? "―"}</td>
              <td className="px-3 py-3">
                <Link href={`/myoji/${entry.slug}`} className="font-bold underline">
                  {entry.kanji}
                </Link>
              </td>
              <td className="px-3 py-3 text-sumi-muted">{entry.readings.join(" / ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
