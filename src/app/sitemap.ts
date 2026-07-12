import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://zap534.site";
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/order/query`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
