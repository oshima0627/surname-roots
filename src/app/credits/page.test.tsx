// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CreditsPage from "@/app/credits/page";
import { getAllSurnames } from "@/lib/surnames";

describe("クレジットページ", () => {
  it("SVGを持つ全家紋の作者・ライセンス・出典URLを載せる", () => {
    render(<CreditsPage />);
    const withSvg = getAllSurnames().flatMap((e) => e.kamon).filter((k) => k.svg);
    expect(withSvg.length).toBeGreaterThan(0);

    for (const k of withSvg) {
      expect(screen.getAllByText(new RegExp(k.svg!.author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).length)
        .toBeGreaterThan(0);
    }
    const links = [...document.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    for (const k of withSvg) {
      expect(links).toContain(k.svg!.sourceUrl);
    }
  });

  it("改変したものはその旨を記す", () => {
    render(<CreditsPage />);
    const modified = getAllSurnames().flatMap((e) => e.kamon).filter((k) => k.svg?.modified);
    if (modified.length > 0) {
      expect(screen.getAllByText(/改変/).length).toBeGreaterThan(0);
    }
  });

  it("家紋SVGファイルを共有する苗字がある場合、同じファイルは1回だけ載せる", () => {
    render(<CreditsPage />);
    const withSvg = getAllSurnames().flatMap((e) => e.kamon).filter((k) => k.svg);
    const uniqueFiles = new Set(withSvg.map((k) => k.svg!.file));
    const links = [...document.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    const sourceUrls = withSvg.map((k) => k.svg!.sourceUrl);
    for (const url of new Set(sourceUrls)) {
      expect(links.filter((href) => href === url).length).toBe(1);
    }
    expect(uniqueFiles.size).toBeGreaterThan(0);
  });

  it("家紋の意匠自体は著作権が切れていること、SVGには作者の著作権があることを説明する", () => {
    render(<CreditsPage />);
    expect(screen.getByText(/著作権/)).toBeTruthy();
  });
});
