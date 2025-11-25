// MongoDB Shell скрипт для применения валидации к коллекции reviews
// Запустите этот скрипт в MongoDB Shell: mongosh < database-name > < mongodb-setup-reviews-validation.js

// Применяем валидацию к коллекции reviews
db.createCollection("reviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "adId", "rating", "comment"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "ID пользователя, который оставил отзыв"
        },
        adId: {
          bsonType: "objectId",
          description: "ID объявления, на которое оставлен отзыв"
        },
        rating: {
          bsonType: "int",
          minimum: 1,
          maximum: 5,
          description: "Рейтинг от 1 до 5"
        },
        comment: {
          bsonType: "string",
          minLength: 10,
          maxLength: 500,
          description: "Текст отзыва от 10 до 500 символов"
        },
        createdAt: {
          bsonType: ["date", "null"],
          description: "Дата создания отзыва"
        },
        updatedAt: {
          bsonType: ["date", "null"],
          description: "Дата обновления отзыва"
        }
      },
      additionalProperties: false
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// Создаем индексы
db.reviews.createIndex({ userId: 1, adId: 1 }, { unique: true });
db.reviews.createIndex({ adId: 1, createdAt: -1 });
db.reviews.createIndex({ userId: 1 });

print("✓ Валидация и индексы для коллекции reviews успешно применены");

