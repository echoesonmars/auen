import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: {
    default: "Auen - Платформа для аренды музыкального оборудования",
    template: "%s | Auen",
  },
  description: "Арендуйте и сдавайте в аренду музыкальное оборудование, студии звукозаписи, инструменты и DJ-оборудование в Казахстане. Надежная платформа для музыкантов.",
  keywords: [
    "аренда музыкального оборудования",
    "студии звукозаписи",
    "музыкальные инструменты",
    "DJ оборудование",
    "Казахстан",
    "музыка",
    "гитары",
    "барабаны",
    "синтезаторы",
    "микрофоны",
  ],
};

export function generatePageMetadata(
  title: string,
  description: string,
  path: string = "/"
): Metadata {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}${path}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
  };
}

