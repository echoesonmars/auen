// MongoDB Shell script для создания коллекции bookings и применения валидации

// Переключаемся на нужную базу данных
use auen;

// Создаем коллекцию bookings с валидацией
db.createCollection("bookings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["adId", "renterId", "ownerId", "startDate", "endDate", "periodType", "totalPrice"],
      properties: {
        adId: {
          bsonType: "objectId",
          description: "ID объявления"
        },
        renterId: {
          bsonType: "objectId",
          description: "ID арендатора"
        },
        ownerId: {
          bsonType: "objectId",
          description: "ID владельца объявления"
        },
        startDate: {
          bsonType: "date",
          description: "Дата начала бронирования"
        },
        endDate: {
          bsonType: "date",
          description: "Дата окончания бронирования"
        },
        startTime: {
          bsonType: ["date", "null"],
          description: "Время начала бронирования (опционально)"
        },
        endTime: {
          bsonType: ["date", "null"],
          description: "Время окончания бронирования (опционально)"
        },
        periodType: {
          enum: ["hour", "day", "week", "month"],
          description: "Тип периода бронирования"
        },
        totalPrice: {
          bsonType: ["double", "int"],
          minimum: 0,
          description: "Общая стоимость бронирования"
        },
        status: {
          enum: ["pending", "confirmed", "cancelled", "completed"],
          description: "Статус бронирования"
        },
        createdAt: {
          bsonType: ["date", "null"],
          description: "Дата создания"
        },
        updatedAt: {
          bsonType: ["date", "null"],
          description: "Дата обновления"
        }
      },
      additionalProperties: true
    }
  },
  validationLevel: "moderate",
  validationAction: "error"
});

// Создаем индексы для быстрого поиска
db.bookings.createIndex({ adId: 1, startDate: 1, endDate: 1 });
db.bookings.createIndex({ renterId: 1, status: 1 });
db.bookings.createIndex({ ownerId: 1, status: 1 });
db.bookings.createIndex({ status: 1, createdAt: -1 });

print("Коллекция bookings создана с валидацией и индексами");

