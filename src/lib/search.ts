import type { SearchTarget } from "@/lib/surnames";

/** カタカナ→ひらがな。「スズキ」と入力しても読みに当たるようにする */
export function normalizeQuery(input: string): string {
  return input
    .trim()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** 漢字・読みの部分一致で絞り込む。入力順ではなく元の並び順を保つ */
export function searchSurnames(entries: SearchTarget[], query: string): SearchTarget[] {
  const q = normalizeQuery(query);
  if (q === "") return [];
  return entries.filter(
    (entry) =>
      entry.kanji.includes(q) ||
      entry.readings.some((reading) => normalizeQuery(reading).includes(q)),
  );
}
