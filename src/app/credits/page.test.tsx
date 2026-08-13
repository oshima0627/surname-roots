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
    expect(screen.getAllByText(/著作権/).length).toBeGreaterThan(0);
  });

  it("CC BY-SAの家紋は1件残らずライセンス文へのリンクを持つ（Public domainはリンクなし）", () => {
    render(<CreditsPage />);

    // クレジットページはSVGファイル単位で1件だけ表示する（getKamonCredits の重複排除）ため、
    // ここも同じ単位（ファイル）で数える。同じライセンス文字列を持つファイルが複数あっても、
    // 「1件でも欠けたら失敗する」検証にするには「少なくとも1件リンクがある」ではなく、
    // 期待されるリンク数（＝CC BY-SAのファイル数）と実際のリンク数の完全一致を見る必要がある。
    const byFile = new Map<string, string>();
    for (const entry of getAllSurnames()) {
      for (const k of entry.kamon) {
        if (!k.svg) continue;
        byFile.set(k.svg.file, k.svg.license);
      }
    }
    const licenses = [...byFile.values()];
    const ccFileCount = licenses.filter((l) => l.startsWith("CC BY-SA")).length;
    const publicDomainFileCount = licenses.filter((l) => l === "Public domain").length;
    // 前提: CC BY-SAとPublic domainが両方実在すること（そうでなければ以下の検証が空振りする）
    expect(ccFileCount).toBeGreaterThan(0);
    expect(publicDomainFileCount).toBeGreaterThan(0);

    const ccLinks = document.querySelectorAll(
      'a[href="https://creativecommons.org/licenses/by-sa/3.0/"]',
    );
    expect(ccLinks.length).toBe(ccFileCount);

    // "Public domain" はライセンス文が存在しないためリンク化されていないこと
    const publicDomainMatches = screen.getAllByText("Public domain");
    expect(publicDomainMatches.length).toBe(publicDomainFileCount);
    for (const el of publicDomainMatches) {
      expect(el.tagName).not.toBe("A");
    }
  });

  it("使用フォント（Noto Serif JP）の著作権者・ライセンス・サブセットである旨を説明し、OFLライセンス文にリンクする", () => {
    render(<CreditsPage />);
    expect(screen.getByText("使用フォント")).toBeTruthy();
    expect(screen.getByText(/Noto Serif JP/)).toBeTruthy();
    expect(screen.getByText(/サブセット/)).toBeTruthy();
    expect(screen.getByText(/Adobe/)).toBeTruthy();

    const oflLink = screen.getByText(/OFL\.txt/);
    expect(oflLink.tagName).toBe("A");
    expect(oflLink.getAttribute("href")).toBe("/fonts/OFL.txt");
  });
});
