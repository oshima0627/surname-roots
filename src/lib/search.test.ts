import { describe, it, expect } from "vitest";
import { normalizeQuery, searchSurnames } from "@/lib/search";
import type { SearchTarget } from "@/lib/surnames";

const entries: SearchTarget[] = [
  { slug: "sato", kanji: "佐藤", readings: ["さとう"], rankNational: 1 },
  { slug: "suzuki", kanji: "鈴木", readings: ["すずき"], rankNational: 2 },
  { slug: "takahashi", kanji: "高橋", readings: ["たかはし"], rankNational: 3 },
  { slug: "kono", kanji: "河野", readings: ["こうの", "かわの"], rankNational: 80 },
];

describe("normalizeQuery", () => {
  it("カタカナをひらがなに変換する", () => {
    expect(normalizeQuery("サトウ")).toBe("さとう");
  });

  it("前後の空白を落とす", () => {
    expect(normalizeQuery("  佐藤  ")).toBe("佐藤");
  });

  it("ひらがなと漢字はそのまま返す", () => {
    expect(normalizeQuery("さとう")).toBe("さとう");
    expect(normalizeQuery("佐藤")).toBe("佐藤");
  });

  it("範囲の最初の文字ァを変換する", () => {
    expect(normalizeQuery("ァ")).toBe("ぁ");
  });

  it("範囲の最後の文字ヶを変換する", () => {
    expect(normalizeQuery("ヶ")).toBe("ゖ");
  });

  it("長音記号ーは範囲外で変換されない", () => {
    expect(normalizeQuery("ー")).toBe("ー");
  });
});

describe("searchSurnames", () => {
  it("漢字の完全一致で引ける", () => {
    expect(searchSurnames(entries, "佐藤").map((e) => e.slug)).toEqual(["sato"]);
  });

  it("漢字の部分一致で引ける", () => {
    expect(searchSurnames(entries, "藤").map((e) => e.slug)).toEqual(["sato"]);
  });

  it("ひらがなの読みで引ける", () => {
    expect(searchSurnames(entries, "すずき").map((e) => e.slug)).toEqual(["suzuki"]);
  });

  it("カタカナで入力しても読みで引ける", () => {
    expect(searchSurnames(entries, "スズキ").map((e) => e.slug)).toEqual(["suzuki"]);
  });

  it("複数ある読みのどれでも引ける", () => {
    expect(searchSurnames(entries, "かわの").map((e) => e.slug)).toEqual(["kono"]);
    expect(searchSurnames(entries, "こうの").map((e) => e.slug)).toEqual(["kono"]);
  });

  it("空文字では何も返さない", () => {
    expect(searchSurnames(entries, "")).toEqual([]);
    expect(searchSurnames(entries, "   ")).toEqual([]);
  });

  it("該当なしでは空配列を返す", () => {
    expect(searchSurnames(entries, "存在しない苗字")).toEqual([]);
  });

  it("結果は元の並び順（順位昇順）を保つ", () => {
    const hits = searchSurnames(entries, "");
    expect(hits).toEqual([]);
    expect(searchSurnames(entries, "う").map((e) => e.slug)).toEqual(["sato", "kono"]);
  });
});
