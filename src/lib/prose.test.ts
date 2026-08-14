import { describe, it, expect } from "vitest";
import { getAllSurnames } from "@/lib/surnames";

/**
 * 本文に日本語以外の文字列が紛れ込んでいないかを見る。
 *
 * 執筆中に別言語の単語がそのまま残る事故が実際に2件起きた
 * （英語の "women"、ロシア語の "главный"）。どちらもレビューを通り抜けたので、
 * 機械的に検出できるようにしてある。
 *
 * NHK・JAXA・iPS のような正当なラテン文字は多数あるため、ラテン文字は
 * 「小文字だけで3字以上続く語」に限って弾く（固有名詞・略号は大文字を含む）。
 * キリル文字・ハングルは本文に出る理由がないので一律で弾く。
 */
const LOWER_LATIN_WORD = /(?<![A-Za-z])[a-z]{3,}(?![A-Za-z])/g;
const NON_JAPANESE_SCRIPT = /[Ѐ-ӿ가-힯]/g;

/**
 * 出典としてドメイン名を本文に書く場合がある（例: 「myoji-yurai.netも…と伝えている」）。
 * これは意図した表記なので、走査の前に取り除く。
 */
// 大文字を含む社名・サービス名（DMM.com など）も同じ形なので大小を区別しない。
// ドットを挟まない語（women, главный といった実際に起きた混入）は素通りしないので、
// 検出力は落ちない
const DOMAIN = /[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
/** 出典サービス名。ドット無しでラテン文字が混じるので個別に除く */
const SERVICE_NAMES = /名字由来net/g;
const strip = (s: string) => s.replace(SERVICE_NAMES, "").replace(DOMAIN, "");

describe("本文の言語", () => {
  const all = getAllSurnames();
  const texts = all.flatMap((e) => [
    { slug: e.slug, field: "origin", text: e.origin },
    { slug: e.slug, field: "originRegion", text: e.originRegion },
    ...e.famousPeople.map((p) => ({ slug: e.slug, field: `famousPeople:${p.name}`, text: p.note })),
    ...e.kamon.map((k) => ({ slug: e.slug, field: `kamon:${k.name}`, text: k.description })),
  ]);

  it("キリル文字・ハングルが混入していない", () => {
    const hits = texts
      .map((t) => ({ ...t, found: t.text.match(NON_JAPANESE_SCRIPT) ?? [] }))
      .filter((t) => t.found.length > 0)
      .map((t) => `${t.slug}/${t.field}: ${t.found.join("")}`);
    expect(hits).toEqual([]);
  });

  it("小文字だけのラテン語句が混入していない", () => {
    const hits = texts
      .map((t) => ({ ...t, found: strip(t.text).match(LOWER_LATIN_WORD) ?? [] }))
      .filter((t) => t.found.length > 0)
      .map((t) => `${t.slug}/${t.field}: ${t.found.join(",")}`);
    expect(hits).toEqual([]);
  });
});
