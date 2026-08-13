import type { Metadata } from "next";
import { Kamon } from "@/components/Kamon";
import { getAllSurnames } from "@/lib/surnames";
import type { SurnameEntry } from "@/lib/schema";

export const metadata: Metadata = {
  title: "クレジット",
  description: "掲載している家紋SVGの出典・作者・ライセンスと、改変内容の一覧です。",
};

type KamonSvg = NonNullable<SurnameEntry["kamon"][number]["svg"]>;
type KamonCredit = KamonSvg & { name: string; surnames: string[] };

/**
 * 家紋SVGのファイル単位でクレジットをまとめる。
 * 同じファイルを複数の苗字が共有することがあるため、1件ずつにまとめて
 * 重複掲載を避ける（掲載順はファイル名の昇順で固定する）。
 */
function getKamonCredits(): KamonCredit[] {
  const byFile = new Map<string, KamonCredit>();
  for (const entry of getAllSurnames()) {
    for (const k of entry.kamon) {
      if (!k.svg) continue;
      const existing = byFile.get(k.svg.file);
      if (existing) {
        if (!existing.surnames.includes(entry.kanji)) existing.surnames.push(entry.kanji);
        continue;
      }
      byFile.set(k.svg.file, { ...k.svg, name: k.name, surnames: [entry.kanji] });
    }
  }
  return [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file));
}

export default function CreditsPage() {
  const credits = getKamonCredits();

  return (
    <div>
      <h1 className="text-2xl font-bold">クレジット</h1>

      <div className="mt-4 space-y-3 text-sumi-muted">
        <p>
          家紋の意匠そのものは多くが数百年前に成立したもので、著作権は存続していません。
          一方、ここに掲げるSVGファイル（意匠を実際に描画したデータ）には、
          それを作成した作者の著作権があります。意匠の自由さとファイルの著作権は別のものとして、
          出典を記録しています。
        </p>
        <p>
          このサイトで配布しているSVGは、すべて元のファイルに改変（塗り色を currentColor
          へ変更するなど）を加えたものです。CC BY-SA
          でライセンスされたファイルの改変版は、同一のライセンス（CC BY-SA）の下で提供します。
        </p>
      </div>

      <ul className="mt-10 divide-y divide-keisen">
        {credits.map((c) => (
          <li key={c.file} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start">
            <Kamon file={c.file} size={64} />
            <dl className="grid grid-cols-[5.5em_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-sumi-muted">紋名</dt>
              <dd className="font-bold">{c.name}</dd>
              <dt className="text-sumi-muted">使用苗字</dt>
              <dd>{c.surnames.join("・")}</dd>
              <dt className="text-sumi-muted">作者</dt>
              <dd>{c.author}</dd>
              <dt className="text-sumi-muted">ライセンス</dt>
              <dd>{c.license}</dd>
              <dt className="text-sumi-muted">出典</dt>
              <dd>
                <a href={c.sourceUrl} className="underline break-all">
                  {c.sourceUrl}
                </a>
              </dd>
              <dt className="text-sumi-muted">改変</dt>
              <dd>{c.modified ? "改変あり" : "改変なし"}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
