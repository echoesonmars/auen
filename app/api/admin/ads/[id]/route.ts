import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

// Обновление статуса объявления (модерация)
export async function PATCH(
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

    const body = await request.json();
    const { status } = body;

    if (!status || !["active", "inactive", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный статус",
        },
        { status: 400 }
      );
    }

    const ad = await Ad.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("userId", "name email").lean();

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: ad._id.toString(),
          title: ad.title,
          status: ad.status,
        },
        message: "Статус объявления обновлен",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update ad status error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обновлении статуса",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Удаление объявления
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
    const user = await User.findById(userId).select("role").lean();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ запрещен. Только администраторы могут удалять объявления",
        },
        { status: 403 }
      );
    }

    const ad = await Ad.findByIdAndDelete(id);

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Объявление удалено",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete ad error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при удалении объявления",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

