import mongoose from "mongoose";
import connectDB from "../lib/mongodb";
import Ad from "../models/Ad";
import Location from "../models/Location";
import { normalizeCityName, isCityName } from "../lib/cityNormalizer";

async function normalizeCities() {
  try {
    await connectDB();
    console.log("Подключение к базе данных установлено");

    // Получаем все объявления
    const ads = await Ad.find({}).lean();
    console.log(`Найдено ${ads.length} объявлений`);

    let updated = 0;
    let skipped = 0;

    // Нормализуем города в объявлениях
    for (const ad of ads) {
      if (ad.location && isCityName(ad.location)) {
        const normalized = normalizeCityName(ad.location);
        
        if (normalized !== ad.location) {
          await Ad.updateOne(
            { _id: ad._id },
            { $set: { location: normalized } }
          );
          console.log(`Обновлено: "${ad.location}" -> "${normalized}"`);
          updated++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    console.log(`\nОбновлено объявлений: ${updated}`);
    console.log(`Пропущено: ${skipped}`);

    // Пересоздаем локации с нормализованными названиями
    console.log("\nПересоздание локаций...");
    
    // Удаляем все существующие локации типа city
    await Location.deleteMany({ type: "city" });
    console.log("Удалены старые локации городов");
    
    // Находим объявления с некорректными локациями
    const allAdsForCheck = await Ad.find({}).lean();
    let invalidLocations = 0;
    for (const ad of allAdsForCheck) {
      if (ad.location && !isCityName(ad.location)) {
        console.log(`⚠️  Объявление ${ad._id} имеет некорректную локацию: "${ad.location}"`);
        invalidLocations++;
      }
    }
    if (invalidLocations > 0) {
      console.log(`\n⚠️  Найдено ${invalidLocations} объявлений с некорректными локациями`);
      console.log("Эти объявления не будут учтены при создании локаций");
    }

    // Получаем все уникальные нормализованные города
    const allAds = await Ad.find({ status: "active" }).lean();
    const cityMap = new Map<string, number>();

    for (const ad of allAds) {
      if (ad.location && isCityName(ad.location)) {
        const normalized = normalizeCityName(ad.location);
        cityMap.set(normalized, (cityMap.get(normalized) || 0) + 1);
      }
    }

    // Создаем новые локации
    const cityEntries = Array.from(cityMap.entries());
    for (const [cityName, count] of cityEntries) {
      await Location.create({
        name: cityName,
        type: "city",
        adsCount: count,
      });
      console.log(`Создана локация: ${cityName} (${count} объявлений)`);
    }

    console.log(`\nСоздано локаций: ${cityMap.size}`);
    console.log("Готово!");

    process.exit(0);
  } catch (error) {
    console.error("Ошибка:", error);
    process.exit(1);
  }
}

normalizeCities();

