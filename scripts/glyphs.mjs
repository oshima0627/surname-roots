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
