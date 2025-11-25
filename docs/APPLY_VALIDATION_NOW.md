# ⚠️ СРОЧНО: ПРИМЕНИТЕ ЭТУ ВАЛИДАЦИЮ!

## Проблема
Непрочитанные сообщения НЕ обновляются из-за неправильной валидации MongoDB.

## Решение - ВЫПОЛНИТЕ СЕЙЧАС:

### 1. Откройте MongoDB Shell или MongoDB Compass

### 2. Выполните ЭТИ команды:

```javascript
use auen

// ============================================
// ИСПРАВЛЕНИЕ ВАЛИДАЦИИ ДЛЯ MESSAGES
// ============================================
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
  validationLevel: "moderate",  // ← КРИТИЧЕСКИ ВАЖНО! moderate позволяет обновлять
  validationAction: "error"
});

// ============================================
// ИСПРАВЛЕНИЕ ВАЛИДАЦИИ ДЛЯ CHATS
// ============================================
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
  validationLevel: "moderate",  // ← КРИТИЧЕСКИ ВАЖНО!
  validationAction: "error"
});

// ============================================
// СОЗДАНИЕ ИНДЕКСОВ ДЛЯ БЫСТРОГО ПОИСКА
// ============================================
db.messages.createIndex({ receiverId: 1, read: 1 }, { background: true });
db.messages.createIndex({ chatId: 1, receiverId: 1, read: 1 }, { background: true });
db.messages.createIndex({ chatId: 1, createdAt: -1 }, { background: true });

print("============================================");
print("✓ ВАЛИДАЦИЯ ПРИМЕНЕНА УСПЕШНО!");
print("============================================");
print("Теперь перезапустите приложение: npm run dev");
print("============================================");
```

### 3. Перезапустите приложение

```bash
npm run dev
```

### 4. Проверьте работу

1. Откройте чат с непрочитанными сообщениями
2. Проверьте консоль сервера - должны быть логи:
   ```
   Before marking: X unread messages
   ✓ Marked X messages as read
   After marking: 0 unread messages remaining
   ```
3. Проверьте навбар - красный круг должен исчезнуть
4. Обновите страницу - счетчик должен остаться 0

## Почему это работает?

- `validationLevel: "moderate"` - позволяет обновлять существующие документы
- `additionalProperties: true` - разрешает дополнительные поля
- Поле `read` может быть `bool` или `null` - это позволяет обновлять его

## Если все еще не работает

Выполните проверку вручную:

```javascript
use auen

// Проверьте непрочитанные сообщения
db.messages.find({ read: false }).count();

// Проверьте конкретный чат
db.messages.find({ 
  chatId: ObjectId("YOUR_CHAT_ID"), 
  receiverId: ObjectId("YOUR_USER_ID"),
  read: false 
});

// Вручную пометьте как прочитанные (для теста)
db.messages.updateMany(
  { 
    chatId: ObjectId("YOUR_CHAT_ID"), 
    receiverId: ObjectId("YOUR_USER_ID"),
    read: false 
  },
  { $set: { read: true } }
);
```

## Файлы с валидацией

- `docs/mongodb-chats-validation-fixed.json` - валидация для chats
- `docs/mongodb-messages-validation-fixed.json` - валидация для messages
- `docs/mongodb-setup-chats-messages-fixed.js` - полный скрипт настройки

