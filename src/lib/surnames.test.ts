import { describe, it, expect } from "vitest";
import { getAllSurnames, getSurnameBySlug, getSearchIndex } from "@/lib/surnames";

describe("getAllSurnames", () => {
  const all = getAllSurnames();

  it("データを1件以上読み込む", () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it("全件がスキーマに適合する（読み込み時にparseされる）", () => {
    // getAllSurnames が内部で parse するので、例外なく返ればスキーマ適合
    expect(() => getAllSurnames()).not.toThrow();
  });

  it("slug に重複がない", () => {
    const slugs = all.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("ファイル名と slug が一致する", () => {
    // slug はURLの一次情報なので、ファイル名とずれると探せなくなる
    for (const entry of all) {
      expect(getSurnameBySlug(entry.slug)?.kanji).toBe(entry.kanji);
    }
  });

  it("全国順位の昇順で返る", () => {
    const ranks = all.map((e) => e.rankNational ?? Number.MAX_SAFE_INTEGER);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it("同じ県が「多い」と「やや多い」の両方に入っていない", () => {
    for (const entry of all) {
      const { 多い, やや多い } = entry.regionDistribution;
      expect(多い.filter((p) => やや多い.includes(p))).toEqual([]);
    }
  });

  // 「独立2ソース」のうち機械的に検証できる部分を固定する。
  // 同一サイト内の別ページを2本並べて「2ソース」と称する経路を塞ぐのが目的。
  // 実測（2026-08-14）では既存100件すべてが sources 4本以上・ホスト2種類以上だった
  it("sources が2本以上あり、異なるホストを2つ以上含む", () => {
    const violations = all
      .map((entry) => ({
        slug: entry.slug,
        count: entry.sources.length,
        hosts: new Set(entry.sources.map((url) => new URL(url).host)).size,
      }))
      .filter((v) => v.count < 2 || v.hosts < 2);
    expect(violations).toEqual([]);
  });

  it("rankNational に重複がない", () => {
    const ranks = all.map((e) => e.rankNational).filter((r): r is number => r !== null);
    const seen = new Set<number>();
    const duplicated = ranks.filter((r) => (seen.has(r) ? true : (seen.add(r), false)));
    expect(duplicated).toEqual([]);
  });
});

describe("getSurnameBySlug", () => {
  it("存在する slug を引ける", () => {
    expect(getSurnameBySlug("sato")?.kanji).toBe("佐藤");
  });

  it("存在しない slug は undefined を返す", () => {
    expect(getSurnameBySlug("nonexistent")).toBeUndefined();
  });
});

describe("getSearchIndex", () => {
  it("検索に必要な項目だけを返す", () => {
    const index = getSearchIndex();
    expect(index[0]).toEqual({
      slug: expect.any(String),
      kanji: expect.any(String),
      readings: expect.any(Array),
      rankNational: expect.any(Number),
    });
  });

  it("本文（origin）を含まない（クライアントに送る量を抑えるため）", () => {
    expect(getSearchIndex()[0]).not.toHaveProperty("origin");
  });
});

describe("memoization and mutation protection", () => {
  it("getAllSurnames() は複数呼び出しで同じデータを返す", () => {
    const first = getAllSurnames();
    const second = getAllSurnames();
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
  });

  it("getAllSurnames() の戻り値を変更しても、次の呼び出しに影響しない", () => {
    const first = getAllSurnames();
    if (first.length > 0) {
      // 最初の呼び出しの配列を変更
      first.length = 0;
    }
    const second = getAllSurnames();
    // 2回目の呼び出しは元のデータが返されていること
    expect(second.length).toBeGreaterThan(0);
  });
});
