import { JapanMap } from "@/components/JapanMap";
import type { SurnameEntry } from "@/lib/schema";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold border-l-4 border-amber-700 pl-3">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SurnameDetail({ entry }: { entry: SurnameEntry }) {
  const hasReadingVariations = entry.readings.length > 1;

  return (
    <article>
      <header>
        <h1 className="text-4xl font-bold">{entry.kanji}</h1>
        <p className="mt-2 text-stone-600">{entry.readings.join(" / ")}</p>
        {(entry.rankNational !== null || entry.populationEstimate !== "") && (
          <p className="mt-3 text-sm text-stone-600">
            {entry.rankNational !== null && (
              <span className="mr-3">全国{entry.rankNational}位</span>
            )}
            {entry.populationEstimate !== "" && <span>{entry.populationEstimate}</span>}
          </p>
        )}
      </header>

      <Section title="由来">
        <p className="leading-8 whitespace-pre-wrap">{entry.origin}</p>
        <p className="mt-4 text-sm text-stone-600">発祥: {entry.originRegion}</p>
      </Section>

      <Section title="分布">
        <JapanMap distribution={entry.regionDistribution} />
      </Section>

      {entry.kamon.length > 0 && (
        <Section title="家紋">
          <ul className="space-y-3">
            {entry.kamon.map((k) => (
              <li key={k.name}>
                <p className="font-bold">{k.name}</p>
                <p className="text-stone-600">{k.description}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {entry.famousPeople.length > 0 && (
        <Section title="同じ苗字の有名人">
          <ul className="space-y-2">
            {entry.famousPeople.map((p) => (
              <li key={p.name}>
                <span className="font-bold">{p.name}</span>
                <span className="ml-2 text-stone-600">{p.note}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hasReadingVariations && (
        <Section title="読み方のバリエーション">
          <ul className="list-disc pl-5 space-y-1">
            {entry.readings.map((reading) => (
              <li key={reading}>{reading}</li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
