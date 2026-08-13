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

  describe("PNG（ラスター）の家紋", () => {
    it("拡張子が.pngなら<img>タグとして表示する（インラインSVGにはしない）", () => {
      const { container } = render(<Kamon file="nadeshiko.png" size={64} />);
      expect(container.querySelector("svg")).toBeNull();
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("/kamon/nadeshiko.png");
    });

    it("指定したサイズを<img>に反映する", () => {
      const { container } = render(<Kamon file="nadeshiko.png" size={84} />);
      const img = container.querySelector("img");
      expect(img?.style.width).toBe("84px");
      expect(img?.style.height).toBe("84px");
    });

    it("装飾要素としてaria-hiddenにし、代替テキストは空にする", () => {
      const { container } = render(<Kamon file="nadeshiko.png" size={64} />);
      const img = container.querySelector("img");
      expect(img?.getAttribute("aria-hidden")).toBe("true");
      expect(img?.getAttribute("alt")).toBe("");
    });

    it("大文字の拡張子（.PNG）でも<img>として扱う", () => {
      const { container } = render(<Kamon file="nadeshiko.PNG" size={64} />);
      expect(container.querySelector("img")).not.toBeNull();
      expect(container.querySelector("svg")).toBeNull();
    });

    it("存在しないPNGファイルを指定すると例外を投げる（<img>はブラウザ側の参照でしかなく" +
      "readFileSyncのように自動では失敗しないため、明示的な存在確認が必要）", () => {
      expect(() => render(<Kamon file="nonexistent.png" size={64} />)).toThrow(
        /家紋画像ファイルが見つかりません/,
      );
    });

    it("拡張子の大文字小文字が違っても、存在確認はPNGパスに入る（SVGの読み込みにフォールバックしない）", () => {
      // 実ファイルは小文字（nadeshiko.png）のため大文字拡張子の指定自体は存在しないファイル扱いになるが、
      // エラーメッセージがPNGパス側のものであることから、SVGパスに落ちていないと確認できる。
      expect(() => render(<Kamon file="nonexistent.PNG" size={64} />)).toThrow(
        /家紋画像ファイルが見つかりません/,
      );
    });
  });

  describe("対応していない拡張子", () => {
    it("svg/png以外の拡張子を指定すると例外を投げる（バイナリをSVGとして誤読し、文字化けをそのまま表示することを防ぐ）", () => {
      expect(() => render(<Kamon file="nadeshiko.jpg" size={64} />)).toThrow(
        /対応していない家紋ファイル形式です/,
      );
    });

    it("拡張子が無いファイル名でも例外を投げる", () => {
      expect(() => render(<Kamon file="nadeshiko" size={64} />)).toThrow(
        /対応していない家紋ファイル形式です/,
      );
    });
  });
});
