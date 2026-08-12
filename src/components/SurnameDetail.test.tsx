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
  kamon: [{ name: "下がり藤", description: "藤原氏ゆかりの家紋。" }],
  famousPeople: [{ name: "佐藤栄作", note: "第61-63代内閣総理大臣" }],
  sources: ["https://example.com/sato"],
};

describe("SurnameDetail", () => {
  it("漢字を見出しに出す", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("佐藤");
  });

  it("全国順位と推定人口を出す", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.getByText(/全国1位/)).toBeTruthy();
    expect(screen.getByText(/約190万人/)).toBeTruthy();
  });

  it("由来の本文を出す", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.getByText(/藤原氏に由来する/)).toBeTruthy();
  });

  it("家紋と有名人を出す", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.getByText("下がり藤")).toBeTruthy();
    expect(screen.getByText("佐藤栄作")).toBeTruthy();
  });

  it("家紋が空なら家紋セクション自体を出さない", () => {
    render(<SurnameDetail entry={{ ...entry, kamon: [] }} />);
    expect(screen.queryByRole("heading", { name: "家紋" })).toBeNull();
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

  it("裏取り用の sources を画面に出さない", () => {
    render(<SurnameDetail entry={entry} />);
    expect(screen.queryByText(/example\.com/)).toBeNull();
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
