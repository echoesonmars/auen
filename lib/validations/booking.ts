import { z } from "zod";

export const createBookingSchema = z.object({
  adId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Неверный формат ID объявления",
  }),
  renterId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Неверный формат ID арендатора",
  }),
  ownerId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Неверный формат ID владельца",
  }),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  startTime: z.string().datetime().or(z.date()).optional().nullable(),
  endTime: z.string().datetime().or(z.date()).optional().nullable(),
  periodType: z.enum(["hour", "day", "week", "month"], {
    message: "Некорректный тип периода",
  }),
  totalPrice: z.number().min(0, "Стоимость не может быть отрицательной"),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("pending").optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  startTime: z.string().datetime().or(z.date()).optional().nullable(),
  endTime: z.string().datetime().or(z.date()).optional().nullable(),
  totalPrice: z.number().min(0).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

