import { z } from "zod";

// Валидация ObjectId
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Некорректный формат ID");

export const createReviewSchema = z.object({
  adId: objectIdSchema.min(1, "Объявление обязательно"),
  rating: z
    .number()
    .int("Рейтинг должен быть целым числом")
    .min(1, "Рейтинг не может быть меньше 1")
    .max(5, "Рейтинг не может быть больше 5"),
  comment: z
    .string()
    .trim()
    .min(10, "Отзыв должен содержать минимум 10 символов")
    .max(500, "Отзыв не должен превышать 500 символов")
    .refine(
      (val) => val.trim().length >= 10,
      "Отзыв должен содержать минимум 10 символов (без пробелов в начале и конце)"
    ),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int("Рейтинг должен быть целым числом")
    .min(1, "Рейтинг не может быть меньше 1")
    .max(5, "Рейтинг не может быть больше 5")
    .optional(),
  comment: z
    .string()
    .trim()
    .min(10, "Отзыв должен содержать минимум 10 символов")
    .max(500, "Отзыв не должен превышать 500 символов")
    .refine(
      (val) => val.trim().length >= 10,
      "Отзыв должен содержать минимум 10 символов (без пробелов в начале и конце)"
    )
    .optional(),
}).refine(
  (data) => data.rating !== undefined || data.comment !== undefined,
  "Необходимо указать хотя бы одно поле для обновления"
);

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

