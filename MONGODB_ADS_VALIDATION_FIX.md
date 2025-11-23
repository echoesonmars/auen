# Правильные валидации MongoDB для коллекции ads

## Проблемы в текущих валидациях:

1. `trim: true` - это опция Mongoose, не валидация MongoDB (удалить)
2. `ref: 'User'` - это опция Mongoose для populate, не валидация (удалить)
3. `index: true` - это опция для создания индекса, не валидация (удалить, создать отдельно)
4. `default: []`, `default: 0`, `default: 'active'` - это опции Mongoose, не валидации (удалить)
5. `type: 'array'` - должно быть `bsonType: "array"`
6. `minlength` и `maxlength` - должны быть `minLength` и `maxLength` (с заглавной L)
7. `maxlength: 10` для массива - должно быть `maxItems: 10`

## Правильный формат валидаций MongoDB:

Используйте содержимое файла `mongodb-ads-validation.json` или выполните команды из `mongodb-ads-setup-commands.js`

## Что нужно удалить из валидаций:

- ❌ `trim: true` - удалить (это опция Mongoose, не валидация)
- ❌ `ref: 'User'` - удалить (это опция Mongoose, не валидация)
- ❌ `index: true` - удалить (индексы создаются отдельно)
- ❌ `default: []` - удалить (это опция Mongoose, не валидация)
- ❌ `default: 0` - удалить (это опция Mongoose, не валидация)
- ❌ `default: 'active'` - удалить (это опция Mongoose, не валидация)

## Что нужно исправить:

- ✅ `required: true` → `required: ["fieldName"]` в $jsonSchema
- ✅ `minlength: 10` → `minLength: 10` (обратите внимание на заглавную L)
- ✅ `maxlength: 100` → `maxLength: 100` (обратите внимание на заглавную L)
- ✅ `type: 'array'` → `bsonType: "array"`
- ✅ `maxlength: 10` для массива → `maxItems: 10`
- ✅ `min: 0` → `minimum: 0`
- ✅ `enum: [...]` → оставить как есть, но в формате массива строк

## Создание индексов отдельно:

```javascript
db.ads.createIndex({ userId: 1, createdAt: -1 })
db.ads.createIndex({ category: 1, status: 1 })
db.ads.createIndex({ location: 1 })
db.ads.createIndex({ createdAt: -1 })
db.ads.createIndex({ views: -1 })
```

