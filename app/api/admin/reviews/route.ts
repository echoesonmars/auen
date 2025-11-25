import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Review from "@/models/Review";

export const dynamic = 'force-dynamic';

// Получить все отзывы (для админа)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get("userId");
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

    let query: Record<string, unknown> = {};

    // Поиск по тексту отзыва
    if (search) {
      query = {
        $or: [
          { comment: { $regex: search, $options: "i" } },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("userId", "name email avatar")
        .populate("adId", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: reviews.map((review) => {
          const userIdObj = review.userId as { _id?: { toString: () => string } | string; name?: string; email?: string; avatar?: string };
          const adIdObj = review.adId as { _id?: { toString: () => string } | string; title?: string };
          
          return {
            id: review._id.toString(),
            userId: {
              id: typeof userIdObj._id === 'object' ? userIdObj._id.toString() : userIdObj._id || "",
              name: userIdObj.name || "",
              email: userIdObj.email || "",
              avatar: userIdObj.avatar || null,
            },
            adId: {
              id: typeof adIdObj._id === 'object' ? adIdObj._id.toString() : adIdObj._id || "",
              title: adIdObj.title || "",
            },
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          };
        }),
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

