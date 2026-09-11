# HANDOFF

最終更新: 2026-09-11

## いま何をしているのか

**出典の扱いの問題を直し終えて、本番反映まで済んだ。** 復元（下の節）も完了している。
残っているのは答え合わせ（9/21 の流入確認）だけ。

削除の理由は本人に確認済み: **「出典の扱い」**。1,000件中 509 件の本文（`origin`）が
「名字由来netは〜を挙げ、日本姓氏語源辞典も〜とする」という他サイトの説を並べる形で、
名字由来netの規約が名指しする「まとめサイト」そのものに見える状態だった。
本人の選択は「案1: 本文からサイト名の枠組みを外して事実だけを自分の言葉で書く。出典リンク（sources）は残す。
名字由来netへの許諾問い合わせはしない」。あわせて **「家紋が似ていないのですべて削除」** の指示で家紋を機能ごと消した。

## 今回やったこと（2026-09-11・出典の扱い）

| コミット | 内容 |
|---|---|
| `84e0b3f` | 回帰テスト「本文（origin）に参照サイト名を書かない」を追加。家紋説明 2 件（kimura / ishii）からサイト名を外す |
| `fbace7b` | **Stop フックの自動コミット**。中身は家紋削除スクリプトの前半（1,000 件の JSON から `kamon` を外した分）。私が切ったコミットではない |
| `07e1fa3` | 家紋の機能を削除（スキーマ・`public/kamon` 23 点・`Kamon` コンポーネント・`docs/kamon-credits.md`・テスト）。`/credits` はフォントの帰属表示だけ残した |
| `289a7a1` | **本文 509 件を書き換え**。8 バッチ（64件×7＋61件）をサブエージェントに書かせ、`verify.py` で機械検証してから `apply.py` で書き戻した |
| `d309cd8` | 家紋の出典だった irohakamon.com のリンク 13 本を `sources` から外す |

- 書き換えのルール: 事実を足さない・変えない、新しい漢字の固有名詞と数字を入れない、長さ 0.7〜1.3 倍、分布の文は残す。
  「A は〜とし、B も〜とする」は「〜とする説と、〜とする説がある」に、同内容なら 1 つにまとめる
- スクリプトは **`tools/rewrite-origin/`** に置いた（README に手順）。作業ファイルはリポジトリ外
- エージェントが「迷った」と報告した箇所は目で見た。`okuyama-itaiji` は「独立した由来の記録はなく」が言い過ぎだったので
  「独立に解説した資料は参照した範囲にはなく」に弱めた。`yamazaki-itaiji` は出典運用の注記を由来の文に置き換えたが事実は同じ

### 検証済みの事実（実際に画面へ出した出力のみ）

| 確認 | 結果 |
|---|---|
| `verify.py`（509 件） | **checked 509 / flagged 0**（禁止語の残り 0、元に無い漢字語・数字 0、長さ比は全件 0.7〜1.3） |
| `apply.py` | dry-run 509 → 本番書き込み 509。`grep -l "名字由来net\|日本姓氏語源辞典\|ウィキペディア" src/data/surnames/*.json` → **0 件** |
| `npx tsc --noEmit` / `npx eslint` | 指摘なし |
| `npm test` | **17 files / 130 tests pass / 0 fail**（家紋削除前は 164 tests。家紋関連 34 本を削除） |
| `npm run build` | 成功。`out/kamon` 無し。`out/myoji/sato.html` と `out/credits.html` に「家紋」の語 0 |
| 本番（`npm run deploy` 2 回、最終 Version `53423124-feca-4ff0-85ba-8332abed7e0f`） | `/myoji/aida` の本文が書き換え後の文で配信。`/kamon/genji-guruma.svg` → **404**。`/myoji/kimura` に irohakamon **0** |
| 本番に残る「名字由来net」 | 各ページ 2 箇所。**順位の下の「出典: 名字由来net。」表記とその RSC ペイロード**で、意図どおり残している（規約が求める帰属表示） |
| 参考資料リンク | `/myoji/aida` に myoji-yurai.net と name-power.net のリンクが残っている |

### 規約の確認（2026-09-11 に取得）

- 名字由来net: 「ページ内容の全部あるいは一部を無断で転載することを禁止」。順位・人数・読み・解説は「参考資料 名字由来net」＋URLリンクで利用可。「引用元の記載なく無断での商用利用（まとめサイトなど含む）」は禁止
- 日本姓氏語源辞典（name-power.net）: 「引用・リンク歓迎。引用の際は出典の記載を」
- ページには参考資料リンク一覧と「出典: 名字由来net」表記があり、形式上の条件は満たしている。今回直したのは「他サイトの説を並べただけの本文」という構造

### 未検証のもの

- **書き換えた 509 件の日本語としての読みやすさは、全件を目で見てはいない。** 機械検証（事実の増減が無いこと）とエージェントの報告箇所の目視だけ。
  おかしな文を見つけたら `src/data/surnames/<slug>.json` の `origin` を直して `npm run deploy`
- 書き換えが Google の評価にどう効くかは未検証。見るのは 9/21 以降の流入（下の 1）
- 順位・推定人数（名字由来netの集計）は全 1,000 件で使い続けている。規約上は帰属表示で可だが、依存を減らす案 2（推定人数を落とす）は**採らなかった**（本人の選択）

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

1. **2026-09-21 ごろ: 流入が戻ったか見る。**
   `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Anexeed-lab.com&num_of_days=28&breakdown=date&page=*myoji.nexeed-lab.com`
   9/11 以降の日次クリックが 9/3 前後の水準（10〜17）に戻っていれば復旧完了
2. **書き換えた本文を拾い読みして、日本語がおかしい項目があれば直す**（上の「未検証」）
3. 個別プロパティ `sc-domain:myoji.nexeed-lab.com` を作り直すか決める（親で見えているので任意）
4. 9/1 の HANDOFF にあった宿題（インデックス登録率の改善）は、1 の結果を見てから

## 触ってはいけないところ

- **本文（origin）に他サイト名を書かない。** 出典は `sources` に URL で置く。回帰テストが落ちる
- **本文を書き換えるときに事実を足さない。** 裏取り済みの内容の言い換えだけ。`tools/rewrite-origin/verify.py` の「新出漢字語」「新出数字」が出たら差し戻す
- **家紋を戻さない。** 本人の判断で機能ごと消した（似ていないため）。スキーマにも `kamon` は無い
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
