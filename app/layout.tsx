import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Providers } from "./components/Providers";

const geist = localFont({
  src: "./fonts/Geist.ttf",
  variable: "--font-geist",
  weight: "400",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const kyiv = localFont({
  src: "./fonts/Kyiv.ttf",
  variable: "--font-kyiv",
  weight: "400",
});

export const metadata: Metadata = {
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
  authors: [{ name: "Auen" }],
  creator: "Auen",
  publisher: "Auen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    title: "Auen - Платформа для аренды музыкального оборудования",
    description: "Арендуйте и сдавайте в аренду музыкальное оборудование, студии звукозаписи, инструменты и DJ-оборудование в Казахстане.",
    siteName: "Auen",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auen - Платформа для аренды музыкального оборудования",
    description: "Арендуйте и сдавайте в аренду музыкальное оборудование, студии звукозаписи, инструменты и DJ-оборудование в Казахстане.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body
        className={`${geist.variable} ${geistMono.variable} ${kyiv.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
