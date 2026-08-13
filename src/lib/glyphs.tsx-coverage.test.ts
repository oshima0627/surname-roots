import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { collectGlyphs } from "@/lib/glyphs";

const SRC_DIR = path.join(process.cwd(), "src");

/**
 * src 以下の .tsx を再帰的に集める。
 */
function listTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsxFiles(full));
    } else if (entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * ASCII（0x7F以下）以外の文字を拾う。Tailwind のクラス名・props名・import文は
 * ASCII に収まるため、残るのはほぼ画面に出る日本語の文言や記号になる。
 * コメントや aria-label などレンダリングされない文字も混じるが、
 * それらはノイズとして除外するのではなく UI_TEXT 側に足して安全側に倒す
 * （スキャンを絞ると、絞った条件の外で起きる本物の見落としを検知できなくなるため）。
 */
function extractNonAscii(text: string): Set<string> {
  const set = new Set<string>();
  for (const ch of text) {
    if (ch.codePointAt(0)! > 0x7f) set.add(ch);
  }
  return set;
}

describe("tsxコンポーネントの文字がすべてサブセットに含まれる", () => {
  it("src/**/*.tsx に書かれた非ASCII文字を collectGlyphs() がすべて含む", () => {
    const glyphs = new Set([...collectGlyphs()]);

    const foundInTsx = new Set<string>();
    for (const file of listTsxFiles(SRC_DIR)) {
      const text = fs.readFileSync(file, "utf-8");
      for (const ch of extractNonAscii(text)) foundInTsx.add(ch);
    }

    const missing = [...foundInTsx].filter((ch) => !glyphs.has(ch));
    expect(missing).toEqual([]);
  });
});
