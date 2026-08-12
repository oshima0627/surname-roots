import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SurnameDetail } from "@/components/SurnameDetail";
import { getAllSurnames, getSurnameBySlug } from "@/lib/surnames";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllSurnames().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getSurnameBySlug(slug);
  if (!entry) return {};
  const codePoints = [...entry.origin];
  const description =
    codePoints.length > 100 ? `${codePoints.slice(0, 100).join("")}…` : entry.origin;
  return {
    title: `${entry.kanji}（${entry.readings.join("・")}）の由来とルーツ`,
    description,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const entry = getSurnameBySlug(slug);
  if (!entry) notFound();
  return <SurnameDetail entry={entry} />;
}
