# HANDOFF

最終更新: 2026-09-11

## いま何をしているのか

**本文から他サイト名を外す書き換えの途中。** 復元は完了している（下の「復元」節）。

削除の理由は本人に確認済み: **「出典の扱い」**。1,000件中 509 件の本文（`origin`）が
「名字由来netは〜を挙げ、日本姓氏語源辞典も〜とする」という他サイトの説を並べる形で、
名字由来netの規約が名指しする「まとめサイト」そのものに見える状態だった。
本人の選択は「案1: 本文からサイト名の枠組みを外して事実だけを自分の言葉で書く。出典リンク（sources）は残す。
名字由来netへの許諾問い合わせはしない」。

### 進み方（2026-09-11 着手）

1. 対象 509 件を 8 バッチ（64件ずつ）に分け、サブエージェントに書き換えさせる
   - 入出力はスクラッチパッド `…/scratchpad/rewrite/in-N.json` → `out-N.json`（リポジトリ外）
   - ルール: 事実を足さない・変えない、新しい漢字の固有名詞と数字を入れない、長さ 0.7〜1.3 倍、分布の文は残す
2. `verify.py` で機械検証: 禁止語の残り／元に無い漢字語（2字以上）／元に無い数字／長さ比／60字未満 を検出
3. 通ったものを `apply.py` で `src/data/surnames/<slug>.json` の `origin` 行だけ文字列置換（CRLF・整形を壊さない）
4. `npm test`（回帰テストを追加済み。下記）→ `npm run deploy` → 本番 curl

**2026-09-11 時点の状態: バッチ 1〜4 をエージェントに投げた直後。out-*.json はまだ 0 件。書き戻しは未実施。**

### 回帰テスト（追加済み・コミット済み）

`src/lib/surnames.test.ts` に「本文（origin）と家紋の説明に参照サイト名を書かない」を追加。
禁止語: 名字由来net / 日本姓氏語源辞典 / ウィキペディア / Wikipedia / myoji-yurai / name-power / .com / .net。
**書き換えが終わるまでこのテストは落ちる**（意図どおり。509 件が残っているため）。

### 家紋の説明 2 件は手で直した（コミット済み）

- `kimura.json` 四つ目結: 「ウィキペディア『木村氏』は〜、kakeisi.com も〜、個人ブログ（kisetsumimiyori.com）には〜」→ サイト名を外し「〜とする資料があり、〜に挙げる資料もある」に
- `ishii.json` 丸に三つ引: 「ウィキペディア『石井氏』は〜、myoji-yurai.net も〜」→ 同様

### 規約の確認（2026-09-11 に取得）

- 名字由来net: 「ページ内容の全部あるいは一部を無断で転載することを禁止」。順位・人数・読み・解説は「参考資料 名字由来net」＋URLリンクで利用可。「引用元の記載なく無断での商用利用（まとめサイトなど含む）」は禁止
- 日本姓氏語源辞典（name-power.net）: 「引用・リンク歓迎。引用の際は出典の記載を」
- 現状のページは参考資料リンク一覧と「出典: 名字由来net」表記があり、形式上の条件は満たしている

## 復元（2026-09-11・完了）

**消えていたサイトを復元して、本番へ戻した。** 2026-09-01〜05 の間に GitHub リポジトリ・ローカル・
Cloudflare Worker・DNS の4つがすべて消えていた（経緯はセッション記録に無く、不明）。
一方 Google 側は 375 ページを検索結果に出し続けており、9/2〜9/8 は毎日 400〜880 表示・4〜17 クリックが
付いていた（親プロパティ `sc-domain:nexeed-lab.com` で実測）。**落ちていた分は全部取りこぼしだった。**

2026-09-11 に本人の指示（「myoji を戻す」）で復元。コードは 9/1 の最終コミット `ac0c84d` のまま、変更なし。

## 今回やったこと（2026-09-11）

1. GitHub Settings → Deleted repositories から `oshima0627/surname-roots` を復元（公開リポジトリのまま）
2. `git clone` → `projects/surname-roots/`
3. `npm ci`（652 packages）→ `npm run deploy`
   - `wrangler deploy` が Worker `surname-roots` を再作成し、`myoji.nexeed-lab.com (custom domain)` を再設定した
   - Version ID `d8da91b3-ed46-445a-ad49-88170068237d`。5,072 ファイルをアップロード
4. GSC 親プロパティのサイトマップ一覧に myoji が無かった（13件中0）ので `https://myoji.nexeed-lab.com/sitemap.xml` を再送信した
5. この HANDOFF を書き直した

## 検証済みの事実（実際に画面へ出した出力のみ）

### 復元前（2026-09-11 午前）

- `nslookup myoji.nexeed-lab.com` → Non-existent domain。`curl` は 000
- Cloudflare API: Worker 一覧に `surname-roots` 無し。Workers カスタムドメイン一覧に `myoji.nexeed-lab.com` 無し
- `gh repo list` に無し。ローカルにも無し

### 復元後（2026-09-11、デプロイ直後に curl）

| 確認項目 | 結果 |
|---|---|
| `nslookup` | 104.21.32.16 / 172.67.182.68（Cloudflare）に解決 |
| `/` `/myoji/sato` `/myoji/tominaga` `/sitemap.xml` `/robots.txt` | **すべて HTTP 200** |
| `/myoji/zzz-not-exist` | **404**（`not_found_handling: "404-page"` が効いている） |
| `/myoji/sato` の canonical | `https://myoji.nexeed-lab.com/myoji/sato`（9/1 の修正が本番に出ている） |
| `sitemap.xml` の `<loc>` | **1,003 件** |

### GSC の実績（親プロパティ、2026-09-11 に画面で確認、期間 06/09〜09/08）

- myoji を含むページ: クリック 81 / 表示 5,020 / CTR 1.6% / 平均掲載順位 9.7。375 ページに表示あり
- **全量が 8/30 以降。** 日次: 9/1 353表示 → 9/3 879表示（17クリック）→ 9/8 425表示（4クリック）
- 上位ページ: `/myoji/tominaga` 5クリック、`/myoji/moriya` 4、`/myoji/matsunaga` 4、`/myoji/umeda` 101表示1クリック

## 未検証のもの

- **再送信したサイトマップの読み込み結果。** 送信直後の画面は「取得できませんでした・最終読み込み 2026/08/28・検出 1,003」で、
  これは落ちていた間の古い結果。次回 GSC を開いて「成功しました」に変わっているか見る（変わっていなければもう一度送信）

- **落ちていた期間にクロールされた分がインデックスから消えたかどうか。** 9/8 時点でも表示は続いていたが、
  9/9〜9/11 の 3 日間は未確認（GSC のデータが追いついていない）
- **復元後に流入が 9/3 の水準（17 クリック/日）へ戻るか。** 答え合わせは 2026-09-21 ごろ、
  親プロパティのページフィルタ `*myoji.nexeed-lab.com` で日次を見る
- 個別プロパティ `sc-domain:myoji.nexeed-lab.com` は **2026-09-11 時点で「アクセス権がありません」** と出た
  （9/1 に作ったはずのプロパティが無い。削除の際に消したのかは不明）。親プロパティで代用できているので急がない
- 削除の理由。検索スニペットに「名字由来net は〜」「日本姓氏語源辞典も〜」と他サイトを引く文が見える。
  **出典の扱いを理由に消したのなら、本文の書き方を見直す必要がある**（未確認）
- `npm test` / `npm run typecheck` / `npm run lint` は今回走らせていない（コード変更が無いため）。
  ビルドは `npm run deploy` の中で通った（font:build → font:verify → next build → 1010 ページ生成）

## 次にやること

0. **書き換えを最後まで通す。** 順に: エージェントの out-1〜8.json が揃う → 
   `python <scratchpad>/rewrite/verify.py <scratchpad>/rewrite` で flagged 0 になるまで直す →
   `python <scratchpad>/rewrite/apply.py <scratchpad>/rewrite` → `npm test`（本文のガードが通ること）→
   `npm run deploy` → `curl -s https://myoji.nexeed-lab.com/myoji/aida | grep -c 名字由来net` が 0。
   スクラッチパッドが消えている場合は `export.py` から作り直す（このリポジトリには置いていない）
1. **2026-09-21 ごろ: 流入が戻ったか見る。**
   `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Anexeed-lab.com&num_of_days=28&breakdown=date&page=*myoji.nexeed-lab.com`
   9/11 以降の日次クリックが 9/3 前後の水準（10〜17）に戻っていれば復旧完了
2. ~~削除した理由を本人に確認する~~ → 確認済み（出典の扱い）。対応は上の 0
3. 個別プロパティ `sc-domain:myoji.nexeed-lab.com` を作り直すか決める（親で見えているので任意）
4. 9/1 の HANDOFF にあった宿題（インデックス登録率の改善）は、1 の結果を見てから

## 触ってはいけないところ

- **本文（origin）に他サイト名を書かない。** 出典は `sources` に URL で置く。回帰テストが落ちる
- **書き換えで事実を足さない。** 裏取り済みの内容の言い換えだけ。`verify.py` の「新出漢字語」「新出数字」が出たら差し戻す
- **このリポジトリを消さない。** 消すと Worker とカスタムドメインも手で消すことになり、
  Google 側の 375 ページ分の流入がまるごと落ちる。閉じるなら先に GSC で削除リクエストを出し、
  この HANDOFF に理由を書いてから
- `wrangler.jsonc` の `routes[].custom_domain: true`。これがカスタムドメインの再作成をしている
- **`src/app/layout.tsx` に `alternates.canonical` を書かない。** 自前の canonical を持たない
  ページが継承してトップページを指す。canonical は必ず各ページ側で持たせる
- `next.config.ts` の `output: "export"`。Cloudflare Workers の静的アセット配信
  （`wrangler.jsonc` の `assets.directory: "./out"`）がこの出力を前提にしている
- `wrangler.jsonc` の `not_found_handling: "404-page"`。存在しない苗字のURLで正しく404を返すための設定
- `src/app/robots.ts` / `src/app/sitemap.ts` の `export const dynamic = "force-static"` を外さない
- `src/app/sitemap.ts` は `getAllSurnames()` を使う。詳細ページの `generateStaticParams()` と
  同じ関数を使うことがズレを防ぐ仕組みなので、別のデータ源に差し替えない
- 苗字データ（`src/data/surnames/*.json`）は「実際に fetch して読んだ独立2ソースの一致のみ採用」が原則
  （`AGENTS.md` / `src/lib/schema.ts` のコメント参照）
- **デプロイは手動 `npm run deploy` のみ。** `.github/workflows` は無く、Cloudflare Workers Builds の
  Git 連携も無い（復元後の Worker は wrangler が作ったので連携は付いていない）
