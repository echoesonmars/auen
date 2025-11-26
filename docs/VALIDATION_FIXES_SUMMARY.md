# ИСПРАВЛЕНИЯ ВАЛИДАЦИЙ

## Обновлено согласно `allvalidations.md`

### 1. **lib/validations/user.ts**
- ✅ Добавлены поля `bio`, `website`, `instagram`, `telegram`, `vk`, `youtube` в `updateProfileSchema`
- ✅ Все поля поддерживают `null` согласно MongoDB валидации
- ✅ Убрана лишняя проверка `min(10)` для телефона в `registerSchema`
- ✅ Добавлен `regex` для `name` в `updateProfileSchema` (только буквы)

### 2. **lib/validations/ad.ts**
- ✅ Обновлена валидация `images` для поддержки `null` и пустого массива
- ✅ Добавлен `min(0)` для массива изображений

### 3. **models/Ad.ts**
- ✅ Обновлен валидатор для `images` чтобы поддерживать `null`

### 4. **models/User.ts**
- ✅ Все валидации соответствуют MongoDB схеме из `allvalidations.md`

### 5. **app/api/user/profile/route.ts**
- ✅ Обновлена обработка `null` значений для всех опциональных полей

### 6. **app/api/ads/route.ts**
- ✅ Обновлена обработка `images` для поддержки `null`

### 7. **app/api/ads/[id]/route.ts**
- ✅ Обновлена обработка `images` при обновлении объявления

## Соответствие MongoDB валидации

Все валидации теперь соответствуют схеме из `allvalidations.md`:
- ✅ `ads`: все поля соответствуют
- ✅ `users`: все поля соответствуют

