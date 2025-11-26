import { z } from "zod";

export const createBlogSchema = z.object({
  title: z
    .string()
    .min(10, "Заголовок должен содержать минимум 10 символов")
    .max(200, "Заголовок не должен превышать 200 символов")
    .trim(),
  excerpt: z
    .string()
    .min(50, "Краткое описание должно содержать минимум 50 символов")
    .max(500, "Краткое описание не должно превышать 500 символов")
    .trim(),
  content: z
    .string()
    .min(200, "Содержание должно содержать минимум 200 символов")
    .max(50000, "Содержание не должно превышать 50000 символов")
    .trim(),
  authorId: z.string().min(1, "Автор обязателен"),
  category: z.enum(["tips", "reviews", "news", "guides"], {
    message: "Некорректная категория",
  }),
  image: z.string().max(2, "Иконка должна быть одним эмодзи").optional().nullable(),
  readTime: z.number().min(1).max(120).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const updateBlogSchema = createBlogSchema.partial().extend({
  authorId: z.string().min(1, "Автор обязателен"),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;

