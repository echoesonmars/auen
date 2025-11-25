// ============================================
// ПРАВИЛЬНАЯ ВАЛИДАЦИЯ ДЛЯ CHATS И MESSAGES
// ============================================
// Выполните этот скрипт в MongoDB Shell или MongoDB Compass
// use auen

print("============================================");
print("Настройка валидации для коллекций chats и messages");
print("============================================");

// ========== CHATS ==========
print("\n1. Настройка валидации для коллекции 'chats'...");

try {
  // Сначала удаляем старую валидацию если есть
  db.runCommand({
    collMod: "chats",
    validator: {},
    validationLevel: "off"
  });
  print("   ✓ Старая валидация удалена");
} catch (e) {
  print("   ⚠ Ошибка при удалении старой валидации (может не существовать): " + e);
}

// Устанавливаем новую валидацию
try {
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
            items: {
              bsonType: "objectId"
            },
            description: "Массив из ровно 2 участников чата"
          },
          lastMessage: {
            bsonType: ["objectId", "null"],
            description: "ID последнего сообщения в чате"
          },
          lastMessageAt: {
            bsonType: ["date", "null"],
            description: "Дата последнего сообщения"
          },
          createdAt: {
            bsonType: ["date", "null"],
            description: "Дата создания чата"
          },
          updatedAt: {
            bsonType: ["date", "null"],
            description: "Дата обновления чата"
          }
        },
        additionalProperties: true
      }
    },
    validationLevel: "moderate", // moderate - проверяет только новые и обновляемые документы
    validationAction: "error"
  });
  print("   ✓ Валидация для 'chats' установлена (moderate level)");
} catch (e) {
  print("   ✗ Ошибка при установке валидации для 'chats': " + e);
}

// Создаем индексы для chats
try {
  db.chats.createIndex({ participants: 1 }, { background: true });
  db.chats.createIndex({ lastMessageAt: -1 }, { background: true });
  print("   ✓ Индексы для 'chats' созданы");
} catch (e) {
  print("   ⚠ Ошибка при создании индексов для 'chats' (могут уже существовать): " + e);
}

// ========== MESSAGES ==========
print("\n2. Настройка валидации для коллекции 'messages'...");

try {
  // Сначала удаляем старую валидацию если есть
  db.runCommand({
    collMod: "messages",
    validator: {},
    validationLevel: "off"
  });
  print("   ✓ Старая валидация удалена");
} catch (e) {
  print("   ⚠ Ошибка при удалении старой валидации (может не существовать): " + e);
}

// Устанавливаем новую валидацию
try {
  db.runCommand({
    collMod: "messages",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["chatId", "senderId", "receiverId", "text"],
        properties: {
          chatId: {
            bsonType: "objectId",
            description: "ID чата, к которому относится сообщение"
          },
          senderId: {
            bsonType: "objectId",
            description: "ID отправителя сообщения"
          },
          receiverId: {
            bsonType: "objectId",
            description: "ID получателя сообщения"
          },
          text: {
            bsonType: "string",
            minLength: 1,
            maxLength: 2000,
            description: "Текст сообщения, 1-2000 символов"
          },
          read: {
            bsonType: ["bool", "null"],
            description: "Статус прочтения сообщения (true/false)"
          },
          createdAt: {
            bsonType: ["date", "null"],
            description: "Дата создания сообщения"
          },
          updatedAt: {
            bsonType: ["date", "null"],
            description: "Дата обновления сообщения"
          }
        },
        additionalProperties: true
      }
    },
    validationLevel: "moderate", // moderate - проверяет только новые и обновляемые документы
    validationAction: "error"
  });
  print("   ✓ Валидация для 'messages' установлена (moderate level)");
} catch (e) {
  print("   ✗ Ошибка при установке валидации для 'messages': " + e);
}

// Создаем индексы для messages
try {
  db.messages.createIndex({ chatId: 1, createdAt: -1 }, { background: true });
  db.messages.createIndex({ senderId: 1, receiverId: 1 }, { background: true });
  db.messages.createIndex({ chatId: 1 }, { background: true });
  db.messages.createIndex({ receiverId: 1, read: 1 }, { background: true });
  db.messages.createIndex({ receiverId: 1 }, { background: true });
  print("   ✓ Индексы для 'messages' созданы");
} catch (e) {
  print("   ⚠ Ошибка при создании индексов для 'messages' (могут уже существовать): " + e);
}

print("\n============================================");
print("✓ Настройка завершена!");
print("============================================");
print("\nВАЖНО:");
print("- validationLevel: 'moderate' - проверяет только новые и обновляемые документы");
print("- Это позволяет обновлять поле 'read' в существующих сообщениях");
print("- Если нужно строгая валидация, измените на 'strict'");
print("============================================");

