import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import { updateReviewSchema, validate, formatValidationErrors } from "@/lib/validations";

export const dynamic = 'force-dynamic';

// Получить конкретный отзыв
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const reviewId = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный формат ID отзыва",
        },
        { status: 400 }
      );
    }

    const review = await Review.findById(reviewId)
      .populate("userId", "name email avatar")
      .populate("adId", "title")
      .lean();

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Отзыв не найден",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: review,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get review error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении отзыва",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Обновить отзыв
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const reviewId = resolvedParams.id;
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

    if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный формат ID",
        },
        { status: 400 }
      );
    }

    // Находим отзыв
    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Отзыв не найден",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является автором отзыва
    if (review.userId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Вы можете редактировать только свои отзывы",
        },
        { status: 403 }
      );
    }

    // Валидация данных
    const validation = validate(updateReviewSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка валидации данных",
          errors: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    // Обновляем только переданные поля
    if (validation.data.rating !== undefined) {
      review.rating = validation.data.rating;
    }
    if (validation.data.comment !== undefined) {
      review.comment = validation.data.comment.trim();
    }

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate("userId", "name email avatar")
      .populate("adId", "title")
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: updatedReview,
        message: "Отзыв успешно обновлен",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error & { name?: string; code?: number };
    console.error("Update review error:", err);

    if (err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка валидации данных",
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обновлении отзыва",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Удалить отзыв
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const reviewId = resolvedParams.id;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный формат ID",
        },
        { status: 400 }
      );
    }

    // Находим отзыв
    const review = await Review.findById(reviewId);

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "Отзыв не найден",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является автором отзыва или админом
    const User = (await import("@/models/User")).default;
    const user = await User.findById(userId).select("role").lean();
    
    if (review.userId.toString() !== userId && user?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Вы можете удалять только свои отзывы",
        },
        { status: 403 }
      );
    }

    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json(
      {
        success: true,
        message: "Отзыв успешно удален",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete review error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при удалении отзыва",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

