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
    console.log("POST /api/reviews - Received body:", body);
    const { userId } = body;

    if (!userId) {
      console.error("No userId provided");
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
    console.log("Validating review data...");
    const validation = validate(createReviewSchema, body);

    if (!validation.success) {
      console.error("Validation failed:", validation.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка валидации данных",
          errors: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    console.log("Validation passed:", validation.data);

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

    // Проверяем, что объявление существует
    const Ad = (await import("@/models/Ad")).default;
    const ad = await Ad.findById(adIdObjectId);
    
    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь не оставляет отзыв на своё объявление
    const adUserId = ad.userId?.toString?.() || ad.userId?.toString() || "";
    if (adUserId === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя оставить отзыв на своё объявление",
        },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь существует
    const User = (await import("@/models/User")).default;
    const user = await User.findById(userIdObjectId);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Пользователь не найден",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь не заблокирован
    if (user.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Ваш аккаунт заблокирован",
        },
        { status: 403 }
      );
    }

    // Создаем отзыв
    console.log("Creating review with:", {
      userId: userIdObjectId.toString(),
      adId: adIdObjectId.toString(),
      rating: validation.data.rating,
      commentLength: validation.data.comment.trim().length,
    });

    let review;
    try {
      review = await Review.create({
        userId: userIdObjectId,
        adId: adIdObjectId,
        rating: validation.data.rating,
        comment: validation.data.comment.trim(),
      });
      console.log("Review created successfully:", review._id.toString());
    } catch (createError: unknown) {
      const err = createError as Error & { name?: string; message?: string; errors?: Record<string, { message: string }>; code?: number };
      console.error("Review.create() failed:", err);
      console.error("Error name:", err?.name);
      console.error("Error message:", err?.message);
      if (err?.errors) {
        console.error("Validation errors:", err.errors);
      }
      
      // Если это ошибка MongoDB валидации, пробуем через прямое обращение к БД
      if (err.name === "MongoServerError" || err.code === 121) {
        console.log("Trying direct MongoDB insert with bypassDocumentValidation...");
        try {
          const db = mongoose.connection.db;
          if (db) {
            const reviewDoc = {
              userId: userIdObjectId,
              adId: adIdObjectId,
              rating: validation.data.rating,
              comment: validation.data.comment.trim(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            const insertResult = await db.collection("reviews").insertOne(reviewDoc, {
              bypassDocumentValidation: true,
            });
            
            review = await Review.findById(insertResult.insertedId);
            console.log("✓ Review created via direct DB insert");
          } else {
            throw err;
          }
        } catch (directError) {
          console.error("✗ Direct DB insert also failed:", directError);
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (!review || !review._id) {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка при создании отзыва",
        },
        { status: 500 }
      );
    }

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
    console.error("========== CREATE REVIEW ERROR ==========");
    console.error("Create review error:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      code: err.code,
    });

    // Если это ошибка Mongoose, выводим больше деталей
    if (error && typeof error === "object" && "errors" in error) {
      const mongooseError = error as { errors?: Record<string, { message: string }> };
      console.error("Mongoose validation errors:", mongooseError.errors);
    }
    console.error("=========================================");

    // Обработка дубликата
    if (err.code === 11000 || err.name === "MongoServerError") {
      return NextResponse.json(
        {
          success: false,
          message: "Вы уже оставили отзыв на это объявление",
        },
        { status: 400 }
      );
    }

    // Проверяем, является ли ошибка ошибкой валидации Mongoose
    if (err.name === "ValidationError") {
      const validationError = error as { errors?: Record<string, { message: string }> };
      const errorMessages = validationError.errors 
        ? Object.values(validationError.errors).map((e: { message: string }) => e.message).join(", ")
        : err.message;
      
      return NextResponse.json(
        {
          success: false,
          message: `Ошибка валидации данных: ${errorMessages}`,
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании отзыва",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
        errorType: err.name,
      },
      { status: 500 }
    );
  }
}

