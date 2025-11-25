# Валидации MongoDB для всех коллекций

## 1. Коллекция `chats`

### Через MongoDB Compass:
1. Откройте коллекцию `chats`
2. Перейдите в "Validation"
3. Вставьте валидацию:

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["participants"],
    "properties": {
      "participants": {
        "bsonType": "array",
        "minItems": 2,
        "maxItems": 2,
        "items": {
          "bsonType": "objectId"
        }
      },
      "lastMessage": {
        "bsonType": "objectId"
      },
      "lastMessageAt": {
        "bsonType": "date"
      },
      "createdAt": {
        "bsonType": "date"
      },
      "updatedAt": {
        "bsonType": "date"
      }
    }
  }
}
```

**Настройки:**
- Validation Level: `strict`
- Validation Action: `error`

### Через MongoDB Shell:

```javascript
use auen

// Если коллекция уже существует, обновляем валидацию
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
        lastMessage: { bsonType: "objectId" },
        lastMessageAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
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

---

## 2. Коллекция `messages`

### Через MongoDB Compass:
1. Откройте коллекцию `messages`
2. Перейдите в "Validation"
3. Вставьте валидацию:

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["chatId", "senderId", "receiverId", "text"],
    "properties": {
      "chatId": {
        "bsonType": "objectId"
      },
      "senderId": {
        "bsonType": "objectId"
      },
      "receiverId": {
        "bsonType": "objectId"
      },
      "text": {
        "bsonType": "string",
        "minLength": 1,
        "maxLength": 2000
      },
      "read": {
        "bsonType": "bool"
      },
      "createdAt": {
        "bsonType": "date"
      },
      "updatedAt": {
        "bsonType": "date"
      }
    }
  }
}
```

**Настройки:**
- Validation Level: `strict`
- Validation Action: `error`

### Через MongoDB Shell:

```javascript
use auen

// Если коллекция уже существует, обновляем валидацию
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
        read: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// Создаем индексы
db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.messages.createIndex({ senderId: 1, receiverId: 1 });
db.messages.createIndex({ chatId: 1 });
db.messages.createIndex({ receiverId: 1, read: 1 });
```

---

## 3. Создание всех коллекций одной командой

```javascript
use auen

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
        lastMessage: { bsonType: "objectId" },
        lastMessageAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

db.chats.createIndex({ participants: 1 });
db.chats.createIndex({ lastMessageAt: -1 });

// ========== MESSAGES ==========
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
        read: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.messages.createIndex({ senderId: 1, receiverId: 1 });
db.messages.createIndex({ chatId: 1 });
db.messages.createIndex({ receiverId: 1, read: 1 });

print("✓ Все валидации и индексы созданы!");
```

---

## Важно!

Если коллекции уже существуют и содержат данные, которые не проходят валидацию:
1. Сначала исправьте данные в коллекции
2. Или временно установите `validationLevel: "moderate"` (проверяет только новые документы)
3. Или используйте `bypassDocumentValidation: true` в коде (как уже сделано для chats)

