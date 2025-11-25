import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import { createAdSchema, validate, formatValidationErrors } from "@/lib/validations";

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  data?: unknown;
  errorDetails?: unknown;
}

export async function POST(request: NextRequest) {
  const jsonResponse = (data: ApiResponse, status: number = 200) => {
    return NextResponse.json(data, { 
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    // Подключение к БД
    try {
      await connectDB();
      console.log("Database connected successfully");
    } catch (dbError: unknown) {
      console.error("Database connection error:", dbError);
      return jsonResponse({
        success: false,
        message: "Ошибка подключения к базе данных",
        error: process.env.NODE_ENV === "development" && dbError instanceof Error ? dbError.message : undefined,
      }, 500);
    }

    // Парсинг тела запроса
    let body;
    try {
      body = await request.json();
      console.log("Received ad data:", { ...body, images: body.images?.length || 0 });
    } catch (parseError: unknown) {
      return jsonResponse({
        success: false,
        message: "Неверный формат данных",
        error: process.env.NODE_ENV === "development" && parseError instanceof Error ? parseError.message : undefined,
      }, 400);
    }

    // Валидация данных
    const validation = validate(createAdSchema, body);

    if (!validation.success) {
      return jsonResponse({
        success: false,
        errors: formatValidationErrors(validation.errors),
      }, 400);
    }

    // Получение userId
    const userId = body.userId;

    if (!userId) {
      return jsonResponse({
        success: false,
        message: "Необходима авторизация",
      }, 401);
    }

    // Валидация формата userId (должен быть валидный ObjectId)
    const mongoose = (await import("mongoose")).default;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return jsonResponse({
        success: false,
        message: "Некорректный формат ID пользователя",
        errors: { userId: "ID пользователя имеет неверный формат" },
      }, 400);
    }

    // Создание объявления
    let ad;
    try {
      // Преобразуем userId в ObjectId
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      
      console.log("Creating ad with data:", { 
        title: validation.data.title,
        category: validation.data.category,
        description: validation.data.description?.substring(0, 50) + "...",
        price: validation.data.price,
        location: validation.data.location,
        userId: userIdObjectId,
        images: validation.data.images?.length || 0,
        imagesArray: validation.data.images || []
      });
      
      ad = await Ad.create({
        title: validation.data.title.trim(),
        category: validation.data.category,
        description: validation.data.description.trim(),
        price: validation.data.price.trim(),
        location: validation.data.location.trim(),
        userId: userIdObjectId,
        images: validation.data.images || [], // Убеждаемся, что images - это массив
      });
      
      console.log("Ad created successfully:", ad._id);
      console.log("Ad images saved in DB:", ad.images);
      console.log("Number of images:", ad.images?.length || 0);
    } catch (createError: unknown) {
      const error = createError as Error & { name?: string; code?: string; errors?: Record<string, { message: string }> };
      console.error("Ad creation error:", error);
      if (error.name) console.error("Error name:", error.name);
      if (error.message) console.error("Error message:", error.message);
      if (error.code) console.error("Error code:", error.code);
      if (error.stack) console.error("Error stack:", error.stack);
      if (error.errors) {
        console.error("Error details:", JSON.stringify(error.errors, null, 2));
      }
      
      // Обработка ошибок валидации Mongoose
      if (error.name === "ValidationError") {
        const mongooseErrors: Record<string, string> = {};
        if (error.errors && typeof error.errors === "object" && !Array.isArray(error.errors)) {
          try {
            Object.keys(error.errors).forEach((key) => {
              if (error.errors && error.errors[key] && error.errors[key].message) {
                mongooseErrors[key] = error.errors[key].message;
              }
            });
          } catch (forEachError: unknown) {
            console.error("Error processing validation errors:", forEachError);
            mongooseErrors.general = error.message || "Ошибка валидации данных";
          }
        }
        if (Object.keys(mongooseErrors).length === 0) {
          mongooseErrors.general = error.message || "Ошибка валидации данных";
        }
        return jsonResponse({
          success: false,
          errors: mongooseErrors,
          message: "Ошибка валидации данных",
        }, 400);
      }
      
      // Обработка ошибок валидации MongoDB
      if (error.message?.includes("validation") || error.message?.includes("Document failed validation") || error.name === "MongoServerError") {
        return jsonResponse({
          success: false,
          message: "Ошибка валидации данных в базе данных",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        }, 400);
      }
      
      throw createError;
    }

    return jsonResponse({
      success: true,
      data: ad,
      message: "Объявление успешно создано",
    }, 201);
  } catch (error: unknown) {
    const err = error as Error & { name?: string; code?: string };
    console.error("Create ad error:", err);
    if (err.stack) console.error("Error stack:", err.stack);

    return jsonResponse({
      success: false,
      message: "Ошибка при создании объявления",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
      errorDetails: process.env.NODE_ENV === "development" ? {
        name: err.name,
        code: err.code,
      } : undefined,
    }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Подключение к БД с обработкой ошибок
    try {
      await connectDB();
    } catch (dbError: unknown) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка подключения к базе данных",
          error: process.env.NODE_ENV === "development" && dbError instanceof Error ? dbError.message : undefined,
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: Record<string, unknown> = { status: "active" };

    if (category) {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (featured === "true") {
      query.featured = true;
    }

    const skip = (page - 1) * limit;

    const sortOrder = featured === "true" 
      ? { featured: -1, createdAt: -1 } 
      : { createdAt: -1 };

    const ads = await Ad.find(query)
      .populate("userId", "name email phone")
      .select("title category description price location images views userId createdAt status featured")
      .sort(sortOrder as Record<string, 1 | -1>)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Ad.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: ads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get ads error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении объявлений",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

