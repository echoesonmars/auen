# БЫСТРОЕ ИСПРАВЛЕНИЕ НЕПРОЧИТАННЫХ СООБЩЕНИЙ

## Проблема
Непрочитанные сообщения не обновляются после прочтения.

## Решение

### Шаг 1: Примените правильную валидацию MongoDB

Выполните в MongoDB Shell (mongosh) или MongoDB Compass:

```javascript
use auen

// ========== MESSAGES - ВАЖНО! ==========
db.runCommand({
  collMod: "messages",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chatId", "senderId", "receiverId", "text"],
      properties: {
        chatId: { bsonType: "objectId" },
        senderId: { bsonType: "objectId" },
        receiverId: { bsonType: "objectId" },
        text: {
          bsonType: "string",
          minLength: 1,
          maxLength: 2000
        },
        read: {
          bsonType: ["bool", "null"]
        },
        createdAt: { bsonType: ["date", "null"] },
        updatedAt: { bsonType: ["date", "null"] }
      },
      additionalProperties: true
    }
  },
  validationLevel: "moderate",  // ← ВАЖНО! moderate позволяет обновлять существующие документы
  validationAction: "error"
});

// ========== CHATS ==========
db.runCommand({
  collMod: "chats",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["participants"],
      properties: {
        participants: {
          bsonType: "array",
          minItems: 2,
          maxItems: 2,
          items: { bsonType: "objectId" }
        },
        lastMessage: { bsonType: ["objectId", "null"] },
        lastMessageAt: { bsonType: ["date", "null"] },
        createdAt: { bsonType: ["date", "null"] },
        updatedAt: { bsonType: ["date", "null"] }
      },
      additionalProperties: true
    }
  },
  validationLevel: "moderate",  // ← ВАЖНО!
  validationAction: "error"
});

// Создаем индексы для быстрого поиска
db.messages.createIndex({ receiverId: 1, read: 1 }, { background: true });
db.messages.createIndex({ chatId: 1, receiverId: 1, read: 1 }, { background: true });

print("✓ Валидация применена!");
```

### Шаг 2: Перезапустите приложение

```bash
npm run dev
```

### Шаг 3: Проверьте работу

1. Откройте чат с непрочитанными сообщениями
2. Проверьте консоль сервера - должны быть логи:
   - `Before marking: X unread messages`
   - `✓ Marked X messages as read`
   - `After marking: 0 unread messages remaining`
3. Проверьте навбар - красный круг должен исчезнуть
4. Обновите страницу - счетчик должен остаться 0

## Если не работает

### Вариант 1: Отключите валидацию временно

```javascript
use auen

db.runCommand({
  collMod: "messages",
  validator: {},
  validationLevel: "off"
});
```

### Вариант 2: Проверьте данные вручную

```javascript
use auen

// Проверьте, сколько непрочитанных сообщений
db.messages.countDocuments({ read: false });

// Проверьте конкретный чат
db.messages.find({ 
  chatId: ObjectId("YOUR_CHAT_ID"), 
  receiverId: ObjectId("YOUR_USER_ID"),
  read: false 
});

// Вручную пометьте как прочитанные
db.messages.updateMany(
  { 
    chatId: ObjectId("YOUR_CHAT_ID"), 
    receiverId: ObjectId("YOUR_USER_ID"),
    read: false 
  },
  { $set: { read: true } }
);
```

## Важно!

- `validationLevel: "moderate"` - это ключевой момент!
- Он позволяет обновлять существующие документы без строгой проверки
- Если используете `strict`, обновление поля `read` может блокироваться

