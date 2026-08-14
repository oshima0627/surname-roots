# 苗字ルーツ辞典

日本の苗字の由来・語源と、都道府県別の分布を調べられる静的サイト。

- 公開先: <https://myoji.nexeed-lab.com>
- 設計: `docs/superpowers/specs/2026-08-12-surname-roots-design.md`
- 実装計画: `docs/superpowers/plans/2026-08-12-surname-roots.md`

## 開発

```bash
npm install
npm run dev          # 開発サーバー
npm test             # テスト
npm run typecheck    # 型チェック
npm run lint         # lint
npm run build        # 静的エクスポート（out/ を生成）
npm run deploy       # ビルドして Cloudflare Workers へデプロイ
npm run check:links  # sources のURLがすべて生きているか確認（公開前に手動で実行）
```

`check:links` は全苗字の `sources` に載っているURLへ実際にリクエストを送り、
到達できないものを報告する。**ネットワークに数百件のリクエストを投げるため、
`npm test` や `npm run build` には含めていない。** リリース前に手動で実行すること。
失敗があれば非0で終了するので、リリース判定のゲートにも使える。

## 構成

Next.js の静的エクスポート（`output: "export"`）を Cloudflare Workers の Static Assets で配信する。
サーバーロジックもDBも持たない。検索は苗字インデックスをクライアントに載せてブラウザ内で完結させる。

**開発環境が Windows のため OpenNext による SSR は使えない。** この構成を崩さないこと。

## データの追加

`src/data/surnames/<slug>.json` に1件 = 1ファイルで置く。スキーマは `src/lib/schema.ts`。
追加したら `npm test` で検証する（全ファイルがスキーマ・slug整合・県名・配列の排他性を自動チェックされる）。

### 記述のルール

**記憶で書かない。** 公開情報を実際に読み、裏を取ってから自分の言葉で書く。

- **情報源とは、実際に fetch して本文を読んだページのこと。** 検索結果のスニペットは情報源ではない
- **媒体が違っても署名が同じなら1つの情報源。** 苗字解説は同じ研究者が複数媒体で執筆していることが多い
- **独立した2つの情報源が一致した内容のみ採用する。** 1つしか無いものは本文で出典を明示するか、載せない
- **有名人は1件ずつ本人のページを開いて確認する。** 芸名・旧姓・異体字で外れる例が実際にあった
- **裏が取れない項目は空にする。** `kamon: []` や `rankNational: null` は正当な値。埋めるための創作をしない
- 参照したURLは `sources` に記録する。**詳細ページに「参考資料」として掲載される**ので、
  読者が実際に開くリンクになる。開けないURLや、その苗字と無関係なURLを入れない

### 既知の限界

- **全国順位は51位以降、出典が実質1系統しかない。** Wikipedia の一覧は50位までで、
  それ以降は同記事が出典に挙げる名字由来netに依拠している。別の資料とは最大6位の差がある
  （例: 市川 99位 / 105位）。詳細ページとランキングページにその旨を明記している
- **101位以降は由来の資料が薄い。** `origin` の最低文字数を60字に下げてある。
  下げたのは文字数だけで、**「実際に fetch して本文を読んだ独立2ソースの一致のみ採用する」原則は据え置いている**
  （実際には全1000件が98字以上書けており、緩和した下限は使っていない）
- **101位以降は家紋がほぼ空。** 900件中、2ソースで裏が取れたのは菊池の1件のみ。
  Wikimedia Commons からの画像取得も行っていないため、`svg` を持つ新規エントリはない
- **有名人が0人のエントリが71件ある。** 候補が見つからなかったのではなく、
  **候補の本名・戸籍表記がその苗字と一致しなかったため除外した**結果である
  （例: 沢田研二＝戸籍「澤田」、小沢一郎＝旧字体「小澤」、谷崎潤一郎は「谷崎」であって「谷」ではない、
  高嶋ちさ子＝本名「盛田」かつ旧姓は「はしご高」の髙嶋、川嶋あい＝本名「川島」）
- **異体字は日本姓氏語源辞典に立項が無いことがある**（奧村・奧田・奧山など）。
  その場合は素の字体のページを出典に使っている（由来は同じであるため）。
  奧山は名字由来netにも由来の記述が無く、その旨を本文に明記している
- **`/ranking` は1000行で HTML 767KB（実測）。** ただし brotli 圧縮後は41KB、gzip でも64KB で、
  Cloudflare は圧縮して配信するため分割や遅延描画は入れていない。
  さらに収録件数を増やす場合はこの数字を測り直すこと
- 苗字の由来には諸説ある。全ページのフッターに「本サイトの解説は諸説あるうちの一説です。」を常時表示している

## 字体違いの扱い

斎藤と斉藤のように字体が異なる苗字は別ページにする。URLは半角英字のみなので、
**最も一般的な字体が素の slug を取り、以降は区別する漢字の音読みを付す**（斎藤=`saito` / 斉藤=`saito-sei`）。
素の slug は全国順位が上のほうが取る。

同じ読みで字が違う苗字も同じ規則で扱う（笠井 `kasai` / 河西 `kasai-ka`）。
一字姓が既存の slug と衝突する場合も、その一字の音読みを付す（大木 `oki` / 沖 `oki-chu`）。

**音読みが元の字と同じ異体字・旧字体には `-itaiji` を付す**（音読みでは区別できないため）。
同じ素の字に `-itaiji` が複数必要な場合は甲乙丙の順で足す
（渡辺 `watanabe` / 渡邊 `watanabe-itaiji` / 渡邉 `watanabe-itaiji-otsu`）。
**slug に数字は使えない**（`src/lib/schema.ts` が `/^[a-z][a-z-]*$/` で弾く）ため、
`watanabe-itaiji2` のような命名は取れない。

読みが本当に分かれている場合は、音読みを付けずにその読みを slug にしてよい
（渡辺 `watanabe` / 渡部 `watabe`、川端 `kawabata` / 川畑 `kawahata`、森谷 `moritani`）。

現在の該当は84組。

| 素の slug | 区別する側 |
|---|---|
| 斎藤 `saito` | 斉藤 `saito-sei` |
| 菊地 `kikuchi` | 菊池 `kikuchi-chi` |
| 新井 `arai` | 荒井 `arai-ko` |
| 伊藤 `ito` | 伊東 `ito-to` |
| 武田 `takeda` | 竹田 `takeda-chiku` |
| 酒井 `sakai` | 坂井 `sakai-han` |
| 斎藤 `saito` | 齋藤 `saito-itaiji` |
| 上田 `ueda` | 植田 `ueda-shoku` |
| 川村 `kawamura` | 河村 `kawamura-ka` |
| 阿部 `abe` | 安部 `abe-an` |
| 中島 `nakajima` | 中嶋 `nakajima-itaiji` |
| 本田 `honda` | 本多 `honda-ta` |
| 足立 `adachi` | 安達 `adachi-an` |
| 島田 `shimada` | 嶋田 `shimada-itaiji` |
| 久保田 `kubota` | 窪田 `kubota-wa` |
| 小沢 `ozawa` | 小澤 `ozawa-itaiji` |
| 奥村 `okumura` | 奧村 `okumura-itaiji` |
| 長野 `nagano` | 永野 `nagano-ei` |
| 富田 `tomita` | 冨田 `tomita-itaiji` |
| 太田 `ota` | 大田 `ota-dai` |
| 沢田 `sawada` | 澤田 `sawada-itaiji` |
| 奥田 `okuda` | 奧田 `okuda-itaiji` |
| 川原 `kawahara` | 河原 `kawahara-ka` |
| 渡辺 `watanabe` | 渡邊 `watanabe-itaiji` |
| 小島 `kojima` | 小嶋 `kojima-itaiji` |
| 古谷 `furuya` | 古屋 `furuya-oku` |
| 斎藤 `saito` | 齊藤 `saito-sei-itaiji` |
| 大沢 `osawa` | 大澤 `osawa-itaiji` |
| 渡辺 `watanabe` | 渡邉 `watanabe-itaiji-otsu` |
| 井手 `ide` | 井出 `ide-shutsu` |
| 永井 `nagai` | 長井 `nagai-cho` |
| 河合 `kawai` | 川合 `kawai-sen` |
| 川田 `kawada` | 河田 `kawada-ka` |
| 加納 `kano` | 狩野 `kano-shu` |
| 緒方 `ogata` | 尾形 `ogata-kei` |
| 竹内 `takeuchi` | 武内 `takeuchi-bu` |
| 小田 `oda` | 織田 `oda-shoku` |
| 川本 `kawamoto` | 河本 `kawamoto-ka` |
| 河合 `kawai` | 川井 `kawai-i` |
| 遠山 `toyama` | 外山 `toyama-gai` |
| 橘 `tachibana` | 立花 `tachibana-ritsu` |
| 坂本 `sakamoto` | 阪本 `sakamoto-han` |
| 中村 `nakamura` | 仲村 `nakamura-chu` |
| 笠井 `kasai` | 葛西 `kasai-katsu` |
| 山崎 `yamazaki` | 山﨑 `yamazaki-itaiji` |
| 畑 `hata` | 秦 `hata-shin` |
| 中沢 `nakazawa` | 中澤 `nakazawa-itaiji` |
| 泉 `izumi` | 和泉 `izumi-wa` |
| 土井 `doi` | 土居 `doi-kyo` |
| 奥野 `okuno` | 奧野 `okuno-itaiji` |
| 平 `taira` | 平良 `taira-ryo` |
| 小畑 `obata` | 小幡 `obata-han` |
| 大場 `oba` | 大庭 `oba-tei` |
| 菅 `suga` | 須賀 `suga-su` |
| 坂本 `sakamoto` | 坂元 `sakamoto-gen` |
| 奥山 `okuyama` | 奧山 `okuyama-itaiji` |
| 長島 `nagashima` | 永島 `nagashima-ei` |
| 小倉 `ogura` | 小椋 `ogura-ryo` |
| 浜田 `hamada` | 濱田 `hamada-itaiji` |
| 松本 `matsumoto` | 松元 `matsumoto-gen` |
| 山本 `yamamoto` | 山元 `yamamoto-gen` |
| 桜井 `sakurai` | 櫻井 `sakurai-itaiji` |
| 吉沢 `yoshizawa` | 吉澤 `yoshizawa-itaiji` |
| 大島 `oshima` | 大嶋 `oshima-itaiji` |
| 田畑 `tabata` | 田端 `tabata-tan` |
| 喜多 `kita` | 北 `kita-hoku` |
| 児玉 `kodama` | 小玉 `kodama-gyoku` |
| 坂口 `sakaguchi` | 阪口 `sakaguchi-han` |
| 増田 `masuda` | 益田 `masuda-eki` |
| 金沢 `kanazawa` | 金澤 `kanazawa-itaiji` |
| 木戸 `kido` | 城戸 `kido-jo` |
| 大木 `oki` | 沖 `oki-chu` |
| 玉置 `tamaki` | 玉木 `tamaki-boku` |
| 小島 `kojima` | 児島 `kojima-ji` |
| 庄司 `shoji` | 東海林 `shoji-to` |
| 高島 `takashima` | 高嶋 `takashima-itaiji` |
| 広瀬 `hirose` | 廣瀬 `hirose-itaiji` |
| 川島 `kawashima` | 川嶋 `kawashima-itaiji` |
| 秋元 `akimoto` | 秋本 `akimoto-hon` |
| 富永 `tominaga` | 冨永 `tominaga-itaiji` |
| 畑中 `hatanaka` | 畠中 `hatanaka-itaiji` |
| 小関 `ozeki` | 大関 `ozeki-dai` |
| 笠井 `kasai` | 河西 `kasai-ka` |
| 今野 `konno` | 紺野 `konno-kon` |
