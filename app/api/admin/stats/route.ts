import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";
import Chat from "@/models/Chat";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

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
    const user = await User.findById(userId).select("role").lean();

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ запрещен",
        },
        { status: 403 }
      );
    }

    // Получаем статистику
    const [
      totalUsers,
      totalAds,
      pendingAds,
      activeAds,
      totalChats,
      recentUsers,
      recentAds,
    ] = await Promise.all([
      User.countDocuments(),
      Ad.countDocuments(),
      Ad.countDocuments({ status: "pending" }),
      Ad.countDocuments({ status: "active" }),
      Chat.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email createdAt").lean(),
      Ad.find().sort({ createdAt: -1 }).limit(5).populate("userId", "name").lean(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          stats: {
            totalUsers,
            totalAds,
            pendingAds,
            activeAds,
            totalChats,
          },
          recentUsers,
          recentAds: recentAds.map((ad) => ({
            id: ad._id.toString(),
            title: ad.title,
            status: ad.status,
            user: (ad.userId as { name?: string })?.name || "Неизвестно",
            createdAt: ad.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get admin stats error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении статистики",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

