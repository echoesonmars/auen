/**
 * Скрипт для создания коллекций в MongoDB
 * Запуск: npx ts-node scripts/create-collections.ts
 */

import mongoose from "mongoose";
import connectDB from "../lib/mongodb";
import User from "../models/User";
import Ad from "../models/Ad";
import Message from "../models/Message";
import Chat from "../models/Chat";
import Review from "../models/Review";

async function createCollections() {
  try {
    console.log("Подключение к MongoDB...");
    await connectDB();
    console.log("✓ Подключено к MongoDB");

    // Создание коллекций через создание индексов
    console.log("\nСоздание коллекций...");

    // Users
    await User.createIndexes();
    console.log("✓ Коллекция 'users' создана");

    // Ads
    await Ad.createIndexes();
    console.log("✓ Коллекция 'ads' создана");

    // Messages
    await Message.createIndexes();
    console.log("✓ Коллекция 'messages' создана");

    // Chats
    await Chat.createIndexes();
    console.log("✓ Коллекция 'chats' создана");

    // Reviews
    await Review.createIndexes();
    console.log("✓ Коллекция 'reviews' создана");

    console.log("\n✓ Все коллекции успешно созданы!");
    console.log("\nПроверьте в MongoDB Atlas:");
    console.log("Database → Browse Collections → auen");

    process.exit(0);
  } catch (error) {
    console.error("Ошибка при создании коллекций:", error);
    process.exit(1);
  }
}

createCollections();

