import type { MetadataRoute } from "next";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function baseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_VERCEL_URL)
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
}

// Dynamic sitemap: static public routes plus every active ad and blog post.
// Best-effort DB read — if the database is unreachable we still return the
// static routes so the build/route never fails.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = baseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/ads",
    "/blog",
    "/search",
    "/locations",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  let adRoutes: MetadataRoute.Sitemap = [];
  try {
    await connectDB();
    const ads = await Ad.find({ status: "active" })
      .select("_id updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    adRoutes = ads.map((ad: { _id: unknown; updatedAt?: Date }) => ({
      url: `${site}/ads/${String(ad._id)}`,
      lastModified: ad.updatedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    adRoutes = [];
  }

  return [...staticRoutes, ...adRoutes];
}
