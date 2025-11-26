# Валидация местоположения для MongoDB

## Обновления схемы Ad

### Новые поля в модели Ad

```javascript
{
  latitude: {
    type: Number,
    required: false,
    min: [-90, "Широта должна быть от -90 до 90"],
    max: [90, "Широта должна быть от -90 до 90"],
  },
  longitude: {
    type: Number,
    required: false,
    min: [-180, "Долгота должна быть от -180 до 180"],
    max: [180, "Долгота должна быть от -180 до 180"],
  },
  address: {
    type: String,
    required: false,
    trim: true,
    maxlength: [200, "Адрес не должен превышать 200 символов"],
  },
}
```

### Индексы

Добавлен индекс для геопространственных запросов:
```javascript
AdSchema.index({ latitude: 1, longitude: 1 });
```

## Валидация Zod

### Обновления в `lib/validations/ad.ts`

```typescript
latitude: z
  .number()
  .min(-90, "Широта должна быть от -90 до 90")
  .max(90, "Широта должна быть от -90 до 90")
  .optional()
  .nullable(),
longitude: z
  .number()
  .min(-180, "Долгота должна быть от -180 до 180")
  .max(180, "Долгота должна быть от -180 до 180")
  .optional()
  .nullable(),
address: z
  .string()
  .max(200, "Адрес не должен превышать 200 символов")
  .trim()
  .optional()
  .nullable(),
```

## Обновления модели Booking

### Новое поле deliveryMethod

```javascript
deliveryMethod: {
  type: String,
  enum: {
    values: ["pickup", "courier"],
    message: "Некорректный способ доставки",
  },
  default: "pickup",
},
```

## JSON файлы валидации для MongoDB

### Файлы валидации

1. **`mongodb-ads-validation-location.json`** - Валидация для коллекции `ads` с полями местоположения
2. **`mongodb-bookings-validation-delivery.json`** - Валидация для коллекции `bookings` с полем `deliveryMethod`
3. **`mongodb-ads-indexes-location.json`** - Индексы для геопространственных запросов

### Применение валидации в MongoDB Compass

#### Для коллекции ads:

1. Откройте MongoDB Compass
2. Выберите базу данных и коллекцию `ads`
3. Перейдите в раздел "Validation"
4. Скопируйте содержимое файла `mongodb-ads-validation-location.json`
5. Вставьте в поле валидации и примените изменения

Или используйте команду в MongoDB Shell:

```javascript
db.runCommand(/* содержимое mongodb-ads-validation-location.json */)
```

#### Для коллекции bookings:

1. Откройте MongoDB Compass
2. Выберите базу данных и коллекцию `bookings`
3. Перейдите в раздел "Validation"
4. Скопируйте содержимое файла `mongodb-bookings-validation-delivery.json`
5. Вставьте в поле валидации и примените изменения

Или используйте команду в MongoDB Shell:

```javascript
db.runCommand(/* содержимое mongodb-bookings-validation-delivery.json */)
```

#### Создание индексов:

1. Откройте MongoDB Compass
2. Выберите базу данных и коллекцию `ads`
3. Перейдите в раздел "Indexes"
4. Создайте индексы согласно файлу `mongodb-ads-indexes-location.json`

Или используйте команды в MongoDB Shell:

```javascript
db.ads.createIndex({ latitude: 1, longitude: 1 });
db.ads.createIndex({ location: 1, latitude: 1, longitude: 1 });
```

## Использование

### В API

При создании объявления координаты передаются вместе с другими данными:

```typescript
{
  title: string;
  category: string;
  description: string;
  price: string;
  location: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  images: string[];
  userId: string;
}
```

### В компонентах

- **LocationPicker**: Компонент для выбора местоположения на карте с поиском
- **RouteMap**: Компонент для отображения маршрута от пользователя до арендодателя

### Опции доставки

- **pickup** (самовывоз): Показывает маршрут от местоположения пользователя до арендодателя
- **courier** (курьер от Auen): Показывает только местоположение арендодателя

## Примечания

1. Координаты не обязательны, но рекомендуются для лучшего пользовательского опыта
2. Если координаты не указаны, карта маршрута не отображается
3. Для построения маршрута используется OSRM (Open Source Routing Machine)
4. Для геокодирования используется Nominatim (OpenStreetMap)

