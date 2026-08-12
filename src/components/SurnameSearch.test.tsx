// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurnameSearch } from "@/components/SurnameSearch";
import type { SearchTarget } from "@/lib/surnames";

const entries: SearchTarget[] = [
  { slug: "sato", kanji: "佐藤", readings: ["さとう"], rankNational: 1 },
  { slug: "suzuki", kanji: "鈴木", readings: ["すずき"], rankNational: 2 },
];

describe("SurnameSearch", () => {
  it("初期状態では結果を出さない", () => {
    render(<SurnameSearch entries={entries} />);
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("入力すると一致する苗字を出す", async () => {
    const user = userEvent.setup();
    render(<SurnameSearch entries={entries} />);
    await user.type(screen.getByRole("searchbox"), "すず");
    expect(screen.getByRole("link", { name: /鈴木/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /佐藤/ })).toBeNull();
  });

  it("該当がなければ、収録されていないと伝える", async () => {
    const user = userEvent.setup();
    render(<SurnameSearch entries={entries} />);
    await user.type(screen.getByRole("searchbox"), "存在しない");
    expect(screen.getByText(/収録されていません/)).toBeTruthy();
  });

  it("結果のリンクが詳細ページを指す", async () => {
    const user = userEvent.setup();
    render(<SurnameSearch entries={entries} />);
    await user.type(screen.getByRole("searchbox"), "佐藤");
    expect(screen.getByRole("link", { name: /佐藤/ })).toHaveAttribute("href", "/myoji/sato");
  });
});
