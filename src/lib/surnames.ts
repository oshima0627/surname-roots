import fs from "node:fs";
import path from "node:path";
import { surnameEntrySchema, type SurnameEntry } from "@/lib/schema";

const DATA_DIR = path.join(process.cwd(), "src/data/surnames");

/** 検索インデックス。本文を含めずクライアントへ渡す */
export type SearchTarget = {
  slug: string;
  kanji: string;
  readings: string[];
  rankNational: number | null;
};

/** 順位の昇順。順位不明（null）は末尾に置く */
export function getAllSurnames(): SurnameEntry[] {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const entries = files.map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    const entry = surnameEntrySchema.parse(raw);
    if (`${entry.slug}.json` !== file) {
      throw new Error(`ファイル名と slug が一致しない: ${file} / ${entry.slug}`);
    }
    return entry;
  });
  return entries.sort(
    (a, b) =>
      (a.rankNational ?? Number.MAX_SAFE_INTEGER) - (b.rankNational ?? Number.MAX_SAFE_INTEGER),
  );
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
