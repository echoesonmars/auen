# Исправление: Данные сохраняются в базу "test" вместо "auen"

## Проблема
Данные сохраняются в базу данных `test` вместо `auen` потому что в connection string MongoDB не указана правильная база данных.

## Решение

### Шаг 1: Проверьте файл `.env.local`

Откройте файл `.env.local` в корне проекта и проверьте строку `MONGODB_URI`.

### Шаг 2: Исправьте connection string

**Неправильно:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
```
или
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/test?retryWrites=true&w=majority
```

**Правильно:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/auen?retryWrites=true&w=majority
```

**Важно:** База данных указывается после последнего `/` и перед `?`

### Формат connection string:
```
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
                                                    ^^^^^^^^^^^^^^
                                                    Здесь должна быть "auen"
```

### Пример правильного connection string:
```
MONGODB_URI=mongodb+srv://admin:password123@cluster0.xxxxx.mongodb.net/auen?retryWrites=true&w=majority
```

## Шаг 3: Перезапустите сервер

После изменения `.env.local` нужно перезапустить dev-сервер:

```bash
# Остановите сервер (Ctrl+C)
# Затем запустите снова:
npm run dev
```

## Шаг 4: Проверьте подключение

После перезапуска новые регистрации должны сохраняться в базу `auen`, а не `test`.

## Перенос данных из "test" в "auen"

Если в базе `test` уже есть данные, которые нужно перенести:

### Через MongoDB Compass:
1. Откройте базу `test`
2. Выберите коллекцию (например, `users`)
3. Нажмите "Export Collection" → Export as JSON
4. Откройте базу `auen`
5. Нажмите "Import Data" → выберите файл
6. Повторите для всех коллекций

### Через MongoDB Shell:
```javascript
// Подключитесь к MongoDB
use test

// Скопируйте данные из test в auen
db.users.find().forEach(function(doc) {
  db.getSiblingDB('auen').users.insertOne(doc);
})

// Проверьте
use auen
db.users.find().count()
```

## Проверка текущей базы данных

В коде можно проверить, к какой базе подключено:

```javascript
console.log("Current database:", mongoose.connection.db.databaseName);
```

Добавьте это в `lib/mongodb.ts` для отладки:

```typescript
cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
  console.log("Connected to database:", mongoose.connection.db.databaseName);
  return mongoose;
});
```

