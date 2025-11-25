/**
 * Скрипт для создания коллекции chats с валидацией в MongoDB
 * Запуск в MongoDB Shell или Compass:
 * 
 * 1. Подключитесь к вашей базе данных
 * 2. Выберите базу данных: use auen
 * 3. Скопируйте и выполните команды ниже
 */

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

// Создаем уникальный составной индекс для предотвращения дубликатов
// Это гарантирует, что не будет двух чатов с одинаковыми участниками
db.chats.createIndex(
  { participants: 1 },
  { 
    unique: true,
    partialFilterExpression: {
      participants: { $size: 2 }
    }
  }
);

print("✓ Коллекция 'chats' создана с валидацией и индексами");

