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
  origin: z.string().min(100),
  originRegion: z.string().min(1),
  /**
   * 該当する県だけを列挙する。47県すべてを埋めない。
   * 根拠のない判定を作らないための意図的な設計（設計書 §3.3）
   */
  regionDistribution: z.object({
    多い: z.array(prefectureName),
    やや多い: z.array(prefectureName),
  }),
  kamon: z.array(z.object({ name: z.string().min(1), description: z.string().min(1) })),
  famousPeople: z.array(z.object({ name: z.string().min(1), note: z.string().min(1) })),
  /**
   * 裏取りに使ったURL。画面には出さない。
   * zod のバージョン間で `z.string().url()` の扱いが変わるため、正規表現で判定する
   */
  sources: z.array(z.string().regex(/^https?:\/\//)).min(1),
});

export type SurnameEntry = z.infer<typeof surnameEntrySchema>;
export type Distribution = SurnameEntry["regionDistribution"];
