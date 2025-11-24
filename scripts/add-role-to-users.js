/**
 * Скрипт для добавления поля role всем существующим пользователям
 * 
 * Выполните в MongoDB Compass (MongoSH) или через mongosh:
 * 
 * use auen
 * load("scripts/add-role-to-users.js")
 * 
 * Или скопируйте команды и выполните вручную
 */

// Добавить роль "user" всем пользователям, у которых нет роли
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "user" } }
)

// Проверить результат
print("Пользователи с ролями:")
db.users.find({}, { name: 1, email: 1, role: 1 }).forEach(user => {
  print(`- ${user.name} (${user.email}): ${user.role || "НЕТ РОЛИ"}`)
})

// Назначить администратора (замените email на нужный)
db.users.updateOne(
  { email: "admin@gmail.com" },
  { $set: { role: "admin" } }
)

print("\n✓ Роли добавлены!")

