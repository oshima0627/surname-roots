// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Kamon } from "@/components/Kamon";

describe("Kamon", () => {
  it("public/kamon/*.svg をインラインのsvg要素として展開する（imgタグは使わない）", () => {
    const { container } = render(<Kamon file="janome.svg" size={64} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("fillをcurrentColorのまま保ち、色はサイトの藍（text-ai）に委ねる", () => {
    const { container } = render(<Kamon file="janome.svg" size={64} />);
    expect(container.querySelector("[fill='currentColor']")).not.toBeNull();
    expect(container.querySelector("span")?.className).toContain("text-ai");
  });

  it("指定したサイズをコンテナに反映する", () => {
    const { container } = render(<Kamon file="janome.svg" size={84} />);
    const wrapper = container.querySelector("span");
    expect(wrapper?.style.width).toBe("84px");
    expect(wrapper?.style.height).toBe("84px");
  });

  it("装飾要素としてaria-hiddenにする（紋名は別途テキストで表示される前提）", () => {
    const { container } = render(<Kamon file="janome.svg" size={64} />);
    expect(container.querySelector("span")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("存在しないファイルを指定すると例外を投げる（壊れたデータを黙って表示しない）", () => {
    expect(() => render(<Kamon file="nonexistent.svg" size={64} />)).toThrow();
  });
});
