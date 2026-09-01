# HANDOFF

最終更新: 2026-09-01

## いま何をしているのか

**myoji.nexeed-lab.com は公開済みで、Google もクロールを始めている。**
だが 2026-09-01 時点で**インデックス登録されていないページが多い**ことが分かった。
いまは「クロールさせる」段階を終えて、**「クロールされた上で登録されるか」を上げる段階**にいる。

今回は、その前提として抜けていた canonical を全ページに出した。

## 今回やったこと（2026-09-01）

### Search Console のプロパティとサイトマップ

- `sc-domain:myoji.nexeed-lab.com` の個別プロパティを新規作成した（所有権はドメイン名プロバイダで自動確認）。
  親 `sc-domain:nexeed-lab.com` の DNS 所有権が継承されるので、TXT レコードの追加は不要だった
- サイトマップは親プロパティ経由で既に登録済みだった（二重登録は不要）

### canonical を全ページに追加（コミット `b81d1a3`、push 済み）

これまで `metadataBase` も `alternates.canonical` も無く、**本番の全ページに canonical タグが
1つも出ていなかった**（下記「検証済みの事実」参照）。

- `src/app/layout.tsx` に `metadataBase: new URL(SITE_URL)` を追加
- **layout には `alternates` を置いていない。** 置くと自前の canonical を持たないページが
  それを継承してトップページを指す。同じ不具合が ikunavi で実際に起きていた（そちらも今回修正済み）
- `/`・`/ranking`・`/credits`・`/myoji/[slug]` の各ページに `alternates.canonical` を追加

コミットは Stop フックの自動コミット（`chore: 作業終了時の自動コミット`）に取り込まれた。
既に push 済みだったため履歴は書き換えていない。**変更内容自体は上記のとおりで欠けはない。**

## 検証済みの事実（実際に画面へ出した出力のみ）

### canonical が無かったことの実測（2026-09-01、本番を curl）

サイトマップ掲載の全2,127URL（nexeed-lab.com 配下の全サイト）を走査した結果、
**myoji は 1,003件すべてが canonical タグ無し**だった。他サイトの内訳:
ai 9件 / pre-meet 7件 / shift-craft 5件 / nisa 2件 / typiq 1件。

### 修正後のビルド出力

- `npm run build` 成功。`✓ Generating static pages using 12 workers (1010/1010) in 5.2s`
- `out/` 配下の全HTMLを走査し、canonical が**自分自身のURL**を指すことを確認:

  | ファイル | canonical |
  |---|---|
  | `out/index.html` | `https://myoji.nexeed-lab.com` |
  | `out/ranking.html` | `https://myoji.nexeed-lab.com/ranking` |
  | `out/credits.html` | `https://myoji.nexeed-lab.com/credits` |
  | `out/myoji/sato.html` | `https://myoji.nexeed-lab.com/myoji/sato` |
  | `out/myoji/watanabe.html` | `https://myoji.nexeed-lab.com/myoji/watanabe` |

- canonical を持つHTML: **1,003 / 1,005**。持たない2件は `out/404.html` と `out/_not-found.html`（意図どおり）
- `out/myoji/` 配下で canonical が `/myoji/` 以外を指すものは **0件**

### 本番の状態（2026-09-01、curl と GSC の画面）

- `https://myoji.nexeed-lab.com/sitemap.xml` は **HTTP 200・`<loc>` 1,003件**
  （前回 HANDOFF で「デプロイ未実行・404のままか未確認」としていた点は解消済み）
- `robots.txt` は `User-Agent: * / Allow: /` と Sitemap 行を返す
- GSC のサイトマップ画面: 送信 2026/08/25・最終読み込み 2026/08/28・**ステータス「成功しました」・検出 1,003ページ**
- GSC「クロール済み - インデックス未登録」の例に myoji のページが並び、**前回のクロール日は 2026/08/29**:
  `/myoji/shimazaki`、`/myoji/otaki`、`/myoji/hamaguchi`
  → **クロールはされている。その上で登録されていない。**

## 未検証のもの

- **canonical の修正が本番に反映されたかは未確認。** ビルド出力で確認しただけで、
  `https://myoji.nexeed-lab.com/myoji/sato` を curl して canonical が出ることは**まだ見ていない**。
  このリポジトリに `.github/workflows` は無く、Cloudflare Workers Builds が
  `git push` で自動デプロイするかどうかも未確定のまま
- **myoji 個別プロパティの数値はまだ出ていない。** 2026-09-01 に作成したばかりで
  「データを処理しています。1日後にもう一度ご確認ください」の状態
- **1,003ページのうち何件が登録済みかは未測定。** 親プロパティ側の「検出 - インデックス未登録」
  1,398件のうち myoji が何件を占めるかも**未確認**（推測はしているが数えていない）
- canonical を足したことで登録率が上がるかどうかは**未検証**。canonical は重複判定の
  入口を塞ぐだけで、登録されない理由そのものへの対策ではない

## 次にやること

1. **本番に反映されているか確認する**（未反映なら `npm run deploy`）:

   ```bash
   curl -s https://myoji.nexeed-lab.com/myoji/sato | grep -o '<link rel="canonical" href="[^"]*"'
   ```

   `https://myoji.nexeed-lab.com/myoji/sato` が出れば反映済み。

2. **2026-09-02 以降に myoji 個別プロパティの数字を見る。**
   `https://search.google.com/search-console/index?resource_id=sc-domain:myoji.nexeed-lab.com`
   見るのは「登録済み」と「未登録の理由の内訳」の2つ。

3. **登録されない理由に応じて手を打つ。**
   - 「検出 - インデックス未登録」が多い → クロール自体が足りない。内部リンクを増やす
   - 「クロール済み - インデックス未登録」が多い → 中身の問題。1,003ページが
     互いに区別のつかない内容になっていないかを疑う（uchina-money で同じ問題が起きている）

## 触ってはいけないところ

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
