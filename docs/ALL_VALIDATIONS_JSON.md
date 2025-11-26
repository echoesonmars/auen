# Все валидации MongoDB в формате JSON

Все валидации представлены в виде JSON файлов, готовых для использования в MongoDB Compass.

## Список файлов валидации

1. **`mongodb-locations-validation.json`** - Валидация для коллекции `locations`
2. **`mongodb-ads-validation.json`** - Валидация для коллекции `ads` (с полями местоположения)
3. **`mongodb-bookings-validation.json`** - Валидация для коллекции `bookings` (с deliveryMethod)
4. **`mongodb-users-validation.json`** - Валидация для коллекции `users`
5. **`mongodb-reviews-validation.json`** - Валидация для коллекции `reviews`
6. **`mongodb-chats-validation.json`** - Валидация для коллекции `chats`
7. **`mongodb-messages-validation.json`** - Валидация для коллекции `messages`
8. **`mongodb-blogs-validation.json`** - Валидация для коллекции `blogs`

## Как применить валидацию в MongoDB Compass

### Способ 1: Через интерфейс MongoDB Compass

1. Откройте MongoDB Compass
2. Подключитесь к вашей базе данных
3. Выберите нужную коллекцию
4. Перейдите на вкладку **"Validation"**
5. Нажмите **"Edit JSON"**
6. Скопируйте содержимое соответствующего JSON файла
7. Вставьте в поле валидации
8. Нажмите **"Save"**

### Способ 2: Через MongoDB Shell

```bash
# Для коллекции locations
db.runCommand({
  collMod: "locations",
  validator: { /* содержимое из mongodb-locations-validation.json */ },
  validationLevel: "moderate",
  validationAction: "error"
})

# Для коллекции ads
db.runCommand({
  collMod: "ads",
  validator: { /* содержимое из mongodb-ads-validation.json */ },
  validationLevel: "moderate",
  validationAction: "error"
})

# И так далее для остальных коллекций...
```

## Описание валидаций

### locations
- **name**: Название локации (2-100 символов)
- **type**: Тип локации (city или category)
- **icon**: Эмодзи/иконка (опционально, до 10 символов)
- **adsCount**: Количество объявлений (≥ 0)

### ads
- **title**: Название объявления (10-100 символов)
- **category**: Категория (из списка)
- **description**: Описание (50-2000 символов)
- **price**: Цена (формат: "5000 ₸/час")
- **location**: Локация (1-50 символов)
- **latitude**: Широта (-90 до 90)
- **longitude**: Долгота (-180 до 180)
- **address**: Адрес (до 200 символов)
- **images**: Массив изображений (до 10)
- **status**: Статус объявления
- **featured**: Рекламное объявление

### bookings
- **adId**: ID объявления
- **renterId**: ID арендатора
- **ownerId**: ID владельца
- **startDate/endDate**: Даты бронирования
- **periodType**: Тип периода (hour/day/week/month)
- **totalPrice**: Общая стоимость (≥ 0)
- **status**: Статус бронирования
- **deliveryMethod**: Способ доставки (pickup/courier)

### users
- **name**: Имя (2-50 символов, только буквы)
- **email**: Email (валидный формат)
- **phone**: Телефон (опционально, формат: +1234567890)
- **password**: Пароль (минимум 8 символов)
- **role**: Роль (user/admin/moderator)
- **bio**: Биография (до 500 символов)
- **website/instagram/telegram/vk/youtube**: Социальные сети

### reviews
- **userId**: ID пользователя
- **adId**: ID объявления
- **rating**: Рейтинг (1-5)
- **comment**: Комментарий (10-500 символов)

### chats
- **participants**: Массив из 2 участников
- **lastMessage**: ID последнего сообщения
- **lastMessageAt**: Дата последнего сообщения

### messages
- **chatId**: ID чата
- **senderId**: ID отправителя
- **receiverId**: ID получателя
- **text**: Текст сообщения (1-2000 символов)
- **read**: Прочитано ли сообщение

### blogs
- **title**: Заголовок (10-200 символов)
- **excerpt**: Краткое описание (50-500 символов)
- **content**: Содержание (200-50000 символов)
- **authorId**: ID автора
- **category**: Категория (tips/reviews/news/guides)
- **readTime**: Время чтения (1-120 минут)
- **status**: Статус (draft/published)

## Примечания

- Все валидации используют `validationLevel: "moderate"` - проверяются только при вставке и обновлении
- Все валидации используют `validationAction: "error"` - отклоняют невалидные документы
- Все валидации имеют `additionalProperties: false` - запрещают дополнительные поля
- Опциональные поля помечены как `["тип", "null"]` для разрешения null значений

