// 使用文字を集めて Noto Serif JP をサブセットする。
// 入力: vendor/fonts/NotoSerifJP.ttf
// 出力: public/fonts/noto-serif-jp-subset.woff2, public/fonts/OFL.txt
import fs from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";
// fontkit の dist/module.mjs は default export を持たず openSync 等を名前付きで
// export しているため、default import ではなく namespace import を使う
// （scripts/font-coverage.test.mjs と同じ理由）。
import * as fontkit from "fontkit";

const GLYPH_FILE = path.join(process.cwd(), ".glyphs.txt");
const INPUT = path.join(process.cwd(), "vendor/fonts/NotoSerifJP.ttf");
const OFL_INPUT = path.join(process.cwd(), "vendor/fonts/OFL.txt");
const OUTDIR = path.join(process.cwd(), "public/fonts");
const OUTPUT = path.join(OUTDIR, "noto-serif-jp-subset.woff2");
const OFL_OUTPUT = path.join(OUTDIR, "OFL.txt");

if (!fs.existsSync(GLYPH_FILE)) {
  throw new Error(`${GLYPH_FILE} が無い。先に npm run font:glyphs を実行すること`);
}
if (!fs.existsSync(INPUT)) {
  throw new Error(`${INPUT} が無い。フォント本体を vendor/fonts/ に置くこと`);
}
if (!fs.existsSync(OFL_INPUT)) {
  throw new Error(`${OFL_INPUT} が無い。ライセンス文を vendor/fonts/ に置くこと`);
}

const text = fs.readFileSync(GLYPH_FILE, "utf-8");
const source = fs.readFileSync(INPUT);
const subset = await subsetFont(source, text, { targetFormat: "woff2" });

fs.mkdirSync(OUTDIR, { recursive: true });
fs.writeFileSync(OUTPUT, subset);

// subset-font（harfbuzz）は name テーブルの ID 0-6 だけを残すため、サブセット後の
// woff2 からは license/licenseURL レコードが失われる（copyright レコードは残る）。
// OFL 1.1 §2 は「フォントの各コピーに著作権表示とライセンス文を添付すること」を
// 求めるため、配布物（サブセットフォント）と一緒にライセンス文を public/ へ置く。
//
// vendor/fonts/OFL.txt の1行目は "Copyright 2012 Google Inc. All Rights Reserved."
// だが、実際に同梱している vendor/fonts/NotoSerifJP.ttf の name テーブルの
// copyright レコードは "(c) 2017-2024 Adobe (http://www.adobe.com/)." になっている
// （Google Fonts 配布元の OFL.txt が更新されていない）。配布する著作権表示は
// 実際に配っているフォントのものと一致させる必要があるため、name テーブルの値で
// 1行目を置き換えてから public/ に書き出す。
const sourceFont = fontkit.openSync(INPUT);
const actualCopyright = sourceFont.copyright;
if (!actualCopyright) {
  throw new Error("フォントの name テーブルに copyright レコードが無い");
}
const correctedNotice = actualCopyright.replace(/^\(c\)/, "Copyright");

const oflLines = fs.readFileSync(OFL_INPUT, "utf-8").split("\n");
oflLines[0] = correctedNotice;
fs.writeFileSync(OFL_OUTPUT, oflLines.join("\n"));

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
console.log(`収録文字数: ${new Set([...text]).size}`);
console.log(`元: ${kb(source.length)} → サブセット: ${kb(subset.length)}`);
console.log(`フォント著作権表示（name テーブル）: ${actualCopyright}`);
console.log(`OFL.txt 1行目を書き換えて出力: ${correctedNotice}`);
