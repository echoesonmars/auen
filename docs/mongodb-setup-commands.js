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
      required: ["name", "email"],
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
          bsonType: ["string", "null"],
          pattern: "^\\+?[1-9]\\d{1,14}$",
          description: "Телефон должен быть в формате +77771234567 (опционально)"
        },
        password: {
          bsonType: ["string", "null"],
          minLength: 8,
          description: "Пароль должен содержать минимум 8 символов (опционально для Google OAuth)"
        },
        googleId: {
          bsonType: ["string", "null"],
          description: "Google ID для OAuth авторизации (опционально)"
        },
        avatar: {
          bsonType: ["string", "null"],
          description: "URL аватара пользователя (опционально)"
        },
        role: {
          bsonType: "string",
          enum: ["user", "admin", "moderator"],
          description: "Роль пользователя: user (по умолчанию устанавливается в приложении), admin, moderator"
        },
        createdAt: {
          bsonType: "date",
          description: "Дата создания аккаунта"
        },
        updatedAt: {
          bsonType: "date",
          description: "Дата последнего обновления"
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

// 5. Создайте индекс для role (если еще не создан)
db.users.createIndex({ role: 1 })

// 6. Создайте индекс для googleId (если еще не создан)
db.users.createIndex({ googleId: 1 }, { unique: true, sparse: true })

// 5. Проверьте валидации
db.getCollectionInfos({ name: "users" })

