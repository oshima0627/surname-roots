"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchSurnames } from "@/lib/search";
import type { SearchTarget } from "@/lib/surnames";

export function SurnameSearch({ entries }: { entries: SearchTarget[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSurnames(entries, query), [entries, query]);
  const hasQuery = query.trim() !== "";

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="苗字を入力（例: 佐藤 / さとう）"
        aria-label="苗字を検索"
        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-lg outline-none focus:border-amber-700"
      />

      {hasQuery && results.length === 0 && (
        <p className="mt-4 text-stone-600">
          この苗字はまだ収録されていません。収録数を少しずつ増やしています。
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {results.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/myoji/${entry.slug}`}
                className="flex items-baseline gap-3 px-4 py-3 hover:bg-stone-50"
              >
                <span className="text-lg font-bold">{entry.kanji}</span>
                <span className="text-sm text-stone-600">{entry.readings.join(" / ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
