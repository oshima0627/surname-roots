import type { MetadataRoute } from "next";
import { getAllSurnames } from "@/lib/surnames";
import { SITE_URL } from "@/lib/site";

// output: "export"（静的エクスポート）でも out/sitemap.xml として書き出す
export const dynamic = "force-static";

/**
 * 実在するルートだけを載せる。
 * - `/`            … src/app/page.tsx
 * - `/ranking`     … src/app/ranking/page.tsx
 * - `/credits`     … src/app/credits/page.tsx
 * - `/myoji/<slug>`… src/app/myoji/[slug]/page.tsx（generateStaticParams と同じ getAllSurnames() を使う）
 *
 * lastModified は付けない。苗字データに更新日を持たせていないため、
 * ビルド日時を入れると「更新されていないページを更新済み」と偽ることになる。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/ranking`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/credits`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const surnamePages: MetadataRoute.Sitemap = getAllSurnames().map((entry) => ({
    url: `${SITE_URL}/myoji/${entry.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticPages, ...surnamePages];
}
