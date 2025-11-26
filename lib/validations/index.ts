import { z } from "zod";
import { registerSchema, loginSchema, updateProfileSchema } from "./user";
import { createAdSchema, updateAdSchema } from "./ad";
import { createMessageSchema } from "./message";
import { createReviewSchema, updateReviewSchema } from "./review";
import { createBlogSchema, updateBlogSchema } from "./blog";
import { createLocationSchema, updateLocationSchema } from "./location";
import { createBookingSchema, updateBookingSchema } from "./booking";

// Экспорт всех схем
export {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createAdSchema,
  updateAdSchema,
  createMessageSchema,
  createReviewSchema,
  updateReviewSchema,
  createBlogSchema,
  updateBlogSchema,
  createLocationSchema,
  updateLocationSchema,
  createBookingSchema,
  updateBookingSchema,
};

// Утилита для валидации с обработкой ошибок
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Форматирование ошибок валидации для отображения пользователю
export function formatValidationErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join(".");
    formatted[path] = err.message;
  });

  return formatted;
}

// Валидация с выбрасыванием ошибки (для использования в API routes)
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

