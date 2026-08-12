// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SiteFooter from "@/components/SiteFooter";

describe("SiteFooter", () => {
  it("should render the disclaimer text", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText("本サイトの解説は諸説あるうちの一説です。")
    ).toBeTruthy();
  });
});
