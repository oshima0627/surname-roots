# ビジュアルリニューアル 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 公開済みの苗字辞典に「現代の和」の世界観を与える。藍基調・明朝体・漢字を主役に据え、家紋SVGをライセンス表示付きで導入する。

**Architecture:** 既存の Next.js 静的エクスポート構成は変えない。配色と書体は Tailwind v4 の `@theme` トークンとして一箇所に定義し、各コンポーネントはトークンを参照する。明朝体はビルド時に使用文字だけへサブセットして自己ホストする。家紋SVGは Wikimedia Commons から取得し、ライセンス情報をスキーマで必須化する。

**Tech Stack:** Next.js 16（App Router / `output: "export"`）、React 19、Tailwind CSS v4、TypeScript、zod、vitest、wrangler、Noto Serif JP（OFL）

## Global Constraints

- **開発環境は Windows。** Python を要求するツール（fonttools / glyphhanger 等）は使わない。サブセットは harfbuzz の wasm を使う npm パッケージで行う
- **`output: "export"` の静的エクスポート構成を崩さない。** OpenNext による SSR は使えない
- **ダークモードを実装しない。** ライト専用の設計を維持する
- **コントラストは必ず WCAG の相対輝度式で計算し、実測値を報告する。** 目標 4.5:1 以上。目視で判断しない
- **家紋は Wikimedia Commons のみから取得する。** 画像検索結果からの取得は行わない。意匠は自由でも、特定のSVG表現には作者の著作権がある
- **Commons に無い9件は絵を出さない。** 似た紋での代用をしない
- **フッターの「本サイトの解説は諸説あるうちの一説です。」を全ページで維持する**
- 既存の全テストを通過させる。テストが赤い状態でコミットしない
- **描画結果はデプロイするまで誰も見ていない。** UIタスクは実機で測ってから完了とする

---

### Task 1: 配色トークンの定義と適用

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`, `src/components/SiteFooter.tsx`, `src/components/SurnameDetail.tsx`, `src/components/SurnameSearch.tsx`, `src/components/JapanMap.tsx`, `src/app/page.tsx`, `src/app/ranking/page.tsx`, `src/app/not-found.tsx`
- Test: `src/lib/colors.test.ts`（新規）

**Interfaces:**
- Consumes: なし
- Produces: Tailwind の `@theme` トークン（`--color-washi` 等）と、コントラスト計算のテスト

- [ ] **Step 1: コントラスト計算のテストを書く**

`src/lib/colors.ts` に色定義とWCAG計算を置き、テストで検証する。
**色を1箇所に集約し、テストで守る。** ここを緩めると、後からの微調整でコントラストが壊れても誰も気づかない。

`src/lib/colors.ts`:

```ts
/** サイトの配色。Tailwind の @theme と必ず同じ値にすること */
export const COLORS = {
  washi: "#f7f4ed", // 生成り。ページ背景
  surface: "#fffdf8", // 面。カード・表の背景
  sumi: "#1f1c17", // 墨。本文
  sumiMuted: "#6b6255", // 墨の淡い階調。補助文字
  ai: "#1f3f5e", // 藍。アクセント
  keisen: "#ddd6c9", // 罫線
  mapHigh: "#1b3a57", // 分布「多い」
  mapMid: "#7d9fbc", // 分布「やや多い」
  mapNone: "#e3ded3", // 分布 データなし
  mapNoneText: "#5c5449", // データなしタイルの文字
} as const;

/** WCAG 2.x の相対輝度 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x のコントラスト比 */
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

`src/lib/colors.test.ts`:

```ts
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
```

- [ ] **Step 2: テストを実行して落ちることを確認する**

Run: `npx vitest run src/lib/colors.test.ts`
Expected: FAIL（`@/lib/colors` が存在しない）

- [ ] **Step 3: colors.ts を実装してテストを通す**

Step 1 のコードをそのまま `src/lib/colors.ts` に置く。

Run: `npx vitest run src/lib/colors.test.ts`
Expected: PASS（12件）

**もし「配色のコントラスト」のいずれかが落ちたら、色の方を調整する。テストの閾値を下げてはいけない。**
調整した場合は、変更前後の値と比率を報告に書くこと。

- [ ] **Step 4: Tailwind の @theme にトークンを定義する**

`src/app/globals.css` を次にする。`--font-sans` の行は Task 3 で置き換えるのでこのまま残す。

```css
@import "tailwindcss";

@theme inline {
  --font-sans: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", Meiryo, sans-serif;

  /* 配色。src/lib/colors.ts と必ず同じ値にすること */
  --color-washi: #f7f4ed;
  --color-surface: #fffdf8;
  --color-sumi: #1f1c17;
  --color-sumi-muted: #6b6255;
  --color-ai: #1f3f5e;
  --color-keisen: #ddd6c9;
}
```

- [ ] **Step 4b: colors.ts と globals.css の同期をテストで守る**

色を2箇所（TypeScript と CSS）に書く構成になっている。Tailwind v4 の `@theme` は
TypeScript から値を取れないため、この重複は避けられない。
**コメントだけで守ると、片方を直して他方を忘れたときに静かにズレる。**

`src/lib/colors.test.ts` に追加する。

```ts
import fs from "node:fs";
import path from "node:path";

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
```

このテストは Step 4 で `globals.css` を書いた後に通る。先に書いて落ちることを確認すること。

- [ ] **Step 5: 全コンポーネントの色クラスを置き換える**

既存の stone / amber 系クラスを、対応するトークンに置き換える。

| 置換前 | 置換後 |
|---|---|
| `bg-stone-50` | `bg-washi` |
| `bg-white` | `bg-surface` |
| `text-stone-900` | `text-sumi` |
| `text-stone-600` | `text-sumi-muted` |
| `text-stone-500` | `text-sumi-muted` |
| `border-stone-200` / `border-stone-300` | `border-keisen` |
| `border-amber-700` | `border-ai` |
| `focus:border-amber-700` | `focus:border-ai` |
| `hover:border-amber-700` | `hover:border-ai` |
| `divide-stone-200` | `divide-keisen` |

`grep -rn "stone-\|amber-" src/` で残りが無いことを確認する。

- [ ] **Step 6: JapanMap の塗り色を差し替える**

`src/components/JapanMap.tsx` の `FILL` と `TEXT` を `COLORS` から引く。ハードコードした16進数を残さない。

```tsx
import { COLORS } from "@/lib/colors";

const FILL: Record<Level, string> = {
  high: COLORS.mapHigh,
  mid: COLORS.mapMid,
  none: COLORS.mapNone,
};

const TEXT: Record<Level, string> = {
  high: COLORS.washi,
  mid: COLORS.sumi,
  none: COLORS.mapNoneText,
};
```

凡例のスウォッチも同じ値を参照させる。

- [ ] **Step 7: 全体を検証する**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

Expected: すべて成功。既存テストの件数が減っていないこと。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: 配色を藍基調に変更し、コントラストをテストで担保する"
```

---

### Task 2: 明朝体のサブセット生成

**Files:**
- Create: `scripts/build-font.mjs`
- Create: `src/lib/glyphs.ts`
- Test: `src/lib/glyphs.test.ts`, `scripts/font-coverage.test.mjs`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: `src/data/surnames/*.json`, `src/lib/prefectures.ts`
- Produces: `public/fonts/noto-serif-jp-subset.woff2` と、`collectGlyphs(): string`

- [ ] **Step 1: 依存を入れる**

```bash
npm install -D subset-font fontkit @types/fontkit
```

`subset-font` は harfbuzz の wasm を使うため Python を必要としない。

- [ ] **Step 2: フォント本体の入手経路を決めて記録する**

Noto Serif JP は SIL Open Font License 1.1 で、埋め込み・改変・再配布が許諾されている。

次の順で試し、**成功した経路と、取得したファイル名・サイズ・ライセンスファイルの所在を報告に書く**。

1. `npm install -D @fontsource/noto-serif-jp` を入れ、`node_modules/@fontsource/noto-serif-jp/files/` に
   全字を含む ttf または woff2 があるか確認する。ある場合はそれを入力に使う
2. 無い場合は Google Fonts の公式配布（`https://fonts.google.com/download?family=Noto+Serif+JP`）から取得する

**入力に使うファイルは `vendor/fonts/` に置き、OFL のライセンス全文を同じ場所に置く。**
再配布物にライセンス全文を同梱するのは OFL の条件である。

- [ ] **Step 2b: 都道府県名を素のJSONに移す（二重実装を防ぐための前準備）**

文字収集は素の Node スクリプトからもテストからも呼ぶ必要がある。
TypeScript の `@/` エイリアス付きモジュールは素の Node から読めないため、
**収集ロジックは `.mjs` に置き、TypeScript 側はそれを再エクスポートする**構成にする。

そのためには都道府県名も `.mjs` から読める必要がある。現在は `src/lib/prefectures.ts` に
座標つきで直書きされているので、データ部分を JSON に分離する。

`src/data/prefectures.json` を新規作成し、現在 `PREFECTURES` に入っている47件の
`{ name, row, col }` をそのまま移す。**座標の値は1つも変えないこと。**
Task 2 の目的は文字収集であって、地図の配置ではない。

`src/lib/prefectures.ts` は JSON を読む形に変える。

```ts
import data from "@/data/prefectures.json";

export type Prefecture = { name: string; row: number; col: number };

export const TILE_COLS = 14;
export const TILE_ROWS = 12;

export const PREFECTURES: readonly Prefecture[] = data;
export const PREFECTURE_NAMES: readonly string[] = PREFECTURES.map((p) => p.name);
```

`src/lib/prefectures.test.ts` の既存5件がそのまま通ることを確認する。
**特に「タイル座標に重複がない」「47件ある」が通れば、移設で壊していない。**

Run: `npx vitest run src/lib/prefectures.test.ts`
Expected: PASS（5件）

- [ ] **Step 3: 使用文字を集める関数のテストを書く**

`src/lib/glyphs.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { collectGlyphs, UI_TEXT } from "@/lib/glyphs";
import { getAllSurnames } from "@/lib/surnames";
import { PREFECTURE_NAMES } from "@/lib/prefectures";

describe("collectGlyphs", () => {
  const glyphs = collectGlyphs();
  const set = new Set([...glyphs]);

  it("重複を含まない", () => {
    expect(set.size).toBe([...glyphs].length);
  });

  it("全苗字の漢字を含む", () => {
    for (const entry of getAllSurnames()) {
      for (const ch of entry.kanji) expect(set.has(ch)).toBe(true);
    }
  });

  it("全苗字の読みを含む", () => {
    for (const entry of getAllSurnames()) {
      for (const r of entry.readings) for (const ch of r) expect(set.has(ch)).toBe(true);
    }
  });

  it("由来の本文の文字を含む", () => {
    for (const entry of getAllSurnames()) {
      for (const ch of entry.origin) expect(set.has(ch)).toBe(true);
    }
  });

  it("47都道府県名の文字を含む", () => {
    for (const name of PREFECTURE_NAMES) {
      for (const ch of name) expect(set.has(ch)).toBe(true);
    }
  });

  it("UI固定文言の文字を含む", () => {
    for (const ch of UI_TEXT) expect(set.has(ch)).toBe(true);
  });

  it("数字と英字と基本記号を含む", () => {
    for (const ch of "0123456789") expect(set.has(ch)).toBe(true);
    for (const ch of "／・（）「」、。") expect(set.has(ch)).toBe(true);
  });
});
```

- [ ] **Step 4: テストが失敗することを確認する**

Run: `npx vitest run src/lib/glyphs.test.ts`
Expected: FAIL（`@/lib/glyphs` が存在しない）

- [ ] **Step 5: collectGlyphs を実装する**

**実体は `scripts/glyphs.mjs` に置く。** 素の Node からもテストからも同じコードを使うため。
`src/lib/glyphs.ts` はそれを再エクスポートするだけにする（tsconfig の `allowJs` は既に true）。

`src/lib/glyphs.ts`:

```ts
export { collectGlyphs, UI_TEXT } from "../../scripts/glyphs.mjs";
```

`scripts/glyphs.mjs`（データは `src/data/` の JSON を直接読む。`@/` エイリアスを使わない）:

```js
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const surnameDir = path.join(root, "src/data/surnames");
const prefectures = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/prefectures.json"), "utf-8"),
);

/**
 * 画面に出る固定文言。ここに書き漏らすとその文字だけ別書体になる。
 * 文言を変えたら必ずここも直すこと。
 */
export const UI_TEXT = [
  "苗字ルーツ辞典",
  "苗字のルーツを調べる",
  "漢字でも、ひらがな・カタカナでも探せます。",
  "苗字を入力（例: 佐藤 / さとう）",
  "苗字を検索",
  "よく調べられる苗字",
  "全国ランキングをすべて見る",
  "全国ランキング",
  "この苗字はまだ収録されていません",
  "この苗字はまだ収録されていません。収録数を少しずつ増やしています。",
  "収録数を少しずつ増やしています。別の苗字を探してみてください。",
  "苗字を検索する",
  "本サイトの解説は諸説あるうちの一説です。",
  "由来",
  "発祥",
  "分布",
  "家紋",
  "同じ苗字の有名人",
  "読み方のバリエーション",
  "全国",
  "位",
  "順位",
  "読み",
  "多い",
  "やや多い",
  "出典: 名字由来net。順位は参照元によって異なることがあります。",
  "順位は名字由来netの集計に基づく参考値です。他の資料では順位が異なることがあります。",
  "※特に多い地域を示すもので、順位は概略です。着色のない県はデータがないことを意味します。",
  "全国順位順の苗字一覧",
  "都道府県別の分布",
  "の由来とルーツ",
  "約万人",
  "0123456789",
  "／・（）「」、。〜ー…※",
].join("");

/**
 * サブセットに含める文字を重複なく集める。
 * データの追加に自動で追従させるため、JSON を舐めて全文字列フィールドから拾う。
 * 新しいフィールドが増えても拾い漏らさないよう、値の型で判定している。
 */
export function collectGlyphs() {
  const set = new Set();
  const add = (v) => {
    if (typeof v === "string") {
      for (const ch of v) set.add(ch);
    } else if (Array.isArray(v)) {
      v.forEach(add);
    } else if (v && typeof v === "object") {
      Object.values(v).forEach(add);
    }
  };

  for (const file of fs.readdirSync(surnameDir).filter((f) => f.endsWith(".json"))) {
    const entry = JSON.parse(fs.readFileSync(path.join(surnameDir, file), "utf-8"));
    // sources は画面に出ないので除く。URL の英数字を拾う必要はない
    const { sources: _omitted, ...visible } = entry;
    add(visible);
  }

  prefectures.forEach((p) => add(p.name));
  add(UI_TEXT);

  return [...set].join("");
}
```

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx vitest run src/lib/glyphs.test.ts`
Expected: PASS（7件）

- [ ] **Step 7: サブセット生成スクリプトを書く**

`scripts/build-font.mjs`。`collectGlyphs()` は TypeScript なので、
スクリプトからは同じ収集ロジックを再実装せず、**ビルド前に一度だけ文字集合を書き出して読む**方式にする。
二重実装すると必ずズレる。

```js
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
```

`scripts/write-glyphs.mjs` は `collectGlyphs()` を呼んで `.glyphs.txt` を書くだけにする。

```js
import fs from "node:fs";
import path from "node:path";
import { collectGlyphs } from "./glyphs.mjs";

const text = collectGlyphs();
fs.writeFileSync(path.join(process.cwd(), ".glyphs.txt"), text, "utf-8");
console.log(`収集した文字数: ${new Set([...text]).size}`);
```

- [ ] **Step 8: カバー率を検証するテストを書く**

`scripts/font-coverage.test.mjs`。生成された woff2 の cmap を読み、収集した全文字が含まれるか確認する。

```js
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import fontkit from "fontkit";

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
```

このテストは生成物に依存するため、`npm test` の対象からは外し、`npm run font:verify` で実行する。
ビルド手順の中で必ず走らせる。

- [ ] **Step 9: package.json のスクリプトを整える**

```json
{
  "font:glyphs": "node scripts/write-glyphs.mjs",
  "font:build": "npm run font:glyphs && node scripts/build-font.mjs",
  "font:verify": "vitest run scripts/font-coverage.test.mjs",
  "build": "npm run font:build && npm run font:verify && next build"
}
```

**ビルドの中にフォント生成と検証を組み込む。** 手動実行に頼ると必ず忘れる。

- [ ] **Step 10: .gitignore を整える**

```
# フォントの中間生成物
.glyphs.txt
public/fonts/
```

生成物はコミットしない。入力の `vendor/fonts/` はコミットする。

- [ ] **Step 11: 生成と検証を通す**

```bash
npm run font:build && npm run font:verify
```

Expected: サブセットが生成され、カバー率テストが通る。
**生成されたファイルサイズと収録文字数を報告に書くこと。**

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "build: 明朝体を使用文字だけにサブセットする仕組みを追加"
```

---

### Task 3: 明朝体の適用

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Consumes: `public/fonts/noto-serif-jp-subset.woff2`
- Produces: サイト全体の明朝化

- [ ] **Step 1: @font-face と theme を設定する**

`src/app/globals.css` の `@theme inline` の前に `@font-face` を置き、`--font-sans` を明朝に差し替える。

```css
@import "tailwindcss";

@font-face {
  font-family: "Noto Serif JP Subset";
  src: url("/fonts/noto-serif-jp-subset.woff2") format("woff2");
  font-weight: 400 700;
  font-display: swap;
}

@theme inline {
  /* 明朝が読み込まれるまではOS標準の明朝、無ければゴシックで表示する */
  --font-sans: "Noto Serif JP Subset", "Hiragino Mincho ProN", "Yu Mincho", serif;
  --font-tabular: system-ui, -apple-system, "Hiragino Sans", "Yu Gothic UI", Meiryo, sans-serif;

  /* 配色は Task 1 で定義済み */
}
```

- [ ] **Step 2: フォントを preload する**

`src/app/layout.tsx` の `<html>` 内に `<head>` を足し、preload を入れる。

```tsx
<head>
  <link
    rel="preload"
    href="/fonts/noto-serif-jp-subset.woff2"
    as="font"
    type="font/woff2"
    crossOrigin="anonymous"
  />
</head>
```

- [ ] **Step 3: 本文の可読性を調整する**

明朝は小サイズで潰れる。本文の基準サイズを1段階上げ、行間を広げる。
`SurnameDetail` の由来本文は現在 `leading-8`。文字サイズを上げたうえで行間も見直す。

- [ ] **Step 4: 数字を等幅にする**

順位・人口の数字は明朝にしない。`src/app/ranking/page.tsx` の順位セルと、
`SurnameDetail` の順位・人口表示に `font-tabular` と `tabular-nums` を当てる。

- [ ] **Step 5: 検証する**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 6: 実機で測る**

`npm run dev` を空きポートで立ち上げ、`/`、`/myoji/sato`、`/ranking` を
375px / 768px / 1440px で確認し、次を報告する。

- ページが横スクロールしないこと（`scrollWidth` と `clientWidth` の実測値）
- 本文の実効フォントサイズ（px）
- 明朝が実際に適用されていること（`getComputedStyle(el).fontFamily` の値）
- 順位の数字が等幅で表示されていること

終わったら dev サーバーを止める。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 明朝体を適用し、数字は等幅に分ける"
```

---

### Task 4: 詳細ページの再構成

**Files:**
- Modify: `src/components/SurnameDetail.tsx`
- Test: `src/components/SurnameDetail.test.tsx`

**Interfaces:**
- Consumes: `SurnameEntry`
- Produces: 漢字を主役にした詳細ページ

- [ ] **Step 1: 見出しの構成を変える**

漢字を大きく組み、上下に余白を取る。読みは小さく字間を空ける。
順位・人口・出典はさらに小さく沈める。

**文字数によるサイズ調整を入れる。** 3文字の苗字（長谷川）が375pxで溢れないよう、
`entry.kanji.length` に応じてサイズを変える。溢れるかどうかは Step 4 で実測して決める。

- [ ] **Step 2: セクション見出しの罫線を変える**

`Section` の `border-l-4 border-ai pl-3` をやめ、見出しの語を左に置いて細い横罫を右へ伸ばす形にする。
`flex` と擬似要素の `flex-1` な罫線で作る。罫線の色は `--color-keisen`。

- [ ] **Step 3: 既存テストを通す**

`src/components/SurnameDetail.test.tsx` の12件は構造ではなく内容を検証しているので、
基本的にそのまま通るはず。落ちる場合は**アサーションを弱めずクエリを直す**。

特に次の既存の保証を壊さないこと。
- 空のセクションを描画しない（家紋・有名人・読みバリエーション）
- 順位も人口も無いとき空の `<p>` を残さない
- `sources` を画面に出さない

- [ ] **Step 4: 実機で文字数別に測る**

375px で次の3つを開き、見出しの漢字が溢れないことを実測する。

- 1文字: `/myoji/hara`（原）
- 2文字: `/myoji/sato`（佐藤）
- 3文字: `/myoji/hasegawa`（長谷川）

`scrollWidth` と `clientWidth`、および見出し要素の `getBoundingClientRect().width` を報告する。
溢れる場合は Step 1 のサイズ調整で対処する。**溢れたまま完了としない。**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 詳細ページの漢字を主役に据え、見出し罫線を和の意匠に変える"
```

---

### Task 5: トップ・ランキング・ヘッダー・フッターの調整

**Files:**
- Modify: `src/app/page.tsx`, `src/app/ranking/page.tsx`, `src/app/layout.tsx`, `src/components/SiteFooter.tsx`, `src/components/SurnameSearch.tsx`
- Test: 対応する既存テストファイル

- [ ] **Step 1: ヘッダーとフッターを地に溶かす**

現在の `bg-surface` のバーをやめ、背景を地の色にして細い罫線だけで区切る。
サイト名は明朝の小さなロゴタイプにする。

- [ ] **Step 2: トップページの余白を整える**

検索ボックスに焦点が集まるよう余白を調整する。
「よく調べられる苗字」のカードは漢字を明朝で大きく組む。

- [ ] **Step 3: ランキングページの罫線と余白を調整する**

罫線を細くし、行間を広げる。順位と人口の数字は等幅のまま（Task 3 で対応済み）。

- [ ] **Step 4: 既存テストを通す**

`src/app/page.test.tsx` と `src/app/ranking/page.test.tsx` を壊さない。
特に**由来本文がクライアントに漏れていないことを検証するテスト**は落としてはいけない。

- [ ] **Step 5: 実機で確認する**

375px / 768px / 1440px で `/` と `/ranking` を確認し、横スクロールしないことを実測する。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: トップ・ランキング・ヘッダー・フッターを和の構成に調整"
```

---

### Task 6: 家紋スキーマの拡張

**Files:**
- Modify: `src/lib/schema.ts`
- Test: `src/lib/schema.test.ts`

**Interfaces:**
- Produces: `svg` を持つ家紋にライセンス情報を必須化したスキーマ

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/schema.test.ts` に追加する。

```ts
const kamonWithSvg = {
  name: "剣梅鉢",
  description: "梅鉢に五本の剣を配した紋。",
  svg: {
    file: "kaga-umebachi.svg",
    license: "CC BY-SA 3.0",
    author: "User:Mukai",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.svg",
    modified: true,
  },
};

describe("家紋のライセンス情報", () => {
  it("svg を持たない家紋は従来どおり通る", () => {
    const e = { ...valid, kamon: [{ name: "撫子", description: "撫子の花の紋。" }] };
    expect(() => surnameEntrySchema.parse(e)).not.toThrow();
  });

  it("svg を持つ家紋は全項目が揃っていれば通る", () => {
    expect(() => surnameEntrySchema.parse({ ...valid, kamon: [kamonWithSvg] })).not.toThrow();
  });

  it("author が欠けていると弾く", () => {
    const { author: _omitted, ...rest } = kamonWithSvg.svg;
    const broken = { ...valid, kamon: [{ ...kamonWithSvg, svg: rest }] };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("license が空文字だと弾く", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, license: "" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("sourceUrl が http で始まらないと弾く", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, sourceUrl: "commons.wikimedia.org" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });

  it("modified が真偽値でないと弾く", () => {
    const broken = {
      ...valid,
      kamon: [{ ...kamonWithSvg, svg: { ...kamonWithSvg.svg, modified: "yes" } }],
    };
    expect(() => surnameEntrySchema.parse(broken)).toThrow();
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx vitest run src/lib/schema.test.ts`
Expected: 新規5件が FAIL（`svg` が未定義のため素通りしてしまう）

- [ ] **Step 3: スキーマを拡張する**

```ts
  kamon: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      /**
       * 家紋のSVG。持つなら出典情報を必須にする。
       * 意匠自体の著作権は切れているが、SVG表現には作者の著作権がある。
       * ここを任意項目にすると出典不明のSVGが混入するので、必ず必須のままにすること。
       */
      svg: z
        .object({
          file: z.string().min(1),
          license: z.string().min(1),
          author: z.string().min(1),
          sourceUrl: z.string().regex(/^https?:\/\//),
          modified: z.boolean(),
        })
        .optional(),
    }),
  ),
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/lib/schema.test.ts`
Expected: PASS（既存11件 + 新規6件 = 17件）

- [ ] **Step 5: 全体を検証する**

```bash
npm test && npm run typecheck
```

既存100件のデータは `svg` を持たないため、そのまま通るはず。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 家紋SVGのライセンス情報をスキーマで必須化する"
```

---

### Task 7: 家紋SVGの取得

**Files:**
- Create: `public/kamon/*.svg`（23ファイル）
- Modify: `src/data/surnames/*.json`（該当する32件）
- Create: `docs/kamon-credits.md`

**Interfaces:**
- Consumes: `.superpowers/sdd/2026-08-12-surname-roots/kamon-commons-survey.md`
- Produces: 家紋SVGと、各データへの `svg` フィールド追加

- [ ] **Step 1: 調査結果を読む**

`.superpowers/sdd/2026-08-12-surname-roots/kamon-commons-survey.md` を読む。
38件中29件が FOUND、実ファイル23点。**ここに記録された URL とライセンスを唯一の根拠とする。**

- [ ] **Step 2: 各ファイルを取得し、ライセンスを再確認する**

23ファイルを `public/kamon/` に取得する。

**取得前に、各ファイルの Commons ページを開いてライセンスと作者を自分で読み直すこと。**
調査は別のエージェントが行ったものであり、記録が正しい保証はない。
1件でも食い違えば、その旨を報告して取得を止める。

ファイル名は `<slug>.svg` ではなく**紋の名前**にする（複数の苗字が同じ紋を共有するため）。
例: `kaga-umebachi.svg`、`maru-ni-mitsuhiki.svg`。

- [ ] **Step 3: SVG を整える**

- 不要なメタデータ（編集ソフトの痕跡等）を削る
- `fill` を `currentColor` に変え、地色に追従させる
- `width` / `height` 属性を外し、`viewBox` だけ残す（表示側でサイズを決める）

**色を変えた時点で改変にあたる。** 該当ファイルは `modified: true` とし、
クレジットに「改変あり」と明記する。

- [ ] **Step 4: データに svg フィールドを足す**

該当する32件の `kamon[]` に `svg` を追加する。Commons に無い9件には追加しない。

- [ ] **Step 5: 検証する**

```bash
npm test
```

スキーマが `svg` の全項目を要求するので、記入漏れがあればここで落ちる。

さらに次を目視ではなく機械的に確認する。

- `public/kamon/*.svg` の実ファイル数と、データ中の `svg.file` の参照先が一致すること
- 参照先の無いファイル、ファイルの無い参照が無いこと

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 家紋SVGを Wikimedia Commons から取得しライセンス情報を記録する"
```

---

### Task 8: 家紋の表示とクレジットページ

**Files:**
- Create: `src/components/Kamon.tsx`, `src/app/credits/page.tsx`
- Test: `src/components/Kamon.test.tsx`, `src/app/credits/page.test.tsx`
- Modify: `src/components/SurnameDetail.tsx`, `src/components/SiteFooter.tsx`

- [ ] **Step 1: 失敗するテストを書く**

`src/app/credits/page.test.tsx`。**このテストが CC BY-SA の表示義務を守る仕組みになる。**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CreditsPage from "@/app/credits/page";
import { getAllSurnames } from "@/lib/surnames";

describe("クレジットページ", () => {
  it("SVGを持つ全家紋の作者・ライセンス・出典URLを載せる", () => {
    render(<CreditsPage />);
    const withSvg = getAllSurnames().flatMap((e) => e.kamon).filter((k) => k.svg);
    expect(withSvg.length).toBeGreaterThan(0);

    for (const k of withSvg) {
      expect(screen.getAllByText(new RegExp(k.svg!.author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).length)
        .toBeGreaterThan(0);
    }
    const links = [...document.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    for (const k of withSvg) {
      expect(links).toContain(k.svg!.sourceUrl);
    }
  });

  it("改変したものはその旨を記す", () => {
    render(<CreditsPage />);
    const modified = getAllSurnames().flatMap((e) => e.kamon).filter((k) => k.svg?.modified);
    if (modified.length > 0) {
      expect(screen.getAllByText(/改変/).length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx vitest run src/app/credits/page.test.tsx`
Expected: FAIL（`@/app/credits/page` が存在しない）

- [ ] **Step 3: Kamon コンポーネントを作る**

`src/components/Kamon.tsx`。`public/kamon/*.svg` を**ビルド時に読み込んでインライン展開する**。
`<img>` では `currentColor` が効かないため、インラインSVGにする。

サーバーコンポーネントなので `node:fs` で読める。

- [ ] **Step 4: 詳細ページに家紋を出す**

**家紋セクション** — 紋（64px程度）・名前・説明を横並びにする。複数ある苗字は縦に並べ、間に細い罫線を入れる。

`svg` を持たない家紋は、**紋の位置に破線の枠を置き、図がないことを短く示す**。
他の紋と行の高さを揃え、一覧としての整列を保つ。

文言は「図案未収録」のような内部事情の言い方を避け、短く中立にする。
「準備中」のように将来の追加を約束する言い方もしない。実際に追加される保証がない。

**見出し横の紋** — 苗字の漢字の横に大きめの紋（84px程度）を置く。
その苗字の最初の `svg` を持つ家紋を使う。

紋を持たない苗字ではここは空になる。**漢字の位置がずれないこと。**
紋の有無でレイアウトが動くと、ページを移動するたびに見出しが跳ねる。

該当する苗字は次の3通りある。すべてで破綻しないこと。
- 家紋データがあり `svg` もある（見出し横に紋が出る）
- 家紋データはあるが `svg` が無い（見出し横は空、家紋欄は破線枠）
- 家紋データ自体が無い（見出し横は空、家紋セクションごと非表示）

- [ ] **Step 5: クレジットページを作る**

`/credits`。家紋ごとに紋・名前・作者・ライセンス・出典リンク・改変の有無を並べる。
同じファイルを複数の苗字が共有する場合は1回だけ載せる。

ページ冒頭に、家紋の意匠自体は著作権が切れていること、
SVG表現には作者の著作権があること、改変版は同一ライセンスで配布することを記す。

- [ ] **Step 6: フッターからリンクする**

`SiteFooter` に `/credits` へのリンクを足す。
**表示義務は利用者がたどれる形である必要がある。**

- [ ] **Step 7: 検証する**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

`out/credits.html` が生成されることを確認する。

- [ ] **Step 8: 実機で確認する**

375px / 1440px で次の4つを確認する。**3通りの状態すべてを見ること。**

| URL | 状態 |
|---|---|
| `/myoji/maeda` | 家紋あり・SVGあり |
| `/myoji/hayashi` | 家紋あり・SVGなし（破線枠） |
| `/myoji/yoshida` | 家紋データ自体なし |
| `/credits` | クレジットページ |

確認項目:

- 紋が藍で表示されること
- **3ページで見出しの漢字の左端の位置が一致すること**（紋の有無で動かない）。
  `getBoundingClientRect().left` を実測して比較する
- 破線枠が他の紋と行の高さを揃えていること
- クレジットページに全件の作者・ライセンス・出典・改変有無が出ていること
- ページが横スクロールしないこと（`scrollWidth` と `clientWidth` の実測値）

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: 家紋を表示し、クレジットページを追加する"
```

---

## 完了条件

- [ ] 全テスト・型チェック・lint・ビルドが通る
- [ ] コントラストの実測値が全ペアで 4.5:1 以上
- [ ] サブセットフォントが全使用文字をカバーしている（テストで検証済み）
- [ ] 375px / 768px / 1440px でページが横スクロールしない
- [ ] 3文字の苗字の見出しが375pxで溢れない
- [ ] クレジットページに全家紋の作者・ライセンス・出典・改変有無が出ている
- [ ] Commons に無い9件は絵を出さず、文字のみで表示されている
- [ ] フッターの免責が全ページで維持されている
