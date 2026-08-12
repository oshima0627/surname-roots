import fs from "node:fs";
import path from "node:path";
import { surnameEntrySchema, type SurnameEntry } from "@/lib/schema";

const DATA_DIR = path.join(process.cwd(), "src/data/surnames");

/** Module-level cache: parsed and sorted surnames (null until first load) */
let cachedEntries: SurnameEntry[] | null = null;

/** 検索インデックス。本文を含めずクライアントへ渡す */
export type SearchTarget = {
  slug: string;
  kanji: string;
  readings: string[];
  rankNational: number | null;
};

/** 順位の昇順。順位不明（null）は末尾に置く */
export function getAllSurnames(): SurnameEntry[] {
  // Return memoized result if available (as a copy to prevent mutation)
  if (cachedEntries !== null) {
    return JSON.parse(JSON.stringify(cachedEntries)) as SurnameEntry[];
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const entries = files.map((file) => {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    } catch (error) {
      throw new Error(
        `ファイル解析エラー: ${file}\n${error instanceof Error ? error.message : String(error)}`,
      );
    }

    let entry;
    try {
      entry = surnameEntrySchema.parse(raw);
    } catch (error) {
      throw new Error(
        `スキーマ検証エラー: ${file}\n${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (`${entry.slug}.json` !== file) {
      throw new Error(`ファイル名と slug が一致しない: ${file} / ${entry.slug}`);
    }
    return entry;
  });

  const sorted = entries.sort(
    (a, b) =>
      (a.rankNational ?? Number.MAX_SAFE_INTEGER) - (b.rankNational ?? Number.MAX_SAFE_INTEGER),
  );

  // Cache the sorted result
  cachedEntries = sorted;

  // Return a copy to prevent external mutation of the cache
  return JSON.parse(JSON.stringify(cachedEntries)) as SurnameEntry[];
}

export function getSurnameBySlug(slug: string): SurnameEntry | undefined {
  return getAllSurnames().find((entry) => entry.slug === slug);
}

export function getSearchIndex(): SearchTarget[] {
  return getAllSurnames().map(({ slug, kanji, readings, rankNational }) => ({
    slug,
    kanji,
    readings,
    rankNational,
  }));
}
