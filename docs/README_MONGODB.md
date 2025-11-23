# Настройка MongoDB

## Шаг 1: Создание кластера в MongoDB Atlas

1. Выберите **Free** вариант (бесплатный)
2. Выберите провайдера (AWS, GCP или Azure) - любой подойдет
3. Выберите регион (Mumbai рекомендуется)
4. Нажмите "Create Cluster"

## Шаг 2: Настройка безопасности

1. После создания кластера, перейдите в "Database Access"
2. Создайте пользователя:
   - Username: ваш логин
   - Password: сгенерируйте надежный пароль (сохраните его!)
3. Нажмите "Add User"

4. Перейдите в "Network Access"
5. Добавьте IP адрес:
   - Для разработки: нажмите "Add Current IP Address"
   - Или добавьте `0.0.0.0/0` для доступа отовсюду (только для разработки!)

## Шаг 3: Получение Connection String

1. Перейдите в "Database" → "Connect"
2. Выберите "Connect your application"
3. Скопируйте connection string (выглядит как: `mongodb+srv://<username>:<password>@<cluster-url>/<database-name>...`)
4. Замените `<username>` на ваше имя пользователя
5. Замените `<password>` на ваш пароль
6. Замените `<cluster-url>` на URL вашего кластера
7. Замените `<database-name>` на `auen` (или другое имя базы данных)

## Шаг 4: Настройка проекта

1. Создайте файл `.env.local` в корне проекта:
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

2. Установите зависимости:
```bash
npm install mongoose
```

3. Перезапустите dev-сервер:
```bash
npm run dev
```

## Использование

Пример использования в API route:

```typescript
// app/api/users/route.ts
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  await connectDB();
  const users = await User.find();
  return Response.json(users);
}
```

## Важно!

- Никогда не коммитьте `.env.local` в git (он уже в .gitignore)
- Храните connection string в секрете
- Для продакшена используйте переменные окружения на хостинге

