# Обновление валидации коллекции users в MongoDB

## Что изменилось:

✅ **Добавлено поле `role`** с enum значениями: `["user", "admin", "moderator"]`
✅ **Поля `phone` и `password`** теперь опциональны (убраны из `required`)
✅ **Добавлены поля** `googleId` и `avatar` (опциональные)

## Как применить обновление:

### Способ 1: Через MongoDB Compass

1. Откройте MongoDB Compass
2. Подключитесь к базе данных
3. Выберите базу `auen` (или вашу базу)
4. Откройте коллекцию `users`
5. Перейдите во вкладку **"Validation"** (слева внизу)
6. Нажмите **"Edit"** или **"Update Validation"**
7. Скопируйте содержимое из файла `docs/mongodb-users-validation.json`
8. Вставьте в поле валидации
9. Нажмите **"Save"**

### Способ 2: Через MongoDB Shell

Скопируйте и выполните команду из файла `docs/mongodb-setup-commands.js`:

```javascript
// Подключитесь к MongoDB
use auen

// Обновите валидацию
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
          description: "Роль пользователя: user (по умолчанию), admin, moderator"
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

// Создайте индекс для role
db.users.createIndex({ role: 1 })
```

## Проверка:

После обновления валидации проверьте:

```javascript
// Проверьте валидацию
db.getCollectionInfos({ name: "users" })

// Проверьте существующие пользователи
db.users.find({}).forEach(user => {
  if (!user.role) {
    print(`Пользователь ${user.email} не имеет роли. Нужно добавить роль "user"`);
  }
})
```

## Добавление роли существующим пользователям:

Если у существующих пользователей нет поля `role`, добавьте его:

```javascript
// Добавить роль "user" всем пользователям без роли
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "user" } }
)
```

## Назначение администратора:

После обновления валидации можно назначить администратора:

```javascript
db.users.updateOne(
  { email: "admin@gmail.com" },
  { $set: { role: "admin" } }
)
```

Или используйте скрипт:
```bash
npm run set-admin "admin@gmail.com"
```

