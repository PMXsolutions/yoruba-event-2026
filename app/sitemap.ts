import type { MetadataRoute } from "next";
import { ACTIVE_EVENT } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = ACTIVE_EVENT.canonicalUrl;
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/sponsor/confirmation`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
