import type { MetadataRoute } from "next";
import { ACTIVE_EVENT } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/login", "/api/"],
      },
    ],
    sitemap: `${ACTIVE_EVENT.canonicalUrl}/sitemap.xml`,
  };
}
