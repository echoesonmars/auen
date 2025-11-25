import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

// Получение всех объявлений с фильтрацией
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get("userId");
    const status = request.nextUrl.searchParams.get("status");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const search = request.nextUrl.searchParams.get("search");

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

    // Формируем запрос
    const query: Record<string, unknown> = {};
    if (status && status !== "all") {
      query.status = status;
    }

    // Поиск по названию, категории, локации
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const ads = await Ad.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Ad.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: ads.map((ad) => ({
          id: ad._id.toString(),
          title: ad.title,
          category: ad.category,
          price: ad.price,
          location: ad.location,
          status: ad.status,
          views: ad.views,
          featured: ad.featured || false,
          user: {
            id: (ad.userId as { _id: { toString: () => string } })._id.toString(),
            name: (ad.userId as { name?: string })?.name || "Неизвестно",
            email: (ad.userId as { email?: string })?.email || "",
          },
          createdAt: ad.createdAt,
        })),
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
    console.error("Get admin ads error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении объявлений",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

