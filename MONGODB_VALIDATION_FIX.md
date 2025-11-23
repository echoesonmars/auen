# Правильные валидации MongoDB для коллекции users

## Проблемы в текущих валидациях:

1. `hash: true` - это НЕ валидация MongoDB, это инструкция для приложения. MongoDB не хеширует пароли автоматически.
2. `trim: true` и `lowercase: true` - это опции Mongoose, не валидации MongoDB
3. `select: false` - это опция Mongoose, не валидация MongoDB
4. `index: true` - это опция для создания индекса, не валидация

## Правильный формат валидаций MongoDB:

### Вариант 1: Простые валидации (рекомендуется)

```json
{
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email", "phone", "password"],
    properties: {
      name: {
        bsonType: "string",
        minLength: 2,
        maxLength: 50,
        pattern: "^[а-яА-ЯёЁa-zA-Z\\s]+$",
        description: "Имя должно содержать только буквы, 2-50 символов"
      },
      email: {
        bsonType: "string",
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        description: "Email должен быть валидным"
      },
      phone: {
        bsonType: "string",
        pattern: "^\\+?[1-9]\\d{1,14}$",
        description: "Телефон должен быть в формате +77771234567"
      },
      password: {
        bsonType: "string",
        minLength: 8,
        description: "Пароль должен содержать минимум 8 символов"
      }
    }
  }
}
```

### Вариант 2: Через MongoDB Compass или Shell

В MongoDB Compass или через mongo shell выполните:

```javascript
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "phone", "password"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 50,
          pattern: "^[а-яА-ЯёЁa-zA-Z\\s]+$"
        },
        email: {
          bsonType: "string",
          pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        },
        phone: {
          bsonType: "string",
          pattern: "^\\+?[1-9]\\d{1,14}$"
        },
        password: {
          bsonType: "string",
          minLength: 8
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})
```

## Что нужно удалить из валидаций:

- ❌ `hash: true` - удалить (хеширование делается в Mongoose pre-save hook)
- ❌ `trim: true` - удалить (это опция Mongoose, не валидация)
- ❌ `lowercase: true` - удалить (это опция Mongoose, не валидация)
- ❌ `select: false` - удалить (это опция Mongoose, не валидация)
- ❌ `index: true` - удалить (индексы создаются отдельно)
- ❌ `unique: true` - удалить из валидаций (уникальность создается через индекс)

## Что оставить:

- ✅ `required: true` → `required: ["fieldName"]` в $jsonSchema
- ✅ `minlength: 2` → `minLength: 2` (обратите внимание на заглавную L)
- ✅ `maxlength: 50` → `maxLength: 50` (обратите внимание на заглавную L)
- ✅ `pattern: '...'` → `pattern: "..."` (в $jsonSchema)

## Создание уникального индекса для email:

```javascript
db.users.createIndex({ email: 1 }, { unique: true })
```

## Создание индекса для createdAt:

```javascript
db.users.createIndex({ createdAt: -1 })
```

