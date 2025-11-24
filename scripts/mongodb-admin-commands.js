/**
 * MongoDB команды для назначения администратора
 * 
 * Можно выполнить эти команды в MongoDB Compass или через mongo shell
 */

// Способ 1: Обновление по email
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)

// Способ 2: Обновление по ID
db.users.updateOne(
  { _id: ObjectId("your-user-id-here") },
  { $set: { role: "admin" } }
)

// Способ 3: Создание нового пользователя-администратора (если нужно)
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2a$10$hashedPasswordHere", // Нужно захешировать пароль
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})

// Проверка текущей роли пользователя
db.users.findOne({ email: "your-email@example.com" }, { role: 1, name: 1, email: 1 })

// Список всех администраторов
db.users.find({ role: "admin" }, { name: 1, email: 1, role: 1 })

