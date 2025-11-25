import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const file = formData.get("avatar") as File;

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

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "Файл не загружен",
        },
        { status: 400 }
      );
    }

    // Проверка типа файла
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Недопустимый тип файла. Разрешены: JPEG, PNG, WebP",
        },
        { status: 400 }
      );
    }

    // Проверка размера файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Размер файла не должен превышать 5MB",
        },
        { status: 400 }
      );
    }

    // Создаем директорию для аватаров, если её нет
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Директория уже существует
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Путь для доступа через веб
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Обновляем пользователя в БД
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatarUrl } },
      { new: true }
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
          avatar: user.avatar,
        },
        message: "Аватар успешно загружен",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Avatar upload error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при загрузке аватара",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

