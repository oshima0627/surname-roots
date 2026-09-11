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
  // クレジットページ（フォントの帰属表示）
  "クレジット",
  "このサイトで使用しているフォントの著作権者とライセンスの表示です。",
  "ライセンス",
  "出典",
  // Task「最終レビュー対応: フォントの帰属表示」で credits ページに追加した、
  // 使用フォント（Noto Serif JP サブセット）の帰属セクション。
  "使用フォント",
  "フォント名",
  "本文の明朝体として、表示に必要な文字だけを抜き出したサブセット版を配信",
  "著作権者",
  "SIL Open Font License, Version 1.1",
  // 同タスクで credits ページ・build-font.mjs・font-coverage.test.mjs の
  // JSDoc/コメントに使った、上記の画面表示用エントリ以外の残り
  // （§4(a) 等の引用、「種類」「抜き出す」「厳密」由来）。画面には出ないが、
  // 安全側に倒してここに追加する。
  "厳密種類抜§",
  // Finding 2 のレビュー指摘対応で page.test.tsx のコメントに使った文字
  // （「排除」「1件でも欠けたら」「＝」等）。画面には出ないが、安全側に倒して追加する。
  "排除欠＝",
  // 詳細ページ末尾に追加した「参考資料」セクション（sources を表示するようになった変更）。
  // 見出しの「参考資料」自体の文字は既存の別の文言（「参考値」「資料」）で拾えているが、
  // 明示のため追加する。「（外部サイト）」はリンクごとに付けるスクリーンリーダー向けの
  // sr-only テキストで、ここでしか使わない新規の文字（外・部）を含む。
  "参考資料（外部サイト）",
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
  // Task 8（RD8）のコメント・テスト説明文（it/describe名や「図案未収録」などの
  // 否定確認用の文言）で使った、上記の画面表示用エントリ以外の残り。
  // 画面には出ないが、安全側に倒してここに追加する。
  "旨避固藍委飾途壊→ぱ効束短未欄",
  // 過去の家紋対応（2026-09-11 に機能ごと削除）の JSDoc で使い、安全側に残している字。
  // 画面には出ないが、安全側に倒してここに追加する。
  "拡判断報",
  // 同ブランチ、コードレビュー対応（拡張子の検証を強化した際のJSDoc）で
  // 新たに使った字。画面には出ないが、安全側に倒してここに追加する。
  "倒",
].join("");

/**
 * 参考資料として画面に出す表示用ラベルに変換する。
 * 生のURL（`https://myoji-yurai.net/searchResult.htm?myojiKanji=%E4%BD%90%E8%97%A4` 等）は
 * パーセントエンコードされていて読みにくいうえ、スキーム部分は情報として不要なので、
 * ホスト名＋パス＋クエリをデコードして返す。同じホストの複数URLも、パスやクエリが
 * 異なれば別の文字列として区別できる。
 *
 * SurnameDetail（表示側）とここ（フォントサブセットの文字収集側）の両方から呼び、
 * 実装を1箇所に集約することで、表示する文字とサブセットに含める文字が食い違わない
 * ようにしている（食い違うと、サブセットに無い文字だけ別書体にフォールバックする）。
 */
export function formatSourceLabel(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const decode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const path = parsed.pathname === "/" ? "" : decode(parsed.pathname);
  const search = decode(parsed.search);
  return `${parsed.hostname}${path}${search}`;
}

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
    // sources の生URL自体（%XX のパーセントエンコード表記）は画面に出さないので拾わない。
    // 代わりに、詳細ページで実際に表示する formatSourceLabel() 後の文字列を拾う。
    const { sources, ...visible } = entry;
    add(visible);
    sources.forEach((url) => add(formatSourceLabel(url)));
  }

  prefectures.forEach((p) => add(p.name));
  add(UI_TEXT);

  return [...set].join("");
}
