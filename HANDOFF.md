# HANDOFF

最終更新: 2026-08-25

## いま何をしているのか

検索エンジンにサイトを認識させるための最低限の設定（robots.txt / sitemap.xml）を整えている。
このリポジトリは 2026-08-25 時点で **sitemap.xml が 404、robots.txt はアプリのHTMLが返る**状態だった。
Google Search Console（ドメインプロパティ `nexeed-lab.com`）の直近3ヶ月で、myoji サブドメインは
**検索パフォーマンスに1行も出てこない**（＝実質どのクエリでも表示されていない）。
1000件の詳細ページがあるのに、その存在をクローラに一切伝えていなかったことになる。

## 今回やったこと

- `src/lib/site.ts` を新規作成（`SITE_URL = "https://myoji.nexeed-lab.com"`。`wrangler.jsonc` の
  `routes[].pattern` と一致させている）
- `src/app/robots.ts` を新規作成（`MetadataRoute.Robots`、`dynamic = "force-static"`）
- `src/app/sitemap.ts` を新規作成（`MetadataRoute.Sitemap`、`dynamic = "force-static"`）
  - 詳細ページの一覧は `getAllSurnames()` から作る。
    `src/app/myoji/[slug]/page.tsx` の `generateStaticParams()` と**同じ関数**なので、
    データを足せば sitemap も自動で追随し、ズレようがない
  - `lastModified` は付けていない。苗字データに更新日を持たせていないため、
    ビルド日時を入れると「更新されていないページを更新済み」と偽ることになる
- `npm run build` → `npx wrangler dev --local` で実際に配信して確認

## 検証済みの事実（実際に画面に出した出力のみ）

- `npm run build`（`font:build` → `font:verify` → `next build`）成功。
  `✓ Generating static pages using 12 workers (1010/1010) in 10.1s`。
  Route 一覧に `/`, `/_not-found`, `/apple-icon.png`, `/credits`, `/icon.svg`, `/myoji/[slug]`（+997 more paths）,
  `/ranking`, `/robots.txt`, `/sitemap.xml`
- `out/robots.txt` の中身:

  ```
  User-Agent: *
  Allow: /

  Sitemap: https://myoji.nexeed-lab.com/sitemap.xml
  ```

- `out/sitemap.xml` は **`<loc>` が 1003件**（トップ + `/ranking` + `/credits` + 苗字詳細1000件）。先頭:

  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
  <loc>https://myoji.nexeed-lab.com</loc>
  <changefreq>weekly</changefreq>
  <priority>1</priority>
  </url>
  <url>
  <loc>https://myoji.nexeed-lab.com/ranking</loc>
  ...
  <loc>https://myoji.nexeed-lab.com/myoji/sato</loc>
  ```

- **sitemap の全URLと生成HTMLの1対1一致を機械的に確認した**（推測ではない）。
  sitemap の `<loc>` から作ったパス一覧と、`out/` 配下の `.html`（404 / _not-found を除く）を
  `sort` して `comm` で突き合わせた結果:

  ```
  sitemap件数: 1003
  生成HTML件数(404/_not-found除く): 1003
  --- sitemapにあるがHTMLが無い ---
  （0件）
  --- HTMLはあるがsitemapに無い ---
  （0件）
  ```

  → 存在しないURLは1件も書いておらず、存在するページも1件も取りこぼしていない
- `npx wrangler dev --local --port 8792`（本番と同じ `wrangler.jsonc` = `not_found_handling: 404-page`）に対する実測:

  ```
  PATH /robots.txt       -> HTTP 200 text/plain; charset=utf-8      74bytes
  PATH /sitemap.xml      -> HTTP 200 application/xml            125374bytes
  PATH /                 -> HTTP 200 text/html; charset=utf-8   140309bytes
  PATH /ranking          -> HTTP 200 text/html; charset=utf-8   785525bytes
  PATH /myoji/sato       -> HTTP 200 text/html; charset=utf-8   119879bytes
  PATH /no-such-path-xyz -> HTTP 404 text/html; charset=utf-8     9480bytes
  ```

  配信された `/sitemap.xml` の `<loc>` 件数も 1003 で一致。
  → **ホスティング側（`_routes.json` 等）の追加設定は不要。ファイルを置くだけで直る。**
- `npm run lint`（0 errors / 5 warnings、既存の未使用変数warningのみ）、`npm run typecheck` 無出力（成功）、
  `npm test` 164 passed（18ファイル）

## 未検証のもの

- **本番へのデプロイは実行していない。** 上記は全てローカルの `wrangler dev` での実測であり、
  `https://myoji.nexeed-lab.com/sitemap.xml` が 404 でなくなることは**未確認**
- Cloudflare 側で GitHub 連携（Workers Builds）が有効かどうかはリポジトリからは判定できない。
  有効なら `git push` で自動デプロイされる可能性がある（このリポジトリには `.github/workflows` は無い）
- `src/app/layout.tsx` に `metadataBase` が無く、`canonical` も出していない。今回は手を付けていない

## 次にやること

1. デプロイする（本人が判断して実行）:

   ```bash
   cd C:/Users/oshim/Documents/projects/surname-roots
   npx wrangler login   # 初回のみ
   npm run deploy       # npm run build → wrangler deploy
   ```

2. デプロイ後に実測で確認する:

   ```bash
   curl -s  https://myoji.nexeed-lab.com/robots.txt
   curl -s  https://myoji.nexeed-lab.com/sitemap.xml | grep -c "<loc>"   # 1003 になるはず
   curl -sI https://myoji.nexeed-lab.com/myoji/sato
   ```

3. Google Search Console（ドメインプロパティ `nexeed-lab.com`）で
   `https://myoji.nexeed-lab.com/sitemap.xml` を送信し、数日後に「検出されたページ数」を見る
4. 1000ページあってインデックスされていないのが現状なので、まず**クロールされ始めるか**を測る。
   それが確認できてから、タイトル・description・内部リンクの改善へ進む

## 触ってはいけないところ

- `next.config.ts` の `output: "export"`。Cloudflare Workers の静的アセット配信（`wrangler.jsonc` の
  `assets.directory: "./out"`）がこの出力を前提にしている
- `wrangler.jsonc` の `not_found_handling: "404-page"`。存在しない苗字のURLで正しく404を返すための設定
- `src/app/robots.ts` / `src/app/sitemap.ts` の `export const dynamic = "force-static"` を外さない
- `src/app/sitemap.ts` は `getAllSurnames()` を使う。詳細ページの `generateStaticParams()` と
  同じ関数を使うことがズレを防ぐ仕組みなので、ここで別のデータ源に差し替えない
- 苗字データ（`src/data/surnames/*.json`）は「実際に fetch して読んだ独立2ソースの一致のみ採用」が原則
  （`AGENTS.md` / `src/lib/schema.ts` のコメント参照）。sitemap 対応では一切触っていない
