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
      phone?: string;
      bio?: string;
      website?: string;
      instagram?: string;
      telegram?: string;
      vk?: string;
      youtube?: string;
    }
    
    const updateData: UpdateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone === null ? null : body.phone;
    if (body.bio !== undefined) updateData.bio = body.bio === null ? null : body.bio;
    if (body.website !== undefined) updateData.website = body.website === null ? null : body.website;
    if (body.instagram !== undefined) updateData.instagram = body.instagram === null ? null : body.instagram;
    if (body.telegram !== undefined) updateData.telegram = body.telegram === null ? null : body.telegram;
    if (body.vk !== undefined) updateData.vk = body.vk === null ? null : body.vk;
    if (body.youtube !== undefined) updateData.youtube = body.youtube === null ? null : body.youtube;

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

