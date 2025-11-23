// Команды для настройки валидаций MongoDB для коллекции users
// Выполните эти команды в MongoDB Compass или через mongo shell

// 1. Удалите старые валидации (если есть)
db.runCommand({
  collMod: "users",
  validator: {}
})

// 2. Установите правильные валидации
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "phone", "password"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 50,
          pattern: "^[а-яА-ЯёЁa-zA-Z\\s]+$",
          description: "Имя должно содержать только буквы, 2-50 символов"
        },
        email: {
          bsonType: "string",
          pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
          description: "Email должен быть валидным"
        },
        phone: {
          bsonType: "string",
          pattern: "^\\+?[1-9]\\d{1,14}$",
          description: "Телефон должен быть в формате +77771234567"
        },
        password: {
          bsonType: "string",
          minLength: 8,
          description: "Пароль должен содержать минимум 8 символов"
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

// 3. Создайте уникальный индекс для email (если еще не создан)
db.users.createIndex({ email: 1 }, { unique: true })

// 4. Создайте индекс для createdAt (если еще не создан)
db.users.createIndex({ createdAt: -1 })

// 5. Проверьте валидации
db.getCollectionInfos({ name: "users" })

