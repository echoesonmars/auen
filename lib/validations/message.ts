import { z } from "zod";

export const createMessageSchema = z.object({
  receiverId: z.string().min(1, "Получатель обязателен"),
  text: z
    .string()
    .min(1, "Сообщение не может быть пустым")
    .max(2000, "Сообщение не должно превышать 2000 символов")
    .trim(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

