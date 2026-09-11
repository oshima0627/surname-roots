# HANDOFF

最終更新: 2026-09-11

## いま何をしているのか

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
4. この HANDOFF を書き直した

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
2. **削除した理由を本人に確認する。** 出典表記が理由なら、`/myoji/[slug]` の本文で他サイト名を引いている箇所を
   自分の言葉に書き換える（`src/data/surnames/*.json` の `sources` は残してよい）
3. 個別プロパティ `sc-domain:myoji.nexeed-lab.com` を作り直すか決める（親で見えているので任意）
4. 9/1 の HANDOFF にあった宿題（インデックス登録率の改善）は、1 の結果を見てから

## 触ってはいけないところ

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
