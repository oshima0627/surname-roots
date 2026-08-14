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

  // getSurnameBySlug は詳細ページ1枚につき1回呼ばれるので、収録件数に対して
  // 線形時間で済まなければならない。全件を deep clone してから find すると
  // O(n^2) になり、530件で実測1.5秒かかっていた（1000件では約4倍）。
  // Map 参照なら件数によらず数ミリ秒で終わるので、1秒は十分に緩い上限
  it("全件を slug 引きしても1秒以内に終わる", () => {
    const started = Date.now();
    for (const entry of all) getSurnameBySlug(entry.slug);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  // 呼び出し側が書き換えてもキャッシュが汚れないことを保証する。
  // 高速化のために参照をそのまま返すと、この保証が静かに壊れる
  it("getSurnameBySlug の戻り値を書き換えてもキャッシュが汚れない", () => {
    const slug = all[0].slug;
    const original = getSurnameBySlug(slug)!.kanji;
    getSurnameBySlug(slug)!.kanji = "改竄";
    expect(getSurnameBySlug(slug)!.kanji).toBe(original);
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
