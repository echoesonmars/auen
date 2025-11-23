# Валидации по коллекциям

## USERS (Пользователи)

### MongoDB Schema (models/User.ts)
```json
{
  "name": {
    "required": true,
    "minlength": 2,
    "maxlength": 50,
    "pattern": "^[а-яА-ЯёЁa-zA-Z\\s]+$",
    "trim": true
  },
  "email": {
    "required": true,
    "unique": true,
    "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    "lowercase": true,
    "trim": true,
    "index": true
  },
  "phone": {
    "required": true,
    "pattern": "^\\+?[1-9]\\d{1,14}$"
  },
  "password": {
    "required": true,
    "minlength": 8,
    "select": false,
    "hash": true
  }
}
```

### Zod Schemas (lib/validations/user.ts)

**registerSchema:**
- name: string, 2-50 символов, только буквы
- email: валидный email
- phone: формат телефона, минимум 10 цифр
- password: минимум 8 символов, заглавная, строчная, цифра
- confirmPassword: должен совпадать с password
- agreeToTerms: boolean, обязательно true

**loginSchema:**
- email: валидный email
- password: обязателен
- rememberMe: опционально

**updateProfileSchema:**
- name: опционально, 2-50 символов
- email: опционально, валидный email
- phone: опционально, формат телефона

---

## ADS (Объявления)

### MongoDB Schema (models/Ad.ts)
```json
{
  "title": {
    "required": true,
    "minlength": 10,
    "maxlength": 100,
    "trim": true
  },
  "category": {
    "required": true,
    "enum": ["Инструменты", "Студии", "DJ оборудование", "Клавишные", "Микрофоны", "Аудио"]
  },
  "description": {
    "required": true,
    "minlength": 50,
    "maxlength": 2000,
    "trim": true
  },
  "price": {
    "required": true,
    "pattern": "^\\d+(\\s*₸)?\\s*\\/\\s*(час|день|неделя|месяц)$"
  },
  "location": {
    "required": true,
    "minlength": 2,
    "maxlength": 50,
    "trim": true
  },
  "images": {
    "type": "array",
    "maxlength": 10,
    "default": []
  },
  "userId": {
    "required": true,
    "ref": "User",
    "index": true
  },
  "views": {
    "default": 0,
    "min": 0
  },
  "status": {
    "enum": ["active", "inactive", "sold"],
    "default": "active",
    "index": true
  }
}
```

### Zod Schema (lib/validations/ad.ts)

**createAdSchema:**
- title: string, 10-100 символов
- category: enum из списка категорий
- description: string, 50-2000 символов
- price: формат "5000 ₸/час" или "5000 ₸/день"
- location: string, 2-50 символов
- images: массив, максимум 10, опционально

---

## MESSAGES (Сообщения)

### MongoDB Schema (models/Message.ts)
```json
{
  "chatId": { "required": true, "ref": "Chat", "index": true },
  "senderId": { "required": true, "ref": "User", "index": true },
  "receiverId": { "required": true, "ref": "User", "index": true },
  "text": {
    "required": true,
    "minlength": 1,
    "maxlength": 2000,
    "trim": true
  },
  "read": { "default": false }
}
```

### Zod Schema (lib/validations/message.ts)
- receiverId: string, обязателен
- text: string, 1-2000 символов

---

## CHATS (Чаты)

### MongoDB Schema (models/Chat.ts)
```json
{
  "participants": {
    "required": true,
    "ref": "User",
    "length": 2
  },
  "lastMessage": { "ref": "Message", "optional": true },
  "lastMessageAt": { "optional": true }
}
```

---

## REVIEWS (Отзывы)

### MongoDB Schema (models/Review.ts)
```json
{
  "userId": { "required": true, "ref": "User", "index": true },
  "adId": { "required": true, "ref": "Ad", "index": true },
  "rating": {
    "required": true,
    "min": 1,
    "max": 5
  },
  "comment": {
    "required": true,
    "minlength": 10,
    "maxlength": 500,
    "trim": true
  }
}
```

### Zod Schema (lib/validations/review.ts)
- adId: string, обязателен
- rating: number, 1-5
- comment: string, 10-500 символов

