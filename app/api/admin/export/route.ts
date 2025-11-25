import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";
import Review from "@/models/Review";

export const dynamic = 'force-dynamic';

// Экспорт данных (для админов)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get("userId");
    const type = request.nextUrl.searchParams.get("type") || "all"; // all, users, ads, reviews

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
          message: "Доступ запрещен. Только администраторы могут экспортировать данные",
        },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};

    if (type === "all" || type === "users") {
      const users = await User.find().select("-password").lean();
      data.users = users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        isBlocked: user.isBlocked || false,
        createdAt: user.createdAt,
      }));
    }

    if (type === "all" || type === "ads") {
      const ads = await Ad.find().populate("userId", "name email").lean();
      data.ads = ads.map((ad) => ({
        id: ad._id.toString(),
        title: ad.title,
        category: ad.category,
        description: ad.description,
        price: ad.price,
        location: ad.location,
        images: ad.images || [],
        status: ad.status,
        views: ad.views || 0,
        userId: (ad.userId as { _id?: { toString: () => string } | string; name?: string; email?: string })?.name || "",
        userEmail: (ad.userId as { email?: string })?.email || "",
        createdAt: ad.createdAt,
      }));
    }

    if (type === "all" || type === "reviews") {
      const reviews = await Review.find()
        .populate("userId", "name email")
        .populate("adId", "title")
        .lean();
      data.reviews = reviews.map((review) => ({
        id: review._id.toString(),
        userId: {
          name: (review.userId as { name?: string })?.name || "",
          email: (review.userId as { email?: string })?.email || "",
        },
        adId: {
          title: (review.adId as { title?: string })?.title || "",
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      }));
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Export error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при экспорте данных",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

