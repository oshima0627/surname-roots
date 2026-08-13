import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { COLORS } from "@/lib/colors";

const APP = path.join(process.cwd(), "src/app");
const svg = fs.readFileSync(path.join(APP, "icon.svg"), "utf-8");
const ico = fs.readFileSync(path.join(APP, "favicon.ico"));

describe("ファビコン", () => {
  // create-next-app の既定ファビコン（Next.js のロゴ）が残っていると、
  // 「作った」と思い込んだまま他所のロゴを配信し続けることになる。
  // 既定ファイルは 25,931 バイトだった
  it("Next.js の既定ファビコンが残っていない", () => {
    expect(ico.byteLength).toBeLessThan(10_000);
  });

  it("ICO として妥当で、16/32/48 の3サイズを含む", () => {
    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // type: icon
    const count = ico.readUInt16LE(4);
    expect(count).toBe(3);
    const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + 16 * i));
    expect(sizes).toEqual([16, 32, 48]);
    // 各エントリのオフセット＋長さがファイル内に収まっていること
    for (let i = 0; i < count; i++) {
      const len = ico.readUInt32LE(6 + 16 * i + 8);
      const off = ico.readUInt32LE(6 + 16 * i + 12);
      expect(off + len).toBeLessThanOrEqual(ico.byteLength);
      // PNG シグネチャで始まる
      expect(ico.subarray(off, off + 8).toString("hex")).toBe("89504e470d0a1a0a");
    }
  });

  // 配色は src/lib/colors.ts が唯一の出所。ここがズレると
  // ファビコンだけ旧配色のまま取り残される
  it("icon.svg が colors.ts の藍と生成りを使っている", () => {
    expect(svg).toContain(COLORS.ai);
    expect(svg).toContain(COLORS.washi);
  });

  it("icon.svg が文字ではなく輪郭パスで描かれている", () => {
    // <text> だと閲覧側のフォント環境に依存して別の字形になる
    expect(svg).not.toContain("<text");
    expect(svg).toContain("<path");
  });

  it("apple-icon.png が 180x180 の PNG である", () => {
    const png = fs.readFileSync(path.join(APP, "apple-icon.png"));
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(180); // IHDR width
    expect(png.readUInt32BE(20)).toBe(180); // IHDR height
  });
});
