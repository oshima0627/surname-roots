import { describe, it, expect } from "vitest";
import { surnameEntrySchema } from "@/lib/schema";

const valid = {
  slug: "sato",
  kanji: "佐藤",
  readings: ["さとう"],
  rankNational: 1,
  populationEstimate: "約190万人",
  origin: "藤原氏に由来するとされる。".repeat(20),
  originRegion: "藤原氏の流れを汲むとされる",
  regionDistribution: { 多い: ["岩手", "秋田"], やや多い: ["宮城"] },
  kamon: [{ name: "下がり藤", description: "藤原氏ゆかりの家紋。" }],
  famousPeople: [{ name: "佐藤栄作", note: "第61-63代内閣総理大臣" }],
  sources: ["https://example.com/sato"],
};

describe("surnameEntrySchema", () => {
  it("正しいデータを受け入れる", () => {
    expect(surnameEntrySchema.parse(valid)).toMatchObject({ slug: "sato" });
  });

  it("slug が英小文字とハイフン以外を含むと弾く", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, slug: "佐藤" })).toThrow();
  });

  it("readings が空配列だと弾く", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, readings: [] })).toThrow();
  });

  it("origin が短すぎると弾く", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, origin: "短い" })).toThrow();
  });

  it("存在しない県名を弾く", () => {
    const broken = { ...valid, regionDistribution: { 多い: ["東京都"], やや多い: [] } };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("rankNational は null を許す", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, rankNational: null })).not.toThrow();
  });

  it("kamon と famousPeople は空配列を許す", () => {
    expect(() =>
      surnameEntrySchema.parse({ ...valid, kamon: [], famousPeople: [] }),
    ).not.toThrow();
  });

  it("sources が空配列だと弾く（裏取りの証跡を必須にする）", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, sources: [] })).toThrow();
  });

  it("同じ県が「多い」と「やや多い」に重複していると弾く", () => {
    const broken = { ...valid, regionDistribution: { 多い: ["岩手"], やや多い: ["岩手"] } };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("「多い」と「やや多い」が重複していなければ受け入れる", () => {
    const ok = { ...valid, regionDistribution: { 多い: ["岩手"], やや多い: ["秋田"] } };
    expect(() => surnameEntrySchema.parse(ok)).not.toThrow();
  });

  it("origin が100文字の空白だと弾く", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, origin: " ".repeat(100) })).toThrow();
  });
});

const kamonWithSvg = {
  name: "剣梅鉢",
  description: "梅鉢に五本の剣を配した紋。",
  svg: {
    file: "kaga-umebachi.svg",
    license: "CC BY-SA 3.0",
    author: "User:Mukai",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.svg",
    modified: true,
  },
};

describe("家紋のライセンス情報", () => {
  it("svg を持たない家紋は従来どおり通る", () => {
    const e = { ...valid, kamon: [{ name: "撫子", description: "撫子の花の紋。" }] };
    expect(() => surnameEntrySchema.parse(e)).not.toThrow();
  });

  it("svg を持つ家紋は全項目が揃っていれば通る", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, kamon: [kamonWithSvg] })).not.toThrow();
  });

  it("author が欠けていると弾く", () => {
    const { author: _omitted, ...rest } = kamonWithSvg.svg;
    const broken = { ...valid, kamon: [{ ...kamonWithSvg, svg: rest }] };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("license が空文字だと弾く", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, license: "" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("sourceUrl が http で始まらないと弾く", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, sourceUrl: "commons.wikimedia.org" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("modified が真偽値でないと弾く", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, modified: "yes" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("file がPNG（ラスター）でも、出典情報が揃っていれば通る（形式は拡張子で判別し、必須項目は変わらない）", () => {
    const kamonWithPng = {
      ...kamonWithSvg,
      svg: { ...kamonWithSvg.svg, file: "nadeshiko.png" },
    };
    expect(() => surnameEntrySchema.parse({ ...valid, kamon: [kamonWithPng] })).not.toThrow();
  });

  it("file がPNGでもauthorが欠けていると弾く（形式に関わらず出典必須は変わらない）", () => {
    const { author: _omitted, ...rest } = kamonWithSvg.svg;
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...rest, file: "nadeshiko.png" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("file の拡張子がsvg/png以外だと弾く（表示側はこの2形式しか振り分けられないため）", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, file: "kaga-umebachi.jpg" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("file に拡張子が無いと弾く", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, file: "kaga-umebachi" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });
});
