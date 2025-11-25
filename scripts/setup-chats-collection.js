/**
 * Скрипт для создания коллекции chats в MongoDB
 * Запуск: node scripts/setup-chats-collection.js
 * 
 * Убедитесь, что MONGODB_URI установлен в переменных окружения или в .env.local
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Загружаем .env.local если существует
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function setupChatsCollection() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error("❌ MONGODB_URI не найден в переменных окружения");
      console.error("   Установите переменную окружения или создайте .env.local с MONGODB_URI");
      process.exit(1);
    }

    console.log("Подключение к MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✓ Подключено к MongoDB\n");

    const db = mongoose.connection.db;
    
    // Проверяем существование коллекции
    const collections = await db.listCollections().toArray();
    const chatsExists = collections.some(col => col.name === "chats");
    
    if (chatsExists) {
      console.log("✓ Коллекция 'chats' уже существует");
    } else {
      console.log("Создание коллекции 'chats'...");
      await db.createCollection("chats");
      console.log("✓ Коллекция 'chats' создана");
    }

    // Создаем индексы
    console.log("\nСоздание индексов...");
    const chatsCollection = db.collection("chats");
    
    try {
      await chatsCollection.createIndex({ participants: 1 });
      console.log("✓ Индекс на participants создан");
    } catch (e) {
      console.log("  (индекс на participants уже существует)");
    }

    try {
      await chatsCollection.createIndex({ lastMessageAt: -1 });
      console.log("✓ Индекс на lastMessageAt создан");
    } catch (e) {
      console.log("  (индекс на lastMessageAt уже существует)");
    }

    console.log("\n✓ Готово! Коллекция 'chats' настроена.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

setupChatsCollection();

