// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SurnameDetail } from "@/components/SurnameDetail";
import type { SurnameEntry } from "@/lib/schema";

const entry: SurnameEntry = {
  slug: "sato",
  kanji: "佐藤",
  readings: ["さとう"],
  rankNational: 1,
  populationEstimate: "約190万人",
  origin: "藤原氏に由来するとされる。".repeat(20),
  originRegion: "藤原氏の流れを汲むとされる",
  regionDistribution: { 多い: ["岩手"], やや多い: [] },
  famousPeople: [{ name: "佐藤栄作", note: "第61-63代内閣総理大臣" }],
  sources: [
    "https://ja.wikipedia.org/wiki/佐藤",
    "https://ja.wikipedia.org/wiki/佐藤氏",
    "https://myoji-yurai.net/searchResult.htm?myojiKanji=%E4%BD%90%E8%97%A4",
  ],
};

describe("SurnameDetail", () => {
  it("漢字を見出しに出す", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("佐藤");
  });

  it("全国順位と推定人口を出す", () => {
    // 数字だけ font-tabular の子 span に分かれているため、getByText の既定の
    // getNodeText（要素直下のテキストノードのみを見る）ではラベルと数字を
    // つなげた文字列にマッチできない。container.textContent で通しの表示文字列を検証する。
    const { container } = render(<SurnameDetail entry={entry} />);
    const summary = container.querySelector("p.mt-3");
    expect(summary?.textContent).toContain("全国1位");
    expect(summary?.textContent).toContain("約190万人");
  });

  it("順位・人口の数字だけを等幅フォントにし、ラベルの漢字は明朝のまま残す", () => {
    const { container } = render(<SurnameDetail entry={entry} />);
    const summary = container.querySelector("p.mt-3") as HTMLElement;
    const tabularSpans = Array.from(summary.querySelectorAll(".font-tabular"));
    // 数字（1, 190）だけが font-tabular 側に入っている
    expect(tabularSpans.map((el) => el.textContent).join("")).toBe("1190");
    // 表示テキスト全体としては変わらない（ラベルの漢字は明朝のまま外側に残る）
    expect(summary.textContent).toBe("全国1位約190万人");
  });

  it("由来の本文を出す", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.getByText(/藤原氏に由来する/)).toBeTruthy();
  });

  it("有名人を出す", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.getByText("佐藤栄作")).toBeTruthy();
  });

  it("有名人が空なら有名人セクション自体を出さない", () => {
    render(<SurnameDetail entry={{ ...entry, famousPeople: [] }} />);
    expect(screen.queryByRole("heading", { name: /有名人/ })).toBeNull();
  });

  it("読みが1つだけならバリエーションのセクションを出さない", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.queryByRole("heading", { name: /読み方/ })).toBeNull();
  });

  it("読みが複数あればバリエーションを出す", () => {
    render(<SurnameDetail entry={{ ...entry, readings: ["こうの", "かわの"] }} />);
    expect(screen.getByRole("heading", { name: /読み方/ })).toBeTruthy();
  });

  it("順位が不明なら順位を出さない", () => {
    render(<SurnameDetail entry={{ ...entry, rankNational: null }} />);
    expect(screen.queryByText(/全国.*位/)).toBeNull();
  });

  it("順位を出すときは出典と参照元による違いを明示する", () => {
    render(<SurnameDetail entry={entry} />);
    expect(
      screen.getByText("出典: 名字由来net。順位は参照元によって異なることがあります。"),
    ).toBeTruthy();
  });

  it("順位が不明なら出典の注記も出さない", () => {
    render(<SurnameDetail entry={{ ...entry, rankNational: null }} />);
    expect(screen.queryByText(/名字由来net/)).toBeNull();
  });

  describe("参考資料（sources）の表示", () => {
    it("sources の全URLを、元のURLへのリンクとして出す", () => {
      render(<SurnameDetail entry={entry} />);
      const heading = screen.getByRole("heading", { name: "参考資料" });
      const list = heading.parentElement?.querySelector("ul") as HTMLElement;
      const links = Array.from(list.querySelectorAll("a"));
      expect(links).toHaveLength(entry.sources.length);
      expect(links.map((a) => a.getAttribute("href")).sort()).toEqual(
        [...entry.sources].sort(),
      );
    });

    it("外部リンクとして安全な属性（target=_blank・rel=noopener noreferrer）を付ける", () => {
      render(<SurnameDetail entry={entry} />);
      const heading = screen.getByRole("heading", { name: "参考資料" });
      const links = heading.parentElement?.querySelectorAll("ul a") ?? [];
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.getAttribute("target")).toBe("_blank");
        const rel = link.getAttribute("rel") ?? "";
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
      }
    });

    it("スクリーンリーダー向けに外部サイトであることを伝えるテキストを持つ", () => {
      render(<SurnameDetail entry={entry} />);
      const heading = screen.getByRole("heading", { name: "参考資料" });
      const links = heading.parentElement?.querySelectorAll("ul a") ?? [];
      for (const link of links) {
        expect(link.textContent).toContain("（外部サイト）");
      }
    });

    it("URLをパーセントエンコードのまま出さず、日本語を読める形にデコードして出す", () => {
      const { container } = render(<SurnameDetail entry={entry} />);
      // %E4%BD%90%E8%97%A4 は「佐藤」のパーセントエンコード表記
      expect(screen.queryByText(/%E4%BD%90%E8%97%A4/)).toBeNull();
      const link = container.querySelector(
        'a[href="https://myoji-yurai.net/searchResult.htm?myojiKanji=%E4%BD%90%E8%97%A4"]',
      );
      expect(link?.textContent).toContain("myoji-yurai.net/searchResult.htm?myojiKanji=佐藤");
    });

    it("同じホストの複数URLでも、リンク文字列が互いに異なり区別できる", () => {
      render(<SurnameDetail entry={entry} />);
      const heading = screen.getByRole("heading", { name: "参考資料" });
      const links = Array.from(heading.parentElement?.querySelectorAll("ul a") ?? []);
      const wikipediaLinks = links.filter((a) =>
        (a.getAttribute("href") ?? "").includes("ja.wikipedia.org"),
      );
      expect(wikipediaLinks.length).toBeGreaterThan(1);
      const labels = wikipediaLinks.map((a) => a.textContent);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("sources が空なら参考資料セクション自体を出さない", () => {
      render(<SurnameDetail entry={{ ...entry, sources: [] }} />);
      expect(screen.queryByRole("heading", { name: "参考資料" })).toBeNull();
    });
  });

  it("推定人口が空文字なら人口を出さない", () => {
    render(<SurnameDetail entry={{ ...entry, populationEstimate: "" }} />);
    expect(screen.queryByText(/約190万人/)).toBeNull();
  });

  it("順位も人口も不明なら空の段落を残さない", () => {
    const { container } = render(
      <SurnameDetail entry={{ ...entry, rankNational: null, populationEstimate: "" }} />,
    );
    expect(container.querySelector("p.mt-3")).toBeNull();
  });

});
