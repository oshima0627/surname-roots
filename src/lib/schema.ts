import { z } from "zod";
import { PREFECTURE_NAMES } from "@/lib/prefectures";

const prefectureName = z.string().refine((v) => PREFECTURE_NAMES.includes(v), {
  message: "47都道府県の正式名称ではない",
});

export const surnameEntrySchema = z.object({
  /** URLに使う。ローマ字表記 */
  slug: z.string().regex(/^[a-z][a-z-]*$/),
  kanji: z.string().min(1),
  readings: z.array(z.string().min(1)).min(1),
  /** 全国順位の目安。不明なら null */
  rankNational: z.number().int().positive().nullable(),
  /** "約190万人" のような概略表記。不明なら空文字 */
  populationEstimate: z.string(),
  /** 由来・語源の本文。裏取り済みの内容だけを書く */
  origin: z.string().trim().min(100),
  originRegion: z.string().min(1),
  /**
   * 該当する県だけを列挙する。47県すべてを埋めない。
   * 根拠のない判定を作らないための意図的な設計（設計書 §3.3）
   */
  regionDistribution: z.object({
    多い: z.array(prefectureName),
    やや多い: z.array(prefectureName),
  }).refine((dist) => {
    const set多い
= new Set(dist.多い);
    const hasOverlap = dist.やや多い.some((p) => set多い.has(p));
    return !hasOverlap;
  }, {
    message: "同じ県が「多い」と「やや多い」に重複して登録されている",
  }),
  kamon: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      /**
       * 家紋の画像。持つなら出典情報を必須にする。
       * 意匠自体の著作権は切れているが、画像表現には作者の著作権がある。
       * ここを任意項目にすると出典不明の画像が混入するので、必ず必須のままにすること。
       *
       * フィールド名・構造は元々SVG専用に作ったものだが、PNG（ラスター）1件のためだけに
       * 別フィールドを増設せず、`file` の拡張子で形式を判別する方式に倒している
       * （表示側は src/components/Kamon.tsx 参照）。出典情報の必須性はSVG/PNGどちらでも
       * 変わらず、この判定は見た目の描画方法だけに関わる。
       */
      svg: z
        .object({
          file: z.string().min(1),
          license: z.string().min(1),
          author: z.string().min(1),
          sourceUrl: z.string().regex(/^https?:\/\//),
          modified: z.boolean(),
        })
        .optional(),
    }),
  ),
  famousPeople: z.array(z.object({ name: z.string().min(1), note: z.string().min(1) })),
  /**
   * 裏取りに使ったURL。詳細ページに「参考資料」として公開表示される。
   * zod のバージョン間で `z.string().url()` の扱いが変わるため、正規表現で判定する
   */
  sources: z.array(z.string().regex(/^https?:\/\//)).min(1),
});

export type SurnameEntry = z.infer<typeof surnameEntrySchema>;
export type Distribution = SurnameEntry["regionDistribution"];
