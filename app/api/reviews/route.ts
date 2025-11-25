import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import { createReviewSchema, validate, formatValidationErrors } from "@/lib/validations";

export const dynamic = 'force-dynamic';

// Получить отзывы пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get("userId");
    const adId = request.nextUrl.searchParams.get("adId");
    const adIds = request.nextUrl.searchParams.get("adIds"); // Список adIds через запятую

    if (!userId && !adId && !adIds) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимо указать userId, adId или adIds",
        },
        { status: 400 }
      );
    }

    const mongoose = (await import("mongoose")).default;
    let query: Record<string, unknown> = {};
    
    if (userId) {
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
      query = { userId: new mongoose.Types.ObjectId(userId) };
    }
    if (adId) {
      if (!mongoose.Types.ObjectId.isValid(adId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Некорректный формат ID объявления",
            errors: { adId: "ID объявления имеет неверный формат" },
          },
          { status: 400 }
        );
      }
      query = { ...query, adId: new mongoose.Types.ObjectId(adId) };
    }
    if (adIds) {
      // Обрабатываем список adIds через запятую
      const adIdArray = adIds.split(",").map((id) => id.trim());
      // Проверяем валидность всех ID
      const invalidIds = adIdArray.filter((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Некорректный формат ID объявлений",
            errors: { adIds: `Неверный формат ID: ${invalidIds.join(", ")}` },
          },
          { status: 400 }
        );
      }
      query = { adId: { $in: adIdArray.map((id) => new mongoose.Types.ObjectId(id)) } };
    }

    const reviews = await Review.find(query)
      .populate("userId", "name email avatar")
      .populate("adId", "title")
      .sort({ createdAt: -1 })
      .lean();

    // Вычисляем средний рейтинг
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      averageRating = sum / reviews.length;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          reviews,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get reviews error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении отзывов",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Создать отзыв
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId } = body;

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

    // Валидация данных
    const validation = validate(createReviewSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    // Валидация формата adId
    if (!mongoose.Types.ObjectId.isValid(validation.data.adId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный формат ID объявления",
          errors: { adId: "ID объявления имеет неверный формат" },
        },
        { status: 400 }
      );
    }

    const userIdObjectId = new mongoose.Types.ObjectId(userId);
    const adIdObjectId = new mongoose.Types.ObjectId(validation.data.adId);

    // Проверяем, не оставлял ли пользователь уже отзыв на это объявление
    const existingReview = await Review.findOne({
      userId: userIdObjectId,
      adId: adIdObjectId,
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "Вы уже оставили отзыв на это объявление",
        },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь не оставляет отзыв на своё объявление
    const Ad = (await import("@/models/Ad")).default;
    const ad = await Ad.findById(adIdObjectId);
    if (ad && ad.userId.toString() === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя оставить отзыв на своё объявление",
        },
        { status: 400 }
      );
    }

    // Создаем отзыв
    const review = await Review.create({
      userId: userIdObjectId,
      adId: adIdObjectId,
      rating: validation.data.rating,
      comment: validation.data.comment.trim(),
    });

    const populatedReview = await Review.findById(review._id)
      .populate("userId", "name email avatar")
      .populate("adId", "title")
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: populatedReview,
        message: "Отзыв успешно создан",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error & { code?: number };
    console.error("Create review error:", err);

    // Обработка дубликата
    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Вы уже оставили отзыв на это объявление",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании отзыва",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

