// ファビコンを生成する。
//
// サイトが実際に配信している明朝体サブセットから「苗」のグリフ輪郭を取り出し、
// 藍（COLORS.ai）の角丸square に生成り（COLORS.washi）で描く。
// 文字を <text> で書かず輪郭パスに変換するのは、閲覧側のフォント環境に依存させないため。
//
// 生成物（すべてリポジトリにコミットする）:
//   src/app/icon.svg      … モダンブラウザ向けのベクター
//   src/app/favicon.ico   … 16/32/48px を束ねた ICO
//   src/app/apple-icon.png… 180x180
//
// このスクリプトは `npm run build` からは呼ばない。意匠を変えたいときだけ手で実行する。
// sharp は Next.js の推移的依存なので、将来消えても生成済みアセットはそのまま使える。
import fs from "node:fs";
import path from "node:path";
// fontkit の dist/module.mjs は default export を持たないので名前空間で受ける
// （scripts/build-font.mjs と同じ理由）
import * as fontkit from "fontkit";

const ROOT = path.join(import.meta.dirname, "..");
const FONT = path.join(ROOT, "public/fonts/noto-serif-jp-subset.woff2");
const APP = path.join(ROOT, "src/app");

// src/lib/colors.ts と同じ値。ズレたら test が落ちる
const AI = "#1f3f5e";
const WASHI = "#f7f4ed";
const CHAR = "苗";
const SIZE = 64; // SVG の viewBox 一辺
const GLYPH_RATIO = 0.68; // 字面が占める割合。小さすぎると 16px で潰れる

function glyphPath() {
  const font = fontkit.openSync(FONT);
  const glyph = font.layout(CHAR).glyphs[0];
  if (!glyph || glyph.id === 0) throw new Error(`サブセットに「${CHAR}」が無い`);
  const { unitsPerEm } = font;
  const bbox = glyph.bbox;
  const glyphW = bbox.maxX - bbox.minX;
  const glyphH = bbox.maxY - bbox.minY;
  const scale = (SIZE * GLYPH_RATIO) / Math.max(glyphW, glyphH);
  // フォント座標は Y が上向き。SVG は下向きなので反転し、中央へ寄せる
  const tx = SIZE / 2 - ((bbox.minX + glyphW / 2) * scale);
  const ty = SIZE / 2 + ((bbox.minY + glyphH / 2) * scale);
  return {
    d: glyph.path.toSVG(),
    transform: `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(6)} ${(-scale).toFixed(6)})`,
    unitsPerEm,
  };
}

const { d, transform } = glyphPath();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="苗字ルーツ辞典">
  <rect width="${SIZE}" height="${SIZE}" rx="12" fill="${AI}"/>
  <g transform="${transform}"><path d="${d}" fill="${WASHI}"/></g>
</svg>
`;
fs.writeFileSync(path.join(APP, "icon.svg"), svg);
console.log("icon.svg を生成");

// ---- ラスター（sharp があるときだけ）----
let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.log("sharp が無いのでラスターは生成しない（icon.svg のみ更新）");
  process.exit(0);
}

const png = (size) =>
  sharp(Buffer.from(svg)).resize(size, size, { fit: "contain" }).png({ compressionLevel: 9 }).toBuffer();

const [p16, p32, p48, p180] = await Promise.all([png(16), png(32), png(48), png(180)]);

fs.writeFileSync(path.join(APP, "apple-icon.png"), p180);
console.log("apple-icon.png を生成 (180x180)");

// ICO は PNG をそのまま格納できる。ヘッダ 6 バイト + エントリ 16 バイト × n
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // パレット数
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

fs.writeFileSync(
  path.join(APP, "favicon.ico"),
  ico([
    { size: 16, data: p16 },
    { size: 32, data: p32 },
    { size: 48, data: p48 },
  ]),
);
console.log("favicon.ico を生成 (16/32/48)");
