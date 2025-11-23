# Настройка переменных окружения

## Создайте файл `.env.local` в корне проекта

Скопируйте содержимое ниже в файл `.env.local`:

```env
# MongoDB Connection String
# Получите connection string из MongoDB Atlas
# Формат: mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

# NextAuth Configuration
# Сгенерируйте секретный ключ командой: openssl rand -base64 32
# Или используйте онлайн генератор: https://generate-secret.vercel.app/32
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# OpenAI GPT API
# Получите API ключ на https://platform.openai.com/api-keys
OPENAI_API_KEY=<your-openai-api-key-here>

# Google OAuth (опционально, для входа через Google)
# Настройте на https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Как получить значения:

### 1. MongoDB URI
- Создайте кластер в MongoDB Atlas (Free вариант)
- Database Access → создайте пользователя
- Network Access → добавьте ваш IP
- Database → Connect → Connect your application
- Скопируйте connection string и замените `<password>` и `<dbname>`

### 2. NEXTAUTH_SECRET
Выполните в терминале:
```bash
openssl rand -base64 32
```
Или используйте онлайн генератор: https://generate-secret.vercel.app/32

### 3. OPENAI_API_KEY
- Зарегистрируйтесь на https://platform.openai.com
- Перейдите в API Keys
- Создайте новый ключ
- Скопируйте ключ (начинается с `sk-`)

### 4. Google OAuth (опционально)
- Перейдите в https://console.cloud.google.com
- Создайте проект или выберите существующий
- APIs & Services → Credentials
- Create Credentials → OAuth client ID
- Выберите Web application
- Добавьте authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
- Скопируйте Client ID и Client Secret

## Важно!

- Файл `.env.local` уже в `.gitignore` и не будет закоммичен
- Никогда не публикуйте эти ключи
- Для продакшена используйте переменные окружения на хостинге (Vercel, etc.)

