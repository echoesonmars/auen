import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v2 as cloudinary } from "cloudinary";

// Настройка Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let avatarUrl: string;

    // Используем Cloudinary, если настроен (в production на Vercel файловая система read-only)
    const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                         process.env.CLOUDINARY_API_KEY && 
                         process.env.CLOUDINARY_API_SECRET;
    
    if (useCloudinary) {
      try {
        // Конвертируем buffer в base64 для Cloudinary
        const base64Image = buffer.toString("base64");
        const dataUri = `data:${file.type};base64,${base64Image}`;
        
        // Загружаем в Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "auen/avatars",
          public_id: `${userId}-${timestamp}`,
          resource_type: "image",
          overwrite: true, // Перезаписываем старый аватар пользователя
        });
        
        avatarUrl = result.secure_url;
        console.log("Avatar uploaded to Cloudinary:", avatarUrl);
      } catch (cloudinaryError: unknown) {
        const err = cloudinaryError as Error;
        console.error("Cloudinary upload error:", err);
        throw new Error(`Ошибка загрузки в Cloudinary: ${err.message}`);
      }
    } else {
      // Локальное хранилище для development
      const filePath = join(uploadsDir, fileName);
      
      try {
        await writeFile(filePath, buffer);
        avatarUrl = `/uploads/avatars/${fileName}`;
      } catch (writeError: unknown) {
        const err = writeError as Error;
        console.error("Error writing file:", err);
        
        // Если Cloudinary не настроен и файл не сохранился, возвращаем ошибку
        if (!useCloudinary) {
          const isVercel = process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_URL;
          const errorMessage = isVercel 
            ? "Файловая система недоступна на Vercel. Пожалуйста, настройте Cloudinary: добавьте переменные окружения CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY и CLOUDINARY_API_SECRET в настройках проекта Vercel."
            : "Не удалось сохранить файл. Проверьте права доступа к файловой системе.";
          throw new Error(errorMessage);
        }
        
        // Если Cloudinary настроен, но мы пытались сохранить локально, пробуем Cloudinary
        avatarUrl = `/uploads/avatars/${fileName}`;
      }
    }

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

