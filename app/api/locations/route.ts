import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Location from "@/models/Location";
import Ad from "@/models/Ad";
import { normalizeCityName, isCityName } from "@/lib/cityNormalizer";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "city" или "category"

    const query: Record<string, unknown> = {};
    if (type) {
      query.type = type;
    }

    const locations = await Location.find(query)
      .sort({ adsCount: -1, name: 1 })
      .lean();

    // Если локаций нет, создаем их из существующих объявлений
    if (locations.length === 0) {
      // Получаем все уникальные города из объявлений
      const cities = await Ad.distinct("location", { status: "active" });
      const categories = await Ad.distinct("category", { status: "active" });

      // Нормализуем и фильтруем города
      const normalizedCities = new Map<string, string[]>(); // normalized -> [original1, original2, ...]
      
      for (const rawCity of cities) {
        if (rawCity && isCityName(rawCity)) {
          const normalized = normalizeCityName(rawCity);
          if (!normalizedCities.has(normalized)) {
            normalizedCities.set(normalized, []);
          }
          normalizedCities.get(normalized)!.push(rawCity);
        }
      }

      // Создаем локации для нормализованных городов
      for (const [normalizedCity, originalVariants] of Array.from(normalizedCities.entries())) {
        // Подсчитываем объявления для всех вариантов написания
        let totalAdsCount = 0;
        for (const variant of originalVariants) {
          const count = await Ad.countDocuments({ location: variant, status: "active" });
          totalAdsCount += count;
        }
        
        if (totalAdsCount > 0) {
          await Location.findOneAndUpdate(
            { name: normalizedCity, type: "city" },
            { name: normalizedCity, type: "city", adsCount: totalAdsCount },
            { upsert: true, new: true }
          );
        }
      }

      // Создаем локации для категорий
      for (const category of categories) {
        if (category) {
          const adsCount = await Ad.countDocuments({ category, status: "active" });
          await Location.findOneAndUpdate(
            { name: category, type: "category" },
            { name: category, type: "category", adsCount },
            { upsert: true, new: true }
          );
        }
      }

      // Повторно получаем локации
      const updatedLocations = await Location.find(query)
        .sort({ adsCount: -1, name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: updatedLocations,
      });
    }

    // Обновляем количество объявлений для каждой локации
    for (const location of locations) {
      let adsCount = 0;
      if (location.type === "city") {
        // Для городов ищем все варианты написания
        const normalized = normalizeCityName(location.name);
        // Ищем объявления с нормализованным названием и всеми возможными вариантами
        const allCities = await Ad.distinct("location", { status: "active" });
        const matchingCities = allCities.filter(city => 
          city && normalizeCityName(city) === normalized
        );
        
        if (matchingCities.length > 0) {
          adsCount = await Ad.countDocuments({ 
            location: { $in: matchingCities }, 
            status: "active" 
          });
        }
      } else if (location.type === "category") {
        adsCount = await Ad.countDocuments({ category: location.name, status: "active" });
      }

      if (adsCount !== location.adsCount) {
        await Location.findByIdAndUpdate(location._id, { adsCount });
      }
    }
    
    // Удаляем локации-города, которые не являются реальными городами
    const allCityLocations = await Location.find({ type: "city" }).lean();
    let deletedInvalid = 0;
    for (const cityLocation of allCityLocations) {
      if (!isCityName(cityLocation.name)) {
        await Location.deleteOne({ _id: cityLocation._id });
        console.log(`Удалена не-город локация: "${cityLocation.name}"`);
        deletedInvalid++;
      }
    }
    
    if (deletedInvalid > 0) {
      console.log(`Удалено ${deletedInvalid} некорректных локаций-городов`);
    }
    
    // Удаляем локации с нулевым количеством объявлений
    await Location.deleteMany({ adsCount: 0 });

    // Получаем обновленные данные
    const updatedLocations = await Location.find(query)
      .sort({ adsCount: -1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedLocations,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get locations error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при загрузке локаций",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, type, icon } = body;

    if (!name || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимы название и тип локации",
        },
        { status: 400 }
      );
    }

    // Валидация типа
    if (type !== "city" && type !== "category") {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный тип локации. Допустимые значения: city, category",
        },
        { status: 400 }
      );
    }

    // Валидация названия
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Название должно содержать от 2 до 100 символов",
        },
        { status: 400 }
      );
    }

    // Нормализуем название для городов
    let finalName = name.trim();
    if (type === "city") {
      if (isCityName(finalName)) {
        finalName = normalizeCityName(finalName);
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Некорректное название города",
          },
          { status: 400 }
        );
      }
    }

    // Подсчитываем количество объявлений
    let adsCount = 0;
    if (type === "city") {
      // Ищем все варианты написания города
      const allCities = await Ad.distinct("location", { status: "active" });
      const matchingCities = allCities.filter(city => 
        city && normalizeCityName(city) === finalName
      );
      
      if (matchingCities.length > 0) {
        adsCount = await Ad.countDocuments({ 
          location: { $in: matchingCities }, 
          status: "active" 
        });
      }
    } else if (type === "category") {
      adsCount = await Ad.countDocuments({ category: finalName, status: "active" });
    }

    const location = await Location.findOneAndUpdate(
      { name: finalName, type },
      { 
        name: finalName, 
        type, 
        icon: icon && icon.length <= 2 ? icon : null, 
        adsCount 
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Локация успешно создана",
        data: location,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create location error:", err);
    
    // Обработка ошибок валидации MongoDB
    if (err.message && err.message.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          message: "Локация с таким названием и типом уже существует",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании локации",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

