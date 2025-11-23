// Команды для настройки валидаций MongoDB для коллекции ads
// Выполните эти команды в MongoDB Compass или через mongo shell

// 1. Создайте коллекцию ads (если еще не создана)
// MongoDB создаст коллекцию автоматически при первой записи, но можно создать вручную:
db.createCollection("ads")

// 2. Установите правильные валидации
db.runCommand({
  collMod: "ads",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "category", "description", "price", "location", "userId"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 10,
          maxLength: 100,
          description: "Название должно содержать 10-100 символов"
        },
        category: {
          bsonType: "string",
          enum: [
            "Инструменты",
            "Студии",
            "DJ оборудование",
            "Клавишные",
            "Микрофоны",
            "Аудио"
          ],
          description: "Некорректная категория"
        },
        description: {
          bsonType: "string",
          minLength: 50,
          maxLength: 2000,
          description: "Описание должно содержать 50-2000 символов"
        },
        price: {
          bsonType: "string",
          pattern: "^\\d+(\\s*₸)?\\s*\\/\\s*(час|день|неделя|месяц)$",
          description: "Формат: 5000 ₸/час или 5000 ₸/день"
        },
        location: {
          bsonType: "string",
          minLength: 2,
          maxLength: 50,
          description: "Локация должна содержать 2-50 символов"
        },
        images: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          maxItems: 10,
          description: "Максимум 10 фотографий"
        },
        userId: {
          bsonType: "objectId",
          description: "ID пользователя"
        },
        views: {
          bsonType: "int",
          minimum: 0,
          description: "Количество просмотров не может быть отрицательным"
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive", "sold"],
          description: "Некорректный статус"
        },
        createdAt: {
          bsonType: "date"
        },
        updatedAt: {
          bsonType: "date"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})

// 3. Создайте индексы для оптимизации запросов
db.ads.createIndex({ userId: 1, createdAt: -1 })
db.ads.createIndex({ category: 1, status: 1 })
db.ads.createIndex({ location: 1 })
db.ads.createIndex({ createdAt: -1 })
db.ads.createIndex({ views: -1 })

// 4. Проверьте валидации
db.getCollectionInfos({ name: "ads" })

