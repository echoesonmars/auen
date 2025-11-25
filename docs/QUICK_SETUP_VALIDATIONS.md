# Быстрая настройка валидаций MongoDB

## Скопируйте и выполните в MongoDB Shell или Compass:

```javascript
use auen

// ========== 1. CHATS (Чаты) ==========
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

// ========== 2. MESSAGES (Сообщения) ==========
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

print("✓ Валидации и индексы созданы!");
```

## Или через MongoDB Compass:

### Для коллекции `chats`:
1. Откройте коллекцию `chats`
2. Settings → Validation
3. Вставьте:

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
        "items": { "bsonType": "objectId" }
      },
      "lastMessage": { "bsonType": "objectId" },
      "lastMessageAt": { "bsonType": "date" },
      "createdAt": { "bsonType": "date" },
      "updatedAt": { "bsonType": "date" }
    }
  }
}
```

4. Validation Level: `strict`
5. Validation Action: `error`

### Для коллекции `messages`:
1. Откройте коллекцию `messages`
2. Settings → Validation
3. Вставьте:

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["chatId", "senderId", "receiverId", "text"],
    "properties": {
      "chatId": { "bsonType": "objectId" },
      "senderId": { "bsonType": "objectId" },
      "receiverId": { "bsonType": "objectId" },
      "text": {
        "bsonType": "string",
        "minLength": 1,
        "maxLength": 2000
      },
      "read": { "bsonType": "bool" },
      "createdAt": { "bsonType": "date" },
      "updatedAt": { "bsonType": "date" }
    }
  }
}
```

4. Validation Level: `strict`
5. Validation Action: `error`

