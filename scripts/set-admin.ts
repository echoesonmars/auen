/**
 * Скрипт для назначения пользователя администратором
 * 
 * Использование:
 * npx tsx scripts/set-admin.ts <email>
 * или
 * node -r ts-node/register scripts/set-admin.ts <email>
 */

import connectDB from "../lib/mongodb";
import User from "../models/User";

async function setAdmin(email: string) {
  try {
    console.log("Подключение к базе данных...");
    await connectDB();
    console.log("✓ Подключено к MongoDB");

    // Ищем пользователя по email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`❌ Пользователь с email "${email}" не найден`);
      process.exit(1);
    }

    console.log(`Найден пользователь: ${user.name} (${user.email})`);
    console.log(`Текущая роль: ${user.role || "user"}`);

    // Устанавливаем роль администратора
    user.role = "admin";
    await user.save();

    console.log("✓ Пользователь успешно назначен администратором!");
    console.log(`Новая роль: ${user.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Ошибка при назначении администратора:", error);
    process.exit(1);
  }
}

// Получаем email из аргументов командной строки
const email = process.argv[2];

if (!email) {
  console.error("❌ Укажите email пользователя");
  console.log("\nИспользование:");
  console.log("  npx tsx scripts/set-admin.ts <email>");
  console.log("  или");
  console.log("  node -r ts-node/register scripts/set-admin.ts <email>");
  console.log("\nПример:");
  console.log('  npx tsx scripts/set-admin.ts "admin@example.com"');
  process.exit(1);
}

setAdmin(email);

