import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// output: "export"（静的エクスポート）でも out/robots.txt として書き出す
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
