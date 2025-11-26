# Настройка Cloudinary для хранения изображений

## Проблема
На Vercel файловая система read-only, поэтому файлы не сохраняются в `public/uploads`. Для production необходимо использовать внешнее хранилище.

## Решение: Cloudinary

### 1. Создайте аккаунт Cloudinary
1. Перейдите на https://cloudinary.com
2. Зарегистрируйтесь (бесплатный тариф доступен)
3. После регистрации вы получите:
   - Cloud Name
   - API Key
   - API Secret

### 2. Добавьте переменные окружения в Vercel
В настройках проекта Vercel добавьте следующие переменные окружения:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Для локальной разработки
Добавьте те же переменные в файл `.env.local`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Примечание:** В development режиме код будет использовать локальное хранилище (`public/uploads`), а в production - Cloudinary.

### 4. Проверка работы
После настройки:
- В development: изображения сохраняются локально в `public/uploads`
- В production: изображения загружаются в Cloudinary и возвращаются полные URL

### Альтернативные решения
Если не хотите использовать Cloudinary, можно использовать:
- **Vercel Blob Storage** (новый сервис от Vercel)
- **AWS S3**
- **Google Cloud Storage**
- **Azure Blob Storage**

