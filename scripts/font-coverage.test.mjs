import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
// fontkit の dist/module.mjs は default export を持たず openSync 等を名前付きで
// export しているため、default import ではなく namespace import を使う。
import * as fontkit from "fontkit";

const FONT = path.join(process.cwd(), "public/fonts/noto-serif-jp-subset.woff2");
const GLYPHS = path.join(process.cwd(), ".glyphs.txt");
const OFL = path.join(process.cwd(), "public/fonts/OFL.txt");

describe("サブセットフォントのカバー率", () => {
  it("生成物が存在する", () => {
    expect(fs.existsSync(FONT)).toBe(true);
  });

  it("OFLライセンス文が同梱され、著作権表示がフォント本体の name テーブルと一致する", () => {
    expect(fs.existsSync(OFL)).toBe(true);
    const font = fontkit.openSync(path.join(process.cwd(), "vendor/fonts/NotoSerifJP.ttf"));
    const actualCopyright = font.copyright;
    const [firstLine] = fs.readFileSync(OFL, "utf-8").split("\n");
    // OFL.txt の1行目は "(c)" を "Copyright" に置き換えたもの（subset-font が
    // サブセット後の name テーブルから license/licenseURL を落とすため、配布する
    // ライセンス文の著作権表示は元フォントの実際の記録と一致させている）。
    expect(firstLine).toBe(actualCopyright.replace(/^\(c\)/, "Copyright"));
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
