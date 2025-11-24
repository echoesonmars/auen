# Добавление поля role существующим пользователям

Валидация MongoDB не добавляет поля автоматически. Нужно добавить поле `role` существующим пользователям вручную.

## Способ 1: Через MongoDB Compass (для одного пользователя)

1. Откройте документ пользователя
2. Нажмите кнопку **редактирования** (карандаш)
3. Нажмите **"INSERT FIELD"** или **"+"**
4. Добавьте:
   - **Field**: `role`
   - **Value**: `admin` (или `user`, `moderator`)
   - **Type**: String
5. Сохраните изменения

## Способ 2: Через MongoDB Shell (для всех пользователей)

### Шаг 1: Добавить роль "user" всем пользователям без роли

```javascript
use auen

// Добавить роль "user" всем пользователям, у которых нет роли
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "user" } }
)
```

### Шаг 2: Назначить администратора

```javascript
// Назначить роль "admin" конкретному пользователю
db.users.updateOne(
  { email: "admin@gmail.com" },
  { $set: { role: "admin" } }
)
```

### Шаг 3: Проверить результат

```javascript
// Посмотреть всех пользователей с ролями
db.users.find({}, { name: 1, email: 1, role: 1 }).pretty()

// Или только администраторов
db.users.find({ role: "admin" }, { name: 1, email: 1, role: 1 }).pretty()
```

## Способ 3: Через скрипт Node.js

Используйте готовый скрипт:

```bash
npm run set-admin "admin@gmail.com"
```

Этот скрипт автоматически добавит поле `role: "admin"` пользователю.

## Способ 4: Массовое обновление через MongoDB Compass

1. Откройте коллекцию `users`
2. Нажмите на кнопку **"Filter"** (фильтр)
3. Введите фильтр: `{ role: { $exists: false } }`
4. Выберите все найденные документы
5. Нажмите **"Update"** → **"Update Many"**
6. В поле обновления введите: `{ $set: { role: "user" } }`
7. Нажмите **"Update"**

## Быстрая команда для копирования

Скопируйте и выполните в MongoDB Shell:

```javascript
use auen

// 1. Добавить роль всем пользователям
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "user" } }
)

// 2. Назначить администратора
db.users.updateOne(
  { email: "admin@gmail.com" },
  { $set: { role: "admin" } }
)

// 3. Проверить
db.users.findOne({ email: "admin@gmail.com" }, { role: 1, name: 1, email: 1 })
```

После выполнения команды поле `role` появится у всех пользователей.

