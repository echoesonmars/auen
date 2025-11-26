import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Получает правильный URL изображения с учетом окружения
 * В production на Vercel файлы из public/ недоступны (read-only файловая система)
 * Старые изображения с путями /uploads/... не будут работать на Vercel
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    console.warn("getImageUrl: imagePath is null or undefined");
    return "";
  }

  // Если путь уже абсолютный (начинается с http:// или https://), возвращаем как есть
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Нормализуем путь: убираем лишние пробелы
  let normalizedPath = imagePath.trim();
  
  // Если путь не начинается с /, добавляем его
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  // Убираем двойные слеши
  normalizedPath = normalizedPath.replace(/([^:]\/)\/+/g, "$1");

  // Проверяем, находимся ли мы на Vercel (production)
  const isVercel = typeof window !== 'undefined' 
    ? window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.com')
    : process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_URL;

  // Если это путь к /uploads/... и мы на Vercel, файл не существует
  // Возвращаем placeholder или пытаемся использовать CDN
  if (normalizedPath.startsWith("/uploads") && isVercel) {
    // Если указан базовый URL для изображений (CDN), используем его
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
    if (baseUrl) {
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      return `${cleanBaseUrl}${normalizedPath}`;
    }
    
    // Если нет CDN, возвращаем путь как есть (браузер покажет ошибку, компонент обработает через onError)
    // В development это будет работать, в production - нет
    console.warn("getImageUrl: Image path /uploads/... on Vercel may not work:", normalizedPath);
    return normalizedPath;
  }

  // Возвращаем нормализованный путь
  // В development это будет работать (файлы в public/uploads)
  // В production на Vercel только если файлы были задеплоены в public/
  return normalizedPath;
}
