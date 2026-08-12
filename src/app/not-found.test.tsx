// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("収録されていないことを伝え、不具合と誤解させない", () => {
    render(<NotFound />);
    expect(screen.getByText(/収録されていません/)).toBeTruthy();
  });

  it("トップへ戻る導線がある", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /検索/ })).toBeTruthy();
  });
});
