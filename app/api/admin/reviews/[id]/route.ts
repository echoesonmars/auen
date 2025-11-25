import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Review from "@/models/Review";

export const dynamic = 'force-dynamic';

// Удаление отзыва (только для админов)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

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

    // Проверяем права администратора
    const adminUser = await User.findById(userId).select("role").lean();

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ запрещен. Только администраторы могут удалять отзывы",
        },
        { status: 403 }
      );
    }

    const review = await Review.findByIdAndDelete(id);

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
        message: "Отзыв удален",
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

