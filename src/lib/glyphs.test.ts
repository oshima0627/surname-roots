import { describe, it, expect } from "vitest";
import { collectGlyphs, formatSourceLabel, UI_TEXT } from "@/lib/glyphs";
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

  it("全苗字の参考資料（sources）を表示用にデコードした文字を含む", () => {
    // formatSourceLabel() を使わず、独立に decodeURIComponent で確かめる。
    // collectGlyphs() 側の実装（formatSourceLabel の呼び出し）が壊れても、
    // このテストは「実際に画面へ出る文字が揃っているか」を別経路で検知できる。
    for (const entry of getAllSurnames()) {
      for (const url of entry.sources) {
        const withoutScheme = url.replace(/^https?:\/\//, "");
        for (const ch of decodeURIComponent(withoutScheme)) {
          expect(set.has(ch)).toBe(true);
        }
      }
    }
  });
});

describe("formatSourceLabel", () => {
  it("スキームを省き、ホスト名とパスを出す", () => {
    expect(formatSourceLabel("https://irohakamon.com/myouji/satou.html")).toBe(
      "irohakamon.com/myouji/satou.html",
    );
  });

  it("パーセントエンコードされたパス・クエリを日本語にデコードする", () => {
    expect(
      formatSourceLabel(
        "https://myoji-yurai.net/searchResult.htm?myojiKanji=%E4%BD%90%E8%97%A4",
      ),
    ).toBe("myoji-yurai.net/searchResult.htm?myojiKanji=佐藤");
  });

  it("同じホストでもパスが異なれば異なるラベルになる", () => {
    const a = formatSourceLabel("https://ja.wikipedia.org/wiki/佐藤");
    const b = formatSourceLabel("https://ja.wikipedia.org/wiki/佐藤氏");
    expect(a).not.toBe(b);
  });

  it("パスが無ければホスト名だけを出す", () => {
    expect(formatSourceLabel("https://myoji-yurai.net/")).toBe("myoji-yurai.net");
  });

  it("httpのURLでもデコードして出す（スキームは表示しないので http/https の違いは出ない）", () => {
    expect(formatSourceLabel("http://www2.harimaya.com/sengoku/html/sano_k.html")).toBe(
      "www2.harimaya.com/sengoku/html/sano_k.html",
    );
  });

  it("URLとして解釈できない文字列はそのまま返す", () => {
    expect(formatSourceLabel("not a url")).toBe("not a url");
  });
});
