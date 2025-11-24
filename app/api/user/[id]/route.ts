import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    // Обрабатываем params как Promise или обычный объект
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Пользователь не найден",
        },
        { status: 404 }
      );
    }

    // Получаем объявления пользователя
    const ads = await Ad.find({ userId: id, status: "active" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          ads,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get user profile error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении профиля пользователя",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

