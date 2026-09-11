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
  /**
   * 101位以降は解説資料が薄く、100字の本文を2ソースで裏取りできない苗字がある。
   * 下限は60字。ただし緩和したのは文字数だけで、「実際に fetch して本文を読んだ
   * 独立2ソースの一致のみ採用する」原則は据え置き（設計書 2026-08-14）。
   * 60字も書けない苗字は登録せず、その順位を欠番にする
   */
  origin: z.string().trim().min(60),
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
  famousPeople: z.array(z.object({ name: z.string().min(1), note: z.string().min(1) })),
  /**
   * 裏取りに使ったURL。詳細ページに「参考資料」として公開表示される。
   * zod のバージョン間で `z.string().url()` の扱いが変わるため、正規表現で判定する
   */
  sources: z.array(z.string().regex(/^https?:\/\//)).min(1),
});

export type SurnameEntry = z.infer<typeof surnameEntrySchema>;
export type Distribution = SurnameEntry["regionDistribution"];
