# MongoDB Коллекции

## 1. Users
**Поля:**
- name: String (2-50 символов, только буквы)
- email: String (уникальный, валидный email)
- phone: String (формат телефона)
- password: String (минимум 8 символов, хешируется)
- createdAt, updatedAt: Date

**Индексы:** email, createdAt

## 2. Ads
**Поля:**
- title: String (10-100 символов)
- category: String (enum: Инструменты, Студии, DJ оборудование, Клавишные, Микрофоны, Аудио)
- description: String (50-2000 символов)
- price: String (формат: "5000 ₸/час")
- location: String (2-50 символов)
- images: [String] (максимум 10)
- userId: ObjectId (ref: User)
- views: Number (default: 0)
- status: String (enum: active, inactive, sold, default: active)
- createdAt, updatedAt: Date

**Индексы:** userId, category+status, location, createdAt, views

## 3. Messages
**Поля:**
- chatId: ObjectId (ref: Chat)
- senderId: ObjectId (ref: User)
- receiverId: ObjectId (ref: User)
- text: String (максимум 2000 символов)
- read: Boolean (default: false)
- createdAt: Date

**Индексы:** chatId+createdAt, senderId+receiverId

## 4. Chats
**Поля:**
- participants: [ObjectId] (ровно 2, ref: User)
- lastMessage: ObjectId (ref: Message, optional)
- lastMessageAt: Date (optional)
- createdAt: Date

**Индексы:** participants, lastMessageAt

## 5. Reviews
**Поля:**
- userId: ObjectId (ref: User)
- adId: ObjectId (ref: Ad)
- rating: Number (1-5)
- comment: String (10-500 символов)
- createdAt: Date

**Индексы:** userId+adId (unique), adId+createdAt

