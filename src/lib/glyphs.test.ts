import { describe, it, expect } from "vitest";
import { collectGlyphs, UI_TEXT } from "@/lib/glyphs";
import { getAllSurnames } from "@/lib/surnames";
import { PREFECTURE_NAMES } from "@/lib/prefectures";

describe("collectGlyphs", () => {
  const glyphs = collectGlyphs();
  const set = new Set([...glyphs]);

  it("重複を含まない", () => {
    expect(set.size).toBe([...glyphs].length);
  });

  it("全苗字の漢字を含む", () => {
    for (const entry of getAllSurnames()) {
      for (const ch of entry.kanji) expect(set.has(ch)).toBe(true);
    }
  });

  it("全苗字の読みを含む", () => {
    for (const entry of getAllSurnames()) {
      for (const r of entry.readings) for (const ch of r) expect(set.has(ch)).toBe(true);
    }
  });

  it("由来の本文の文字を含む", () => {
    for (const entry of getAllSurnames()) {
      for (const ch of entry.origin) expect(set.has(ch)).toBe(true);
    }
  });

  it("47都道府県名の文字を含む", () => {
    for (const name of PREFECTURE_NAMES) {
      for (const ch of name) expect(set.has(ch)).toBe(true);
    }
  });

  it("UI固定文言の文字を含む", () => {
    for (const ch of UI_TEXT) expect(set.has(ch)).toBe(true);
  });

  it("数字と英字と基本記号を含む", () => {
    for (const ch of "0123456789") expect(set.has(ch)).toBe(true);
    for (const ch of "／・（）「」、。") expect(set.has(ch)).toBe(true);
  });
});
