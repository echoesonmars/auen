import { z } from "zod";

export const createReviewSchema = z.object({
  adId: z.string().min(1, "Объявление обязательно"),
  rating: z
    .number()
    .min(1, "Рейтинг не может быть меньше 1")
    .max(5, "Рейтинг не может быть больше 5"),
  comment: z
    .string()
    .min(10, "Отзыв должен содержать минимум 10 символов")
    .max(500, "Отзыв не должен превышать 500 символов")
    .trim(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

