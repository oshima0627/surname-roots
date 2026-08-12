// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RankingPage from "@/app/ranking/page";
import { getAllSurnames } from "@/lib/surnames";

describe("RankingPage (全国ランキング)", () => {
  it("データディレクトリに存在する苗字ごとに行を出す", () => {
    render(<RankingPage />);
    const all = getAllSurnames();
    for (const entry of all) {
      expect(screen.getByRole("link", { name: new RegExp(entry.kanji) })).toBeTruthy();
    }
  });

  it("各苗字が自身の詳細ページへリンクする", () => {
    render(<RankingPage />);
    const all = getAllSurnames();
    for (const entry of all) {
      expect(screen.getByRole("link", { name: new RegExp(entry.kanji) })).toHaveAttribute(
        "href",
        `/myoji/${entry.slug}`,
      );
    }
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
