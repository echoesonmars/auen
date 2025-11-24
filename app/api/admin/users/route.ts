import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

// Получение всех пользователей
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get("userId");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

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
          message: "Доступ запрещен. Только администраторы могут просматривать пользователей",
        },
        { status: 403 }
      );
    }

    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Получаем количество объявлений для каждого пользователя
    const usersWithAdsCount = await Promise.all(
      users.map(async (user) => {
        const adsCount = await Ad.countDocuments({ userId: user._id });
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role || "user",
          avatar: user.avatar || null,
          adsCount,
          createdAt: user.createdAt,
        };
      })
    );

    const total = await User.countDocuments();

    return NextResponse.json(
      {
        success: true,
        data: usersWithAdsCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get admin users error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении пользователей",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

