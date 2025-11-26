import { NextRequest, NextResponse } from "next/server";
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

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

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

    const skippedFiles: string[] = [];
    
    // Загружаем каждый файл
    for (const file of files) {
      // Проверка типа файла
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        skippedFiles.push(`${file.name} (недопустимый тип: ${file.type})`);
        continue; // Пропускаем недопустимые файлы
      }

      // Проверка размера файла (максимум 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        skippedFiles.push(`${file.name} (размер превышает 5MB)`);
        continue; // Пропускаем слишком большие файлы
      }

      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split(".").pop() || "jpg";
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;

      // Сохраняем файл
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      let imageUrl: string;

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
            folder: "auen/ads",
            public_id: fileName.replace(/\.[^/.]+$/, ""), // убираем расширение
            resource_type: "image",
            overwrite: false,
          });
          
          imageUrl = result.secure_url;
          console.log("Image uploaded to Cloudinary:", imageUrl);
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
          console.log("Image saved locally:", filePath);
          imageUrl = `/uploads/ads/${fileName}`;
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
          imageUrl = `/uploads/ads/${fileName}`;
        }
      }

      uploadedImages.push(imageUrl);
      console.log("Image URL added:", imageUrl);
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Не удалось загрузить изображения. Проверьте формат и размер файлов.",
          errors: skippedFiles.length > 0 ? { files: skippedFiles.join(", ") } : undefined,
        },
        { status: 400 }
      );
    }
    
    // Предупреждение, если некоторые файлы были пропущены
    const warning = skippedFiles.length > 0 
      ? `Загружено ${uploadedImages.length} из ${files.length} файлов. Пропущено: ${skippedFiles.join(", ")}`
      : undefined;

    return NextResponse.json(
      {
        success: true,
        data: {
          images: uploadedImages,
        },
        message: warning || "Изображения успешно загружены",
        warning: warning || undefined,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Image upload error:", err);
    console.error("Error stack:", err.stack);

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

