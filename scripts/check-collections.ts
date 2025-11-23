/**
 * Скрипт для проверки существования коллекций
 * Запуск: npx ts-node scripts/check-collections.ts
 */

import mongoose from "mongoose";
import connectDB from "../lib/mongodb";

async function checkCollections() {
  try {
    console.log("Подключение к MongoDB...");
    await connectDB();
    console.log("✓ Подключено к MongoDB\n");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }
    const collections = await db.listCollections().toArray();

    const requiredCollections = ["users", "ads", "messages", "chats", "reviews"];

    console.log("Существующие коллекции:");
    collections.forEach((col) => {
      const isRequired = requiredCollections.includes(col.name);
      console.log(
        `${isRequired ? "✓" : " "} ${col.name} ${isRequired ? "(требуется)" : ""}`
      );
    });

    console.log("\nОтсутствующие коллекции:");
    const existingNames = collections.map((col) => col.name);
    const missing = requiredCollections.filter(
      (name) => !existingNames.includes(name)
    );

    if (missing.length === 0) {
      console.log("✓ Все коллекции существуют");
    } else {
      missing.forEach((name) => {
        console.log(`✗ ${name}`);
      });
      console.log("\nЗапустите: npx ts-node scripts/create-collections.ts");
    }

    process.exit(0);
  } catch (error) {
    console.error("Ошибка:", error);
    process.exit(1);
  }
}

checkCollections();

