import type { MetadataRoute } from "next";

function baseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_VERCEL_URL)
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
}

// robots.txt — allow public pages, keep private/admin/API areas out of indexes.
export default function robots(): MetadataRoute.Robots {
  const site = baseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/chat", "/profile", "/bookings"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
