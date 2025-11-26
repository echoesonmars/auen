/**
 * Скрипт для миграции изображений в Cloudinary
 * 
 * ВАЖНО: Этот скрипт работает только если у вас есть локальные файлы изображений
 * в папке public/uploads/ads и public/uploads/avatars
 * 
 * Использование:
 * npx tsx scripts/migrate-images-to-cloudinary.ts
 */

import mongoose from "mongoose";
import connectDB from "../lib/mongodb";
import Ad from "../models/Ad";
import User from "../models/User";
import { v2 as cloudinary } from "cloudinary";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Настройка Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Ошибка: Не настроены переменные окружения Cloudinary!");
  console.log("Добавьте в .env.local:");
  console.log("CLOUDINARY_CLOUD_NAME=your_cloud_name");
  console.log("CLOUDINARY_API_KEY=your_api_key");
  console.log("CLOUDINARY_API_SECRET=your_api_secret");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(filePath: string, folder: string, publicId?: string): Promise<string | null> {
  try {
    if (!existsSync(filePath)) {
      console.warn(`⚠️  Файл не найден: ${filePath}`);
      return null;
    }

    const fileBuffer = await readFile(filePath);
    const base64Image = fileBuffer.toString("base64");
    
    // Определяем MIME тип по расширению файла
    const ext = filePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'gif') mimeType = 'image/gif';
    
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      public_id: publicId,
      resource_type: "image",
      overwrite: false,
    });

    return result.secure_url;
  } catch (error) {
    console.error(`❌ Ошибка загрузки ${filePath}:`, error);
    return null;
  }
}

async function migrateAds() {
  try {
    await connectDB();
    console.log("✓ Подключено к MongoDB");

    const ads = await Ad.find({ images: { $exists: true, $ne: [] } }).lean();
    console.log(`\nНайдено ${ads.length} объявлений с изображениями`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const ad of ads) {
      if (!ad.images || ad.images.length === 0) continue;

      const newImages: string[] = [];
      let hasChanges = false;

      for (const imagePath of ad.images) {
        // Если уже URL Cloudinary, оставляем как есть
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
          newImages.push(imagePath);
          continue;
        }

        // Если путь /uploads/ads/..., пытаемся загрузить в Cloudinary
        if (imagePath.startsWith("/uploads/ads/")) {
          const fileName = imagePath.replace("/uploads/ads/", "");
          const localPath = join(process.cwd(), "public", "uploads", "ads", fileName);

          console.log(`\nОбработка: ${imagePath}`);
          
          const cloudinaryUrl = await uploadToCloudinary(
            localPath,
            "auen/ads",
            fileName.replace(/\.[^/.]+$/, "") // убираем расширение
          );

          if (cloudinaryUrl) {
            newImages.push(cloudinaryUrl);
            hasChanges = true;
            console.log(`  ✓ Загружено в Cloudinary: ${cloudinaryUrl}`);
          } else {
            // Если файл не найден локально, оставляем старый путь
            newImages.push(imagePath);
            console.log(`  ⚠️  Файл не найден локально, оставляем старый путь`);
          }
        } else {
          // Другие пути оставляем как есть
          newImages.push(imagePath);
        }
      }

      if (hasChanges) {
        try {
          await Ad.updateOne(
            { _id: ad._id },
            { $set: { images: newImages } }
          );
          updated++;
          console.log(`✓ Обновлено объявление ${ad._id}`);
        } catch (error) {
          console.error(`❌ Ошибка обновления объявления ${ad._id}:`, error);
          errors++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n📊 Результаты миграции объявлений:`);
    console.log(`  ✓ Обновлено: ${updated}`);
    console.log(`  ⏭️  Пропущено: ${skipped}`);
    console.log(`  ❌ Ошибок: ${errors}`);
  } catch (error) {
    console.error("❌ Ошибка миграции объявлений:", error);
  }
}

async function migrateAvatars() {
  try {
    const users = await User.find({ 
      avatar: { 
        $exists: true, 
        $nin: [null, ""] 
      } 
    }).lean();
    console.log(`\nНайдено ${users.length} пользователей с аватарами`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      if (!user.avatar) continue;

      // Если уже URL Cloudinary, пропускаем
      if (user.avatar.startsWith("http://") || user.avatar.startsWith("https://")) {
        skipped++;
        continue;
      }

      // Если путь /uploads/avatars/..., пытаемся загрузить в Cloudinary
      if (user.avatar.startsWith("/uploads/avatars/")) {
        const fileName = user.avatar.replace("/uploads/avatars/", "");
        const localPath = join(process.cwd(), "public", "uploads", "avatars", fileName);

        console.log(`\nОбработка аватара: ${user.avatar}`);
        
        const cloudinaryUrl = await uploadToCloudinary(
          localPath,
          "auen/avatars",
          `${user._id}-${Date.now()}`
        );

        if (cloudinaryUrl) {
          try {
            await User.updateOne(
              { _id: user._id },
              { $set: { avatar: cloudinaryUrl } }
            );
            updated++;
            console.log(`  ✓ Загружено в Cloudinary: ${cloudinaryUrl}`);
          } catch (error) {
            console.error(`❌ Ошибка обновления пользователя ${user._id}:`, error);
            errors++;
          }
        } else {
          skipped++;
          console.log(`  ⚠️  Файл не найден локально`);
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n📊 Результаты миграции аватаров:`);
    console.log(`  ✓ Обновлено: ${updated}`);
    console.log(`  ⏭️  Пропущено: ${skipped}`);
    console.log(`  ❌ Ошибок: ${errors}`);
  } catch (error) {
    console.error("❌ Ошибка миграции аватаров:", error);
  }
}

async function main() {
  try {
    console.log("🚀 Начало миграции изображений в Cloudinary\n");
    
    await migrateAds();
    await migrateAvatars();

    console.log("\n✅ Миграция завершена!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    process.exit(1);
  }
}

main();

