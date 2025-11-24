import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Файлы не загружены",
        },
        { status: 400 }
      );
    }

    // Проверка количества файлов
    if (files.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Максимум 10 фотографий",
        },
        { status: 400 }
      );
    }

    // Создаем директорию для изображений объявлений, если её нет
    const uploadsDir = join(process.cwd(), "public", "uploads", "ads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Директория уже существует
    }

    const uploadedImages: string[] = [];

    // Загружаем каждый файл
    for (const file of files) {
      // Проверка типа файла
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        continue; // Пропускаем недопустимые файлы
      }

      // Проверка размера файла (максимум 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        continue; // Пропускаем слишком большие файлы
      }

      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split(".").pop() || "jpg";
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);

      // Сохраняем файл
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Путь для доступа через веб
      const imageUrl = `/uploads/ads/${fileName}`;
      uploadedImages.push(imageUrl);
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Не удалось загрузить изображения. Проверьте формат и размер файлов.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          images: uploadedImages,
        },
        message: "Изображения успешно загружены",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Image upload error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при загрузке изображений",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

