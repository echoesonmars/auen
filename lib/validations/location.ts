import { z } from "zod";

export const createLocationSchema = z.object({
  name: z
    .string()
    .min(2, "Название должно содержать минимум 2 символа")
    .max(100, "Название не должно превышать 100 символов")
    .trim(),
  type: z.enum(["city", "category"], {
    message: "Некорректный тип локации",
  }),
  icon: z.string().max(2, "Иконка должна быть одним эмодзи").optional().nullable(),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

