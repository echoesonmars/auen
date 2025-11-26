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

    // Обновляем только переданные поля
    interface UpdateData {
      name?: string;
      email?: string;
      phone?: string | null;
      bio?: string | null;
      website?: string | null;
      instagram?: string | null;
      telegram?: string | null;
      vk?: string | null;
      youtube?: string | null;
    }
    
    // Преобразуем пустые строки в null для опциональных полей
    const normalizeValue = (value: unknown): string | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null || value === '') return null;
      return String(value).trim() || null;
    };
    
    const updateData: UpdateData = {};
    if (body.name !== undefined) updateData.name = normalizeValue(body.name) as string | undefined;
    if (body.email !== undefined) updateData.email = normalizeValue(body.email) as string | undefined;
    if (body.phone !== undefined) updateData.phone = normalizeValue(body.phone) as string | null | undefined;
    if (body.bio !== undefined) updateData.bio = normalizeValue(body.bio) as string | null | undefined;
    if (body.website !== undefined) updateData.website = normalizeValue(body.website) as string | null | undefined;
    if (body.instagram !== undefined) updateData.instagram = normalizeValue(body.instagram) as string | null | undefined;
    if (body.telegram !== undefined) updateData.telegram = normalizeValue(body.telegram) as string | null | undefined;
    if (body.vk !== undefined) updateData.vk = normalizeValue(body.vk) as string | null | undefined;
    if (body.youtube !== undefined) updateData.youtube = normalizeValue(body.youtube) as string | null | undefined;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
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
          bio: user.bio,
          website: user.website,
          instagram: user.instagram,
          telegram: user.telegram,
          vk: user.vk,
          youtube: user.youtube,
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

