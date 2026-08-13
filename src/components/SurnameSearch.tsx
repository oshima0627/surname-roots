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
        className="w-full border border-keisen bg-surface px-4 py-4 text-lg outline-none focus:border-ai"
      />

      {hasQuery && results.length === 0 && (
        <p className="mt-4 text-sumi-muted">
          この苗字はまだ収録されていません。収録数を少しずつ増やしています。
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-keisen border border-keisen bg-surface">
          {results.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/myoji/${entry.slug}`}
                className="flex items-baseline gap-3 px-4 py-3 hover:bg-washi"
              >
                <span className="text-lg font-bold">{entry.kanji}</span>
                <span className="text-sm text-sumi-muted">{entry.readings.join(" / ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
