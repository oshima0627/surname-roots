# 本文（origin）からサイト名の枠組みを外す作業に使ったスクリプト（2026-09-11）

リポジトリ直下で実行する。作業ファイルの置き場 `<dir>` はリポジトリ外（スクラッチパッド等）でよい。

1. `python tools/rewrite-origin/export.py <dir>` … 本文に参照サイト名を含む項目を `<dir>/in-N.json` に 8 分割で書き出す
2. `in-N.json` を人（またはエージェント）が `out-N.json`（`[{slug, origin}]`）に書き換える。
   ルール: 事実を足さない・変えない、新しい漢字の固有名詞と数字を入れない、長さは元の 0.7〜1.3 倍、分布の文は残す
3. `python tools/rewrite-origin/verify.py <dir>` … 禁止語の残り／元に無い漢字語（2字以上）／元に無い数字／長さ比／60字未満 を検出。`flagged 0` になるまで直す
4. `python tools/rewrite-origin/apply.py <dir> --dry` で件数を見てから `--dry` 無しで書き戻す（`origin` 行だけを置換し、CRLF・整形を保つ）
5. `npm test`（`本文（origin）に参照サイト名を書かない` のガードが通ること）→ `npm run deploy`
