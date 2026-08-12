// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JapanMap } from "@/components/JapanMap";

const distribution = { 多い: ["岩手", "秋田"], やや多い: ["宮城"] };

describe("JapanMap", () => {
  it("47都道府県すべてのタイルを描く", () => {
    const { container } = render(<JapanMap distribution={distribution} />);
    expect(container.querySelectorAll("[data-prefecture]")).toHaveLength(47);
  });

  it("「多い」の県に level=high を付ける", () => {
    const { container } = render(<JapanMap distribution={distribution} />);
    expect(container.querySelector('[data-prefecture="岩手"]')).toHaveAttribute(
      "data-level",
      "high",
    );
  });

  it("「やや多い」の県に level=mid を付ける", () => {
    const { container } = render(<JapanMap distribution={distribution} />);
    expect(container.querySelector('[data-prefecture="宮城"]')).toHaveAttribute(
      "data-level",
      "mid",
    );
  });

  it("該当しない県は level=none にする（塗らない）", () => {
    const { container } = render(<JapanMap distribution={distribution} />);
    expect(container.querySelector('[data-prefecture="沖縄"]')).toHaveAttribute(
      "data-level",
      "none",
    );
  });

  it("順位ではなく傾向であることを凡例に明示する", () => {
    render(<JapanMap distribution={distribution} />);
    expect(screen.getByText(/概略/)).toBeTruthy();
  });

  it("SVG内の凡例グループが存在する", () => {
    const { container } = render(<JapanMap distribution={distribution} />);
    const svgLegend = container.querySelector('[data-testid="svg-legend"]');
    expect(svgLegend).toBeTruthy();
    expect(svgLegend?.parentElement?.tagName).toBe("svg");
  });

  it("SVG凡例は hidden sm:block クラスを持つ（sm以下では非表示、sm以上で表示）", () => {
    const { container } = render(<JapanMap distribution={distribution} />);
    const svgLegend = container.querySelector('[data-testid="svg-legend"]');
    expect(svgLegend).toHaveClass("hidden");
    expect(svgLegend).toHaveClass("sm:block");
  });

  it("HTML凡例がfigcaptionに存在する", () => {
    const { container } = render(<JapanMap distribution={distribution} />);
    const htmlLegend = container.querySelector('[data-testid="html-legend"]');
    expect(htmlLegend).toBeTruthy();
    expect(htmlLegend?.closest("figcaption")).toBeTruthy();
  });

  it("※免責事項が表示される", () => {
    render(<JapanMap distribution={distribution} />);
    expect(screen.getByText(/着色のない県はデータがないことを意味します/)).toBeTruthy();
  });
});
