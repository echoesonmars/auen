import { z } from "zod";

// Схема валидации для создания объявления
export const createAdSchema = z.object({
  title: z
    .string()
    .min(10, "Название должно содержать минимум 10 символов")
    .max(100, "Название не должно превышать 100 символов")
    .trim(),
  category: z
    .string()
    .min(1, "Выберите категорию")
    .refine(
      (val) =>
        [
          "Инструменты",
          "Студии",
          "DJ оборудование",
          "Клавишные",
          "Микрофоны",
          "Аудио",
        ].includes(val),
      {
        message: "Некорректная категория",
      }
    ),
  description: z
    .string()
    .min(50, "Описание должно содержать минимум 50 символов")
    .max(2000, "Описание не должно превышать 2000 символов")
    .trim(),
  price: z
    .string()
    .regex(/^\d+(\s*₸)?\s*\/\s*(час|день|неделя|месяц)$/i, {
      message: "Формат: 5000 ₸/час или 5000 ₸/день",
    }),
  location: z
    .string()
    .min(1, "Выберите город")
    .max(50, "Локация не должна превышать 50 символов")
    .trim(),
  latitude: z
    .number()
    .min(-90, "Широта должна быть от -90 до 90")
    .max(90, "Широта должна быть от -90 до 90")
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, "Долгота должна быть от -180 до 180")
    .max(180, "Долгота должна быть от -180 до 180")
    .optional()
    .nullable(),
  address: z
    .string()
    .max(200, "Адрес не должен превышать 200 символов")
    .trim()
    .optional()
    .nullable(),
  images: z
    .array(z.string())
    .max(10, "Максимум 10 фотографий")
    .min(0, "Минимум 0 фотографий")
    .nullable()
    .optional()
    .default([]),
});

// Схема валидации для обновления объявления
export const updateAdSchema = createAdSchema.partial();

// Типы для TypeScript
export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;

