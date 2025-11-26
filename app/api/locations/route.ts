import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Location from "@/models/Location";
import Ad from "@/models/Ad";

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

      // Создаем локации для городов
      for (const city of cities) {
        if (city) {
          const adsCount = await Ad.countDocuments({ location: city, status: "active" });
          await Location.findOneAndUpdate(
            { name: city, type: "city" },
            { name: city, type: "city", adsCount },
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
        adsCount = await Ad.countDocuments({ location: location.name, status: "active" });
      } else if (location.type === "category") {
        adsCount = await Ad.countDocuments({ category: location.name, status: "active" });
      }

      if (adsCount !== location.adsCount) {
        await Location.findByIdAndUpdate(location._id, { adsCount });
      }
    }

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

    // Подсчитываем количество объявлений
    let adsCount = 0;
    if (type === "city") {
      adsCount = await Ad.countDocuments({ location: name, status: "active" });
    } else if (type === "category") {
      adsCount = await Ad.countDocuments({ category: name, status: "active" });
    }

    const location = await Location.findOneAndUpdate(
      { name, type },
      { name, type, icon: icon || null, adsCount },
      { upsert: true, new: true }
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

