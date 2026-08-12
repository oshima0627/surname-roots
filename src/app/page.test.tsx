// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { SurnameSearch } from "@/components/SurnameSearch";
import { getAllSurnames } from "@/lib/surnames";

/**
 * Home() は JSX を返すだけの同期関数なので、DOM に描画せず要素ツリーを
 * そのまま辿って <SurnameSearch> に渡された実際の props を検証できる。
 * DOM のテキストを見るテストでは、SurnameSearch が origin を画面に
 * 一切表示しないため、entries に origin が混入していても素通りしてしまう
 * （getAllSurnames() へ差し替える回帰を検知できない）。props を直接見ることで
 * その回帰を確実に検知する。
 */
function findSurnameSearchProps(node: ReactNode): { entries: unknown[] } | undefined {
  if (node === null || node === undefined || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findSurnameSearchProps(child);
      if (found) return found;
    }
    return undefined;
  }
  const element = node as ReactElement<{ entries?: unknown[]; children?: ReactNode }>;
  if (element.type === SurnameSearch) {
    return element.props as { entries: unknown[] };
  }
  if (element.props?.children !== undefined) {
    return findSurnameSearchProps(element.props.children);
  }
  return undefined;
}

describe("Home (トップページ)", () => {
  it("検索コンポーネントへ渡すインデックスに origin（苗字の由来本文）を含めない", () => {
    // getSearchIndex() ではなく getAllSurnames() を検索インデックスに使うよう
    // 誰かが誤って書き換えた場合、このテストは失敗しなければならない。
    const tree = Home();
    const searchProps = findSurnameSearchProps(tree);
    expect(searchProps).toBeDefined();
    expect(searchProps!.entries.length).toBeGreaterThan(0);
    for (const entry of searchProps!.entries) {
      expect(entry).not.toHaveProperty("origin");
    }
  });

  it("よく調べられる苗字のグリッドから詳細ページへリンクする", () => {
    render(<Home />);
    const top = getAllSurnames()[0];
    const links = screen.getAllByRole("link", { name: new RegExp(top.kanji) });
    expect(links.some((link) => link.getAttribute("href") === `/myoji/${top.slug}`)).toBe(true);
  });

  it("「全国ランキングをすべて見る」が /ranking を指す", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /全国ランキングをすべて見る/ })).toHaveAttribute(
      "href",
      "/ranking",
    );
  });
});
