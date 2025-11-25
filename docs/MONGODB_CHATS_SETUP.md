# Настройка коллекции chats в MongoDB

## Проблема
Чат создается, но дублируется. Нужно создать правильную валидацию и уникальный индекс.

## Решение

### Вариант 1: Через MongoDB Compass

1. Откройте MongoDB Compass
2. Подключитесь к вашей базе данных
3. Выберите базу данных `auen`
4. Создайте новую коллекцию `chats`
5. Перейдите в раздел "Validation" (Валидация)
6. Вставьте следующую валидацию:

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["participants"],
    "properties": {
      "participants": {
        "bsonType": "array",
        "description": "Массив участников чата (ровно 2)",
        "minItems": 2,
        "maxItems": 2,
        "items": {
          "bsonType": "objectId",
          "description": "ID пользователя"
        }
      },
      "lastMessage": {
        "bsonType": "objectId",
        "description": "ID последнего сообщения"
      },
      "lastMessageAt": {
        "bsonType": "date",
        "description": "Дата последнего сообщения"
      },
      "createdAt": {
        "bsonType": "date",
        "description": "Дата создания"
      },
      "updatedAt": {
        "bsonType": "date",
        "description": "Дата обновления"
      }
    }
  }
}
```

7. Установите:
   - **Validation Level**: `strict`
   - **Validation Action**: `error`

### Вариант 2: Через MongoDB Shell

Выполните команды из файла `mongodb-chats-setup-commands.js`:

```javascript
// Создаем коллекцию chats с валидацией
db.createCollection("chats", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["participants"],
      properties: {
        participants: {
          bsonType: "array",
          description: "Массив участников чата (ровно 2)",
          minItems: 2,
          maxItems: 2,
          items: {
            bsonType: "objectId",
            description: "ID пользователя"
          }
        },
        lastMessage: {
          bsonType: "objectId",
          description: "ID последнего сообщения"
        },
        lastMessageAt: {
          bsonType: "date",
          description: "Дата последнего сообщения"
        },
        createdAt: {
          bsonType: "date",
          description: "Дата создания"
        },
        updatedAt: {
          bsonType: "date",
          description: "Дата обновления"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// Создаем индексы
db.chats.createIndex({ participants: 1 });
db.chats.createIndex({ lastMessageAt: -1 });
```

### Вариант 3: Обновить существующую коллекцию

Если коллекция уже существует:

```javascript
// Обновляем валидацию существующей коллекции
db.runCommand({
  collMod: "chats",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["participants"],
      properties: {
        participants: {
          bsonType: "array",
          description: "Массив участников чата (ровно 2)",
          minItems: 2,
          maxItems: 2,
          items: {
            bsonType: "objectId",
            description: "ID пользователя"
          }
        },
        lastMessage: {
          bsonType: "objectId",
          description: "ID последнего сообщения"
        },
        lastMessageAt: {
          bsonType: "date",
          description: "Дата последнего сообщения"
        },
        createdAt: {
          bsonType: "date",
          description: "Дата создания"
        },
        updatedAt: {
          bsonType: "date",
          description: "Дата обновления"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// Удаляем старые индексы (если есть)
db.chats.dropIndexes();

// Создаем новые индексы
db.chats.createIndex({ participants: 1 });
db.chats.createIndex({ lastMessageAt: -1 });
```

## Предотвращение дубликатов

**ВАЖНО**: Уникальный индекс на participants НЕ создается автоматически, так как MongoDB не поддерживает уникальность для массивов напрямую.

Вместо этого используется логика в коде API, которая проверяет существование чата перед созданием.

## Проверка

После создания коллекции проверьте:

```javascript
// Проверить валидацию
db.getCollectionInfos({ name: "chats" });

// Проверить индексы
db.chats.getIndexes();

// Попробовать создать тестовый чат
db.chats.insertOne({
  participants: [ObjectId("507f1f77bcf86cd799439011"), ObjectId("507f1f77bcf86cd799439012")],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

