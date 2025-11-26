import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Получает правильный URL изображения с учетом окружения
 * В production на Vercel файлы из public/ доступны напрямую через относительные пути
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    console.warn("getImageUrl: imagePath is null or undefined");
    return "";
  }

  // Если путь уже абсолютный (начинается с http:// или https://), возвращаем как есть
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    console.log("getImageUrl: Absolute URL detected:", imagePath);
    return imagePath;
  }

  // Нормализуем путь: убираем лишние пробелы
  let normalizedPath = imagePath.trim();
  
  // Если путь не начинается с /, добавляем его
  // Это важно для Next.js, который обрабатывает пути относительно public/
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  // Убираем двойные слеши (кроме начала пути после протокола)
  normalizedPath = normalizedPath.replace(/([^:]\/)\/+/g, "$1");

  // В production на Vercel файлы из public/ доступны напрямую
  // Пути типа /uploads/ads/filename.jpg должны работать
  // Next.js автоматически обслуживает файлы из public/ через статический сервер
  
  // Если указан базовый URL для изображений (например, CDN), используем его
  // Это полезно, если изображения хранятся на внешнем сервере
  if (typeof window !== 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
    if (baseUrl && normalizedPath.startsWith("/uploads")) {
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      const finalUrl = `${cleanBaseUrl}${normalizedPath}`;
      console.log("getImageUrl: Using CDN base URL:", finalUrl);
      return finalUrl;
    }
  }

  // Возвращаем нормализованный путь
  // Next.js автоматически обработает относительные пути из public/
  // Например: /uploads/ads/filename.jpg будет доступен как https://domain.com/uploads/ads/filename.jpg
  console.log("getImageUrl: Returning normalized path:", normalizedPath);
  return normalizedPath;
}
