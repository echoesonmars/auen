# Руководство по валидации

## Структура валидации

### 1. Zod схемы (`lib/validations/`)
- `user.ts` - валидация пользователей (регистрация, вход, обновление профиля)
- `ad.ts` - валидация объявлений (создание, обновление)
- `index.ts` - утилиты для работы с валидацией

### 2. MongoDB модели (`models/`)
- `User.ts` - модель пользователя с валидацией на уровне схемы
- `Ad.ts` - модель объявления с валидацией на уровне схемы

## Использование валидации

### В API Routes

```typescript
import { validate, formatValidationErrors } from "@/lib/validations";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Валидация
  const validation = validate(registerSchema, body);
  
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        errors: formatValidationErrors(validation.errors),
      },
      { status: 400 }
    );
  }
  
  // Используем валидированные данные
  const { name, email, password } = validation.data;
  // ...
}
```

### На клиенте (в формах)

```typescript
import { registerSchema } from "@/lib/validations";
import { z } from "zod";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Валидация на клиенте
    const validatedData = registerSchema.parse(formData);
    
    // Отправка на сервер
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validatedData),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      // Обработка ошибок валидации с сервера
      setErrors(result.errors);
      return;
    }
    
    // Успех
    router.push("/");
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Обработка ошибок валидации на клиенте
      const formattedErrors = {};
      error.errors.forEach((err) => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
    }
  }
};
```

## Правила валидации

### Пользователь (User)

**Регистрация:**
- Имя: 2-50 символов, только буквы
- Email: валидный email, уникальный
- Телефон: формат +7 (777) 123-45-67
- Пароль: минимум 8 символов, заглавная, строчная буква, цифра
- Подтверждение пароля: должно совпадать с паролем

**Вход:**
- Email: валидный email
- Пароль: обязателен

### Объявление (Ad)

**Создание:**
- Название: 10-100 символов
- Категория: из списка разрешенных
- Описание: 50-2000 символов
- Цена: формат "5000 ₸/час" или "5000 ₸/день"
- Локация: 2-50 символов
- Фотографии: максимум 10

## Обработка ошибок

### Формат ошибок

```json
{
  "success": false,
  "errors": {
    "email": "Некорректный email адрес",
    "password": "Пароль должен содержать минимум 8 символов"
  }
}
```

### MongoDB ошибки

- `11000` - дублирование уникального поля (email)
- Валидация схемы - автоматически обрабатывается Mongoose

## Безопасность

1. **Пароли:**
   - Хешируются с помощью bcrypt перед сохранением
   - Не возвращаются в API ответах (`select: false`)

2. **Email:**
   - Приводится к нижнему регистру
   - Уникальный индекс в базе данных

3. **Валидация:**
   - На клиенте (UX) и на сервере (безопасность)
   - Используется Zod для типобезопасности

