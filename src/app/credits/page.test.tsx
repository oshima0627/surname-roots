// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CreditsPage from "@/app/credits/page";

describe("クレジットページ", () => {
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
