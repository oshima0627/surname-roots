// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import RankingPage from "@/app/ranking/page";
import { getAllSurnames } from "@/lib/surnames";

/**
 * 日本語の苗字は互いの部分文字列になっていることが珍しくない
 * （例: 林 ⊂ 小林）。したがって、苗字の漢字を name に使った
 * getByRole の正規表現マッチは、データが増えるほど衝突しやすく
 * 構造的に破綻する。ここでは名前（テキスト）でリンクを一意に
 * 特定するのではなく、一意性が保証されている href（/myoji/<slug>）で
 * 要素を特定し、そのうえで表示テキストを検証する。
 *
 * `getAllByRole("link")` はツリー全体を舐めてアクセシブルロールを
 * 計算し直す高コストな呼び出しなので、苗字ごとのループの中で毎回
 * 呼ぶと O(n^2) になる。一度だけ取得して href の索引に変換する。
 *
 * 検証項目ごとにテストを分けると、そのたびに全行を描画し直すことになる。
 * jsdom での描画は530件で実測7.7秒かかり、4テストで5秒のタイムアウトを
 * 超えて落ちた（実ブラウザの描画コストではなく jsdom の事情）。
 * 収録件数はこの先も増えるので、描画は1回だけにして、
 * どの検証で落ちたかは expect のメッセージで区別する。
 */
describe("RankingPage (全国ランキング)", () => {
  it("全件を順位順に、それぞれ自身の詳細ページへのリンクとして描画する", () => {
    render(<RankingPage />);
    const all = getAllSurnames();

    const tbody = screen.getByRole("table").querySelector("tbody");
    expect(tbody).not.toBeNull();
    const rows = within(tbody as HTMLElement).getAllByRole("row");
    // 行数は苗字の件数と一致する（ヘッダー行は tbody に含まれない）
    expect(rows, "行数が収録件数と一致しない").toHaveLength(all.length);

    const links = screen.getAllByRole("link");
    const byHref = new Map(links.map((link) => [link.getAttribute("href"), link]));
    for (const entry of all) {
      const link = byHref.get(`/myoji/${entry.slug}`);
      expect(link, `${entry.slug} へのリンクが見つからない`).toBeTruthy();
      expect(link, `${entry.slug} のリンク文字列が苗字と一致しない`).toHaveTextContent(entry.kanji);
    }

    // 並び順は表示上の意味を持つので、リンクの出現順そのものを比較する
    expect(
      links.map((link) => link.getAttribute("href")),
      "行が全国順位の昇順で並んでいない",
    ).toEqual(all.map((entry) => `/myoji/${entry.slug}`));

    // 順位が絶対的な事実ではないことを、表と同じ画面で必ず断る
    expect(
      screen.getByText(
        "順位は名字由来netの集計に基づく参考値です。他の資料では順位が異なることがあります。",
      ),
      "順位の典拠を示す注記が出ていない",
    ).toBeTruthy();
  }, 60_000);
});
