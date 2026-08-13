// 使用文字を集めて Noto Serif JP をサブセットする。
// 入力: vendor/fonts/NotoSerifJP.ttf
// 出力: public/fonts/noto-serif-jp-subset.woff2
import fs from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";

const GLYPH_FILE = path.join(process.cwd(), ".glyphs.txt");
const INPUT = path.join(process.cwd(), "vendor/fonts/NotoSerifJP.ttf");
const OUTDIR = path.join(process.cwd(), "public/fonts");
const OUTPUT = path.join(OUTDIR, "noto-serif-jp-subset.woff2");

if (!fs.existsSync(GLYPH_FILE)) {
  throw new Error(`${GLYPH_FILE} が無い。先に npm run font:glyphs を実行すること`);
}
if (!fs.existsSync(INPUT)) {
  throw new Error(`${INPUT} が無い。フォント本体を vendor/fonts/ に置くこと`);
}

const text = fs.readFileSync(GLYPH_FILE, "utf-8");
const source = fs.readFileSync(INPUT);
const subset = await subsetFont(source, text, { targetFormat: "woff2" });

fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(OUTPUT, subset);

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
console.log(`収録文字数: ${new Set([...text]).size}`);
console.log(`元: ${kb(source.length)} → サブセット: ${kb(subset.length)}`);
