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

const kamonWithSvg: SurnameEntry["kamon"][number] = {
  name: "源氏車",
  description: "車輪をかたどった意匠。",
  svg: {
    file: "genji-guruma.svg",
    license: "CC BY-SA 3.0 (also GFDL 1.2+)",
    author: "User:Mukai",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Japanese_Crest_Gennji_kuruma.svg",
    modified: true,
  },
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

  describe("家紋の表示（3通りの状態）", () => {
    it("SVGを持つ家紋があれば見出し横に紋を出す", () => {
      render(<SurnameDetail entry={{ ...entry, kamon: [kamonWithSvg] }} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.parentElement?.querySelector("svg")).not.toBeNull();
    });

    it("家紋はあってもSVGが無ければ見出し横は空のままにする", () => {
      render(<SurnameDetail entry={entry} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.parentElement?.querySelector("svg")).toBeNull();
    });

    it("家紋データ自体が無ければ見出し横は空のままにする", () => {
      render(<SurnameDetail entry={{ ...entry, kamon: [] }} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.parentElement?.querySelector("svg")).toBeNull();
    });

    it("3通りの状態のいずれでも見出しの漢字はコンテナの同じ左端位置から始まる（紋の有無で動かない）", () => {
      const withSvg = render(<SurnameDetail entry={{ ...entry, kamon: [kamonWithSvg] }} />);
      const withoutSvg = render(<SurnameDetail entry={entry} />);
      const noKamon = render(<SurnameDetail entry={{ ...entry, kamon: [] }} />);

      // jsdomにはレイアウトエンジンが無いため getBoundingClientRect は使えない。
      // 代わりに、見出しの漢字がflexの先頭要素であり続けることをDOM構造で検証する
      // （紋の要素は必ず後続の兄弟として追加/省略され、h1の前には来ない）。
      for (const { container } of [withSvg, withoutSvg, noKamon]) {
        const heading = container.querySelector("h1");
        expect(heading?.parentElement?.firstElementChild).toBe(heading);
      }
    });

    it("SVGを持たない家紋は破線の枠と、内部事情めいた言い方や将来の追加を約束しない短い文言を出す", () => {
      const { container } = render(<SurnameDetail entry={entry} />);
      expect(container.querySelector(".border-dashed")).not.toBeNull();
      expect(screen.getByText("画像なし")).toBeTruthy();
      expect(screen.queryByText(/図案未収録/)).toBeNull();
      expect(screen.queryByText(/準備中/)).toBeNull();
    });

    it("SVGを持つ家紋は家紋欄にも紋を表示する", () => {
      const { container } = render(
        <SurnameDetail entry={{ ...entry, kamon: [kamonWithSvg] }} />,
      );
      expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
    });
  });
});
