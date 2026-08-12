// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import RankingPage from "@/app/ranking/page";
import { getAllSurnames } from "@/lib/surnames";

/**
 * 日本語の苗字は互いの部分文字列になっていることが珍しくない
 * （例: 林 ⊂ 小林）。したがって、苗字の漢字を name に使った
 * getByRole の正規表現マッチは、データが増えるほど衝突しやすく
 * 構造的に破綻する。ここでは名前（テキスト）でリンクを一意に
 * 特定するのではなく、一意性が保証されている href（/myoji/<slug>）で
 * 要素を特定し、そのうえで表示テキストを検証する。
 */
function findLinkBySlug(slug: string) {
  const links = screen.getAllByRole("link");
  return links.find((link) => link.getAttribute("href") === `/myoji/${slug}`);
}

describe("RankingPage (全国ランキング)", () => {
  it("データディレクトリに存在する苗字ごとに行を出す", () => {
    render(<RankingPage />);
    const all = getAllSurnames();
    const table = screen.getByRole("table");
    const tbody = table.querySelector("tbody");
    expect(tbody).not.toBeNull();
    const rows = within(tbody as HTMLElement).getAllByRole("row");
    // 行数は苗字の件数と一致する（ヘッダー行は tbody に含まれない）
    expect(rows).toHaveLength(all.length);
  });

  it("各苗字が自身の詳細ページへリンクする", () => {
    render(<RankingPage />);
    const all = getAllSurnames();
    for (const entry of all) {
      const link = findLinkBySlug(entry.slug);
      expect(link, `${entry.slug} へのリンクが見つからない`).toBeTruthy();
      expect(link).toHaveAttribute("href", `/myoji/${entry.slug}`);
      expect(link).toHaveTextContent(entry.kanji);
    }
  });

  it("順位の典拠と参照元による違いを明示する注記を出す", () => {
    render(<RankingPage />);
    expect(
      screen.getByText(
        "順位は名字由来netの集計に基づく参考値です。他の資料では順位が異なることがあります。",
      ),
    ).toBeTruthy();
  });

  it("行が全国順位の昇順で並ぶ", () => {
    render(<RankingPage />);
    const all = getAllSurnames();
    const links = screen.getAllByRole("link");
    const renderedSlugOrder = links.map((link) => link.getAttribute("href"));
    const expectedOrder = all.map((entry) => `/myoji/${entry.slug}`);
    expect(renderedSlugOrder).toEqual(expectedOrder);
  });
});
