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
