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
});
