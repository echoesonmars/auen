import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Получает правильный URL изображения с учетом окружения
 * В production добавляет базовый URL, если путь относительный
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    return "";
  }

  // Если путь уже абсолютный (начинается с http:// или https://), возвращаем как есть
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Если путь относительный (начинается с /), возвращаем как есть
  // Next.js автоматически обработает относительные пути из public/
  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  // Если путь не начинается с /, добавляем его
  return `/${imagePath}`;
}
