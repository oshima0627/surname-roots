import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { COLORS, contrastRatio, relativeLuminance } from "@/lib/colors";

describe("contrastRatio", () => {
  it("白と黒で最大値21になる", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
  });

  it("同じ色どうしは1になる", () => {
    expect(contrastRatio("#1f3f5e", "#1f3f5e")).toBeCloseTo(1, 5);
  });

  it("相対輝度は白が1、黒が0", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });
});

describe("配色のコントラスト", () => {
  // 実際に画面上で重なる組み合わせのみを検証する
  const pairs: [string, string, string][] = [
    ["本文 / 背景", COLORS.sumi, COLORS.washi],
    ["本文 / 面", COLORS.sumi, COLORS.surface],
    ["補助文字 / 背景", COLORS.sumiMuted, COLORS.washi],
    ["補助文字 / 面", COLORS.sumiMuted, COLORS.surface],
    ["藍 / 背景", COLORS.ai, COLORS.washi],
    ["藍 / 面", COLORS.ai, COLORS.surface],
    ["地図・多いの文字 / 多い", COLORS.washi, COLORS.mapHigh],
    ["地図・やや多いの文字 / やや多い", COLORS.sumi, COLORS.mapMid],
    ["地図・データなしの文字 / データなし", COLORS.mapNoneText, COLORS.mapNone],
  ];

  it.each(pairs)("%s は 4.5:1 以上", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("globals.css との同期", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf-8");

  // COLORS のキー → CSS 変数名（地図の色は @theme に置かないので除く）
  const themeTokens: [keyof typeof COLORS, string][] = [
    ["washi", "--color-washi"],
    ["surface", "--color-surface"],
    ["sumi", "--color-sumi"],
    ["sumiMuted", "--color-sumi-muted"],
    ["ai", "--color-ai"],
    ["keisen", "--color-keisen"],
  ];

  it.each(themeTokens)("%s が globals.css と一致する", (key, cssVar) => {
    const m = css.match(new RegExp(`${cssVar}:\\s*(#[0-9a-fA-F]{6})`));
    expect(m, `${cssVar} が globals.css に無い`).not.toBeNull();
    expect(m![1].toLowerCase()).toBe(COLORS[key].toLowerCase());
  });
});
