import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import { updateAdSchema, validate, formatValidationErrors } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    // Обрабатываем params как Promise или обычный объект
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const ad = await Ad.findById(id)
      .populate("userId", "name email phone avatar")
      .lean();

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    // Увеличиваем счетчик просмотров
    await Ad.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Убеждаемся, что images - это массив и bookings тоже
    const adData = {
      ...ad,
      images: ad.images || [],
      bookings: ad.bookings || [],
    };

    return NextResponse.json(
      {
        success: true,
        data: adData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get ad error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении объявления",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    // Обрабатываем params как Promise или обычный объект
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    // Парсинг тела запроса
    let body;
    try {
      body = await request.json();
    } catch (parseError: unknown) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат данных",
          error: process.env.NODE_ENV === "development" && parseError instanceof Error ? parseError.message : undefined,
        },
        { status: 400 }
      );
    }

    // Получение userId из запроса
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    // Валидация формата userId (должен быть валидный ObjectId)
    const mongoose = (await import("mongoose")).default;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный формат ID пользователя",
          errors: { userId: "ID пользователя имеет неверный формат" },
        },
        { status: 400 }
      );
    }

    // Валидация формата id объявления
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный формат ID объявления",
          errors: { id: "ID объявления имеет неверный формат" },
        },
        { status: 400 }
      );
    }

    // Проверяем, существует ли объявление
    const existingAd = await Ad.findById(id);

    if (!existingAd) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является владельцем объявления
    const userIdObjectId = new mongoose.Types.ObjectId(userId);

    if (existingAd.userId.toString() !== userIdObjectId.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: "У вас нет прав на редактирование этого объявления",
        },
        { status: 403 }
      );
    }

    // Валидация данных
    const validation = validate(updateAdSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    // Подготовка данных для обновления
    const updateData: Record<string, unknown> = {};

    if (validation.data.title !== undefined) {
      updateData.title = validation.data.title.trim();
    }
    if (validation.data.category !== undefined) {
      updateData.category = validation.data.category;
    }
    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description.trim();
    }
    if (validation.data.price !== undefined) {
      updateData.price = validation.data.price.trim();
    }
    if (validation.data.location !== undefined) {
      updateData.location = validation.data.location.trim();
    }
    if (validation.data.images !== undefined) {
      updateData.images = validation.data.images;
    }

    // Обновляем объявление
    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("userId", "name email phone")
      .lean();

    if (!updatedAd) {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка при обновлении объявления",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...updatedAd,
          images: updatedAd.images || [],
        },
        message: "Объявление успешно обновлено",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update ad error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обновлении объявления",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

