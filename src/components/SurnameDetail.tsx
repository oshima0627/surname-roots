import { JapanMap } from "@/components/JapanMap";
import type { SurnameEntry } from "@/lib/schema";

/**
 * 文字列中の数字だけを font-tabular（等幅の非明朝）で包む。
 * ラベルの漢字（全国・位・約・万人など）は明朝のまま残す。
 */
function withTabularDigits(text: string): React.ReactNode[] {
  return text.split(/(\d+)/).map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="font-tabular tabular-nums">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-4 text-lg font-bold after:h-px after:flex-1 after:bg-keisen after:content-['']">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * 見出しの漢字サイズを文字数で調整する。
 * 375px幅でも横スクロールが出ないことを実測して決めた対応表（Task 4 実測済み）。
 */
function kanjiSizeClass(length: number): string {
  if (length <= 1) return "text-9xl";
  if (length === 2) return "text-8xl";
  return "text-7xl";
}

export function SurnameDetail({ entry }: { entry: SurnameEntry }) {
  const hasReadingVariations = entry.readings.length > 1;

  return (
    <article>
      <header className="border-b border-keisen pb-8">
        <h1 className={`${kanjiSizeClass(entry.kanji.length)} font-bold leading-[1.1]`}>
          {entry.kanji}
        </h1>
        <p className="mt-6 text-sm tracking-[0.2em] text-sumi-muted">
          {entry.readings.join(" / ")}
        </p>
        {(entry.rankNational !== null || entry.populationEstimate !== "") && (
          <p className="mt-3 text-xs text-sumi-muted">
            {entry.rankNational !== null && (
              <span className="mr-3">
                全国{withTabularDigits(String(entry.rankNational))}位
              </span>
            )}
            {entry.populationEstimate !== "" && (
              <span>{withTabularDigits(entry.populationEstimate)}</span>
            )}
          </p>
        )}
        {entry.rankNational !== null && (
          <p className="mt-1 text-xs text-sumi-muted">
            出典: 名字由来net。順位は参照元によって異なることがあります。
          </p>
        )}
      </header>

      <Section title="由来">
        <p className="text-lg leading-loose whitespace-pre-wrap">{entry.origin}</p>
        <p className="mt-4 text-sm text-sumi-muted">発祥: {entry.originRegion}</p>
      </Section>

      <Section title="分布">
        <div className="lg:-mx-20">
          <JapanMap distribution={entry.regionDistribution} />
        </div>
      </Section>

      {entry.kamon.length > 0 && (
        <Section title="家紋">
          <ul className="space-y-3">
            {entry.kamon.map((k) => (
              <li key={k.name}>
                <p className="font-bold">{k.name}</p>
                <p className="text-sumi-muted">{k.description}</p>
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
                <span className="ml-2 text-sumi-muted">{p.note}</span>
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
