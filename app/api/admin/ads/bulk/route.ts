import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

// Массовые действия с объявлениями
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
    const { action, adIds, status } = body;

    if (!action || !adIds || !Array.isArray(adIds) || adIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимо указать действие и список ID объявлений",
        },
        { status: 400 }
      );
    }

    const mongoose = (await import("mongoose")).default;
    const adIdsObjectId = adIds.map((id: string) => new mongoose.Types.ObjectId(id));

    let result;
    let updatedCount = 0;

    switch (action) {
      case "approve":
        if (!status) {
          result = await Ad.updateMany(
            { _id: { $in: adIdsObjectId } },
            { $set: { status: "active" } }
          );
        } else {
          result = await Ad.updateMany(
            { _id: { $in: adIdsObjectId } },
            { $set: { status } }
          );
        }
        updatedCount = result.modifiedCount;
        break;

      case "reject":
        result = await Ad.updateMany(
          { _id: { $in: adIdsObjectId } },
          { $set: { status: "rejected" } }
        );
        updatedCount = result.modifiedCount;
        break;

      case "delete":
        result = await Ad.deleteMany({ _id: { $in: adIdsObjectId } });
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
        message: `Успешно обработано ${updatedCount} объявлений`,
        data: {
          processed: updatedCount,
          total: adIds.length,
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

