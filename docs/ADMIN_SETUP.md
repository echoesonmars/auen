# Настройка администратора

Для доступа к админ-панели необходимо назначить роль `admin` одному из пользователей.

## Способ 1: Использование скрипта (рекомендуется)

### Шаг 1: Установите зависимости для выполнения TypeScript скриптов

Если у вас еще не установлен `tsx`:
```bash
npm install -D tsx
```

Или используйте `ts-node`:
```bash
npm install -D ts-node
```

### Шаг 2: Запустите скрипт

```bash
npx tsx scripts/set-admin.ts "your-email@example.com"
```

Или с `ts-node`:
```bash
npx ts-node scripts/set-admin.ts "your-email@example.com"
```

Замените `your-email@example.com` на email пользователя, которого хотите сделать администратором.

### Пример:
```bash
npx tsx scripts/set-admin.ts "admin@auen.kz"
```

## Способ 2: Через MongoDB Compass

1. Откройте **MongoDB Compass** и подключитесь к вашей базе данных
2. Выберите базу данных `auen` (или другую, которую вы используете)
3. Откройте коллекцию `users`
4. Найдите пользователя по email
5. Нажмите на документ пользователя для редактирования
6. Добавьте или измените поле `role` на `"admin"`
7. Сохраните изменения

## Способ 3: Через MongoDB Shell (mongo CLI)

1. Подключитесь к вашей MongoDB:
```bash
mongosh "mongodb+srv://your-connection-string"
```

2. Выберите базу данных:
```javascript
use auen
```

3. Обновите роль пользователя:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

4. Проверьте результат:
```javascript
db.users.findOne({ email: "your-email@example.com" }, { role: 1, name: 1, email: 1 })
```

## Способ 4: Через код (Node.js скрипт)

Создайте файл `set-admin-manual.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, default: 'user' }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function setAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: 'your-email@example.com' });
  if (user) {
    user.role = 'admin';
    await user.save();
    console.log('✓ Администратор назначен!');
  } else {
    console.log('❌ Пользователь не найден');
  }
  
  await mongoose.disconnect();
}

setAdmin();
```

Запустите:
```bash
node set-admin-manual.js
```

## Проверка доступа

После назначения роли администратора:

1. Войдите в систему с этим email и паролем
2. Откройте админ-панель: `http://localhost:3000/admin`
3. В навбаре должна появиться кнопка "Админ"

## Доступные роли

- `user` - обычный пользователь (по умолчанию)
- `moderator` - модератор (может модерировать объявления)
- `admin` - администратор (полный доступ)

## Важные замечания

⚠️ **Безопасность:**
- Не назначайте роль `admin` случайным пользователям
- Регулярно проверяйте список администраторов
- Используйте сильные пароли для административных аккаунтов

⚠️ **Первая настройка:**
- Первого администратора нужно создать вручную через MongoDB
- После этого администраторы могут назначать других администраторов через админ-панель

## Проблемы?

Если возникли проблемы:

1. Убедитесь, что пользователь существует в базе данных
2. Проверьте, что email указан правильно (учитывается регистр и пробелы)
3. Убедитесь, что поле `role` добавлено в документ пользователя
4. Проверьте подключение к базе данных в `.env.local`

