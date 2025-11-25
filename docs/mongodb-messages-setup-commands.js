/**
 * Скрипт для создания коллекции messages с валидацией в MongoDB
 * Запуск в MongoDB Shell или Compass:
 * 
 * 1. Подключитесь к вашей базе данных
 * 2. Выберите базу данных: use auen
 * 3. Скопируйте и выполните команды ниже
 */

// Создаем коллекцию messages с валидацией
db.createCollection("messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chatId", "senderId", "receiverId", "text"],
      properties: {
        chatId: {
          bsonType: "objectId",
          description: "ID чата"
        },
        senderId: {
          bsonType: "objectId",
          description: "ID отправителя"
        },
        receiverId: {
          bsonType: "objectId",
          description: "ID получателя"
        },
        text: {
          bsonType: "string",
          description: "Текст сообщения",
          minLength: 1,
          maxLength: 2000
        },
        read: {
          bsonType: "bool",
          description: "Прочитано ли сообщение"
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
db.messages.createIndex({ chatId: 1, createdAt: -1 });
db.messages.createIndex({ senderId: 1, receiverId: 1 });
db.messages.createIndex({ chatId: 1 });
db.messages.createIndex({ receiverId: 1, read: 1 });

print("✓ Коллекция 'messages' создана с валидацией и индексами");

