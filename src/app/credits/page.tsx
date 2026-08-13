import path from "node:path";
import type { Metadata } from "next";
// fontkit の dist/module.mjs は default export を持たず openSync 等を名前付きで
// export しているため、default import ではなく namespace import を使う
// （scripts/build-font.mjs, scripts/font-coverage.test.mjs と同じ理由）。
import * as fontkit from "fontkit";
import type { Font } from "fontkit";
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
 * `src/data/surnames/*.json` の `kamon[].svg.license` に現れる文字列から、
 * ライセンス文（CC BY-SA 3.0）の実際のURLへの厳密なマップ。
 *
 * CC BY-SA 3.0 §4(a) は「配布する各コピーにライセンス文（またはそのURI）を
 * 添付すること」を求めている。データには表記ゆれが3種類あるが、Commonsの
 * ファイルページを確認した限りいずれも実際に選べるバージョンは3.0のみ
 * （docs/kamon-credits.md の[注1][注2]参照）なので、リンク先は同一でよい。
 * "Public domain" はライセンス文が存在しないためリンクしない。
 *
 * ゆるいパターンマッチ（"CC BY-SA" を含むかどうか等）ではなく文字列の完全一致で
 * 引くのは、間違ったライセンスへのリンクはリンク無しより有害なため。
 * 未知の文字列は意図的にリンクなし（安全側）で扱う。
 */
const CC_BY_SA_3_0_URL = "https://creativecommons.org/licenses/by-sa/3.0/";
const KAMON_LICENSE_URLS: Record<string, string> = {
  "CC BY-SA 3.0": CC_BY_SA_3_0_URL,
  "CC BY-SA 3.0 / GFDL 1.2+": CC_BY_SA_3_0_URL,
  "CC BY-SA 3.0 (also GFDL 1.2+)": CC_BY_SA_3_0_URL,
};

const OFL_URL = "/fonts/OFL.txt";

/**
 * 配布しているサブセットフォントの著作権表示を、フォント本体（vendor/fonts/NotoSerifJP.ttf）
 * の name テーブルから直接読み取る。scripts/build-font.mjs が public/fonts/OFL.txt へ
 * 書き出す表記と同じ変換（"(c)" → "Copyright"）をここでも行い、常に一致させる。
 * public/fonts/ はgitignore対象で `npm test` 単体では生成されないため、そちらではなく
 * リポジトリに入っている vendor/fonts/NotoSerifJP.ttf を直接読む。
 */
function getFontCopyright(): string {
  // vendor/fonts/NotoSerifJP.ttf は単体の .ttf であり .ttc コレクションではないため、
  // 常に Font（FontCollection ではない）が返る。
  const font = fontkit.openSync(path.join(process.cwd(), "vendor/fonts/NotoSerifJP.ttf")) as Font;
  return font.copyright.replace(/^\(c\)/, "Copyright");
}

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
  const fontCopyright = getFontCopyright();

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
              <dd>
                {KAMON_LICENSE_URLS[c.license] ? (
                  <a href={KAMON_LICENSE_URLS[c.license]} className="underline">
                    {c.license}
                  </a>
                ) : (
                  c.license
                )}
              </dd>
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

      <section className="mt-10 border-t border-keisen pt-8">
        <h2 className="text-lg font-bold">使用フォント</h2>
        <dl className="mt-4 grid grid-cols-[5.5em_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-sumi-muted">フォント名</dt>
          <dd>Noto Serif JP（本文の明朝体として、表示に必要な文字だけを抜き出したサブセット版を配信）</dd>
          <dt className="text-sumi-muted">著作権者</dt>
          <dd>{fontCopyright}</dd>
          <dt className="text-sumi-muted">ライセンス</dt>
          <dd>
            <a href={OFL_URL} className="underline">
              SIL Open Font License, Version 1.1（OFL.txt）
            </a>
          </dd>
        </dl>
      </section>
    </div>
  );
}
