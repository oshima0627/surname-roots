import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
// fontkit の dist/module.mjs は default export を持たず openSync 等を名前付きで
// export しているため、default import ではなく namespace import を使う。
import * as fontkit from "fontkit";

const FONT = path.join(process.cwd(), "public/fonts/noto-serif-jp-subset.woff2");
const GLYPHS = path.join(process.cwd(), ".glyphs.txt");

describe("サブセットフォントのカバー率", () => {
  it("生成物が存在する", () => {
    expect(fs.existsSync(FONT)).toBe(true);
  });

  it("収集した全文字のグリフを含む", () => {
    const font = fontkit.openSync(FONT);
    const text = fs.readFileSync(GLYPHS, "utf-8");
    const missing = [...new Set([...text])].filter(
      (ch) => font.glyphForCodePoint(ch.codePointAt(0)).id === 0,
    );
    expect(missing).toEqual([]);
  });
});
