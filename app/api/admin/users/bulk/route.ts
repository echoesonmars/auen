import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

// Массовые действия с пользователями
export async function POST(request: NextRequest) {
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
    const adminUser = await User.findById(userId).select("role").lean();

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ запрещен. Только администраторы могут выполнять массовые действия",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userIds } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимо указать действие и список ID пользователей",
        },
        { status: 400 }
      );
    }

    // Нельзя выполнять действия с самим собой
    if (userIds.includes(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя выполнять действия с самим собой",
        },
        { status: 400 }
      );
    }

    const mongoose = (await import("mongoose")).default;
    const userIdsObjectId = userIds.map((id: string) => new mongoose.Types.ObjectId(id));

    let result;
    let updatedCount = 0;

    switch (action) {
      case "block":
        result = await User.updateMany(
          { _id: { $in: userIdsObjectId } },
          { $set: { isBlocked: true } }
        );
        updatedCount = result.modifiedCount;
        break;

      case "unblock":
        result = await User.updateMany(
          { _id: { $in: userIdsObjectId } },
          { $set: { isBlocked: false } }
        );
        updatedCount = result.modifiedCount;
        break;

      case "delete":
        // Удаляем объявления пользователей
        await Ad.deleteMany({ userId: { $in: userIdsObjectId } });
        // Удаляем пользователей
        result = await User.deleteMany({ _id: { $in: userIdsObjectId } });
        updatedCount = result.deletedCount || 0;
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Некорректное действие",
          },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Успешно обработано ${updatedCount} пользователей`,
        data: {
          processed: updatedCount,
          total: userIds.length,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Bulk action error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при выполнении массового действия",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

