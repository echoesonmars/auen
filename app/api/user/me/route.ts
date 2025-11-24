import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // TODO: Получить userId из сессии/токена
    // Временно используем query параметр для тестирования
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

    const user = await User.findById(userId).select("-password");

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
    const ads = await Ad.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            createdAt: user.createdAt,
          },
          ads: ads.map((ad) => ({
            id: ad._id.toString(),
            title: ad.title,
            category: ad.category,
            price: ad.price,
            status: ad.status,
            views: ad.views,
            createdAt: ad.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get user error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении данных пользователя",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

