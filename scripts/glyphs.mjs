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
  // ランキング順位が null のときのフォールバック表示（src/app/ranking/page.tsx の
  // `{entry.rankNational ?? "―"}`）。JSONを舐める collectGlyphs() では拾えない、
  // .tsx にハードコードされた文字なので、ここに明示しておく必要がある。
  "―",
  // src/**/*.tsx の非ASCII文字を機械的にスキャンする glyphs.tsx-coverage.test.ts が
  // 検出した、上記以外の残り。大半はテストの説明文（it/describe名）やコメント中の
  // 文字で画面には出ないが、スキャンを緩めて見逃すより、ここに足して安全側に倒す。
  "誤戻返辿証接誰互列⊂規衝構破綻ヘ該塗凡非免責空態舐毎既包",
  // Task 4（RD4）の見出しサイズ調整コメントで使った文字。画面には出ないコメントだが
  // glyphs.tsx-coverage.test.ts のスキャンに引っかかるため、安全側に倒してここに追加。
  "整測応",
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
