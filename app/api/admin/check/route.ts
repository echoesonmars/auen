import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

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

    const user = await User.findById(userId).select("role").lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Пользователь не найден",
        },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "admin" || user.role === "moderator";

    return NextResponse.json(
      {
        success: true,
        data: {
          isAdmin,
          role: user.role || "user",
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Check admin error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при проверке прав",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

