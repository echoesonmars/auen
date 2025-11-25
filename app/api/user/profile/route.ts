import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import {
  updateProfileSchema,
  validate,
  formatValidationErrors,
} from "@/lib/validations";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const userId = body.userId; // TODO: из сессии

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    // Валидация формата userId (должен быть валидный ObjectId)
    const mongoose = (await import("mongoose")).default;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректный формат ID пользователя",
          errors: { userId: "ID пользователя имеет неверный формат" },
        },
        { status: 400 }
      );
    }

    // Валидация
    const validation = validate(updateProfileSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: validation.data },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Пользователь не найден",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
        message: "Профиль успешно обновлен",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update profile error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обновлении профиля",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

