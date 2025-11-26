import { z } from "zod";

// Схема валидации для регистрации пользователя
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(50, "Имя не должно превышать 50 символов")
    .regex(/^[а-яА-ЯёЁa-zA-Z\s]+$/, "Имя может содержать только буквы"),
  email: z
    .string()
    .email("Некорректный email адрес")
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Некорректный номер телефона"),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[a-z]/, "Пароль должен содержать хотя бы одну строчную букву")
    .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "Необходимо согласиться с условиями использования",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

// Схема валидации для входа
export const loginSchema = z.object({
  email: z
    .string()
    .email("Некорректный email адрес")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Пароль обязателен"),
  rememberMe: z.boolean().optional(),
});

// Схема валидации для обновления профиля
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(50, "Имя не должно превышать 50 символов")
    .regex(/^[а-яА-ЯёЁa-zA-Z\s]+$/, "Имя может содержать только буквы")
    .optional(),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Некорректный email адрес")
    .toLowerCase()
    .trim()
    .optional(),
  phone: z
    .union([z.string(), z.null()])
    .refine((val) => val === null || val === '' || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: "Некорректный номер телефона",
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
  bio: z
    .union([z.string(), z.null()])
    .refine((val) => val === null || val === '' || val.length <= 500, {
      message: "Описание не должно превышать 500 символов",
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
  website: z
    .union([z.string(), z.null()])
    .refine((val) => val === null || val === '' || /^https?:\/\/.+/.test(val), {
      message: "Некорректный URL сайта",
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
  instagram: z
    .union([z.string(), z.null()])
    .refine((val) => val === null || val === '' || /^[a-zA-Z0-9._]+$/.test(val), {
      message: "Некорректный username Instagram",
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
  telegram: z
    .union([z.string(), z.null()])
    .refine((val) => val === null || val === '' || /^[a-zA-Z0-9_]+$/.test(val), {
      message: "Некорректный username Telegram",
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
  vk: z
    .union([z.string(), z.null()])
    .refine((val) => val === null || val === '' || /^[a-zA-Z0-9._]+$/.test(val), {
      message: "Некорректный username VK",
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
  youtube: z
    .union([z.string(), z.null()])
    .refine((val) => val === null || val === '' || /^[a-zA-Z0-9._-]+$/.test(val), {
      message: "Некорректный username YouTube",
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
});

// Типы для TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

