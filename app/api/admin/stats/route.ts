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

    // Получаем расширенную статистику
    const [
      totalUsers,
      totalAds,
      pendingAds,
      activeAds,
      inactiveAds,
      rejectedAds,
      soldAds,
      totalChats,
      recentUsers,
      recentAds,
      adsByCategory,
      adsByLocation,
      usersByRole,
      adsLast7Days,
      usersLast7Days,
    ] = await Promise.all([
      User.countDocuments(),
      Ad.countDocuments(),
      Ad.countDocuments({ status: "pending" }),
      Ad.countDocuments({ status: "active" }),
      Ad.countDocuments({ status: "inactive" }),
      Ad.countDocuments({ status: "rejected" }),
      Ad.countDocuments({ status: "sold" }),
      Chat.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email createdAt").lean(),
      Ad.find().sort({ createdAt: -1 }).limit(5).populate("userId", "name").lean(),
      Ad.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ad.aggregate([
        { $group: { _id: "$location", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      Ad.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
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
            inactiveAds,
            rejectedAds,
            soldAds,
            totalChats,
          },
          analytics: {
            adsByCategory: adsByCategory.map((item) => ({
              category: item._id,
              count: item.count,
            })),
            adsByLocation: adsByLocation.map((item) => ({
              location: item._id,
              count: item.count,
            })),
            usersByRole: usersByRole.map((item) => ({
              role: item._id,
              count: item.count,
            })),
            adsLast7Days: adsLast7Days.map((item) => ({
              date: item._id,
              count: item.count,
            })),
            usersLast7Days: usersLast7Days.map((item) => ({
              date: item._id,
              count: item.count,
            })),
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

