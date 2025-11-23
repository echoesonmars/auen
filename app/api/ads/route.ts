import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import { createAdSchema, validate, formatValidationErrors } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const jsonResponse = (data: any, status: number = 200) => {
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
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      return jsonResponse({
        success: false,
        message: "Ошибка подключения к базе данных",
        error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      }, 500);
    }

    // Парсинг тела запроса
    let body;
    try {
      body = await request.json();
      console.log("Received ad data:", { ...body, images: body.images?.length || 0 });
    } catch (parseError: any) {
      return jsonResponse({
        success: false,
        message: "Неверный формат данных",
        error: process.env.NODE_ENV === "development" ? parseError.message : undefined,
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

    // Создание объявления
    let ad;
    try {
      // Преобразуем userId в ObjectId
      const mongoose = (await import("mongoose")).default;
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      
      console.log("Creating ad with data:", { 
        title: validation.data.title,
        category: validation.data.category,
        description: validation.data.description?.substring(0, 50) + "...",
        price: validation.data.price,
        location: validation.data.location,
        userId: userIdObjectId,
        images: validation.data.images?.length || 0 
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
    } catch (createError: any) {
      console.error("Ad creation error:", createError);
      console.error("Error name:", createError.name);
      console.error("Error message:", createError.message);
      console.error("Error code:", createError.code);
      console.error("Error stack:", createError.stack);
      if (createError.errors) {
        console.error("Error details:", JSON.stringify(createError.errors, null, 2));
      }
      
      // Обработка ошибок валидации Mongoose
      if (createError.name === "ValidationError") {
        const mongooseErrors: Record<string, string> = {};
        if (createError.errors && typeof createError.errors === "object" && !Array.isArray(createError.errors)) {
          try {
            Object.keys(createError.errors).forEach((key) => {
              if (createError.errors && createError.errors[key] && createError.errors[key].message) {
                mongooseErrors[key] = createError.errors[key].message;
              }
            });
          } catch (forEachError: any) {
            console.error("Error processing validation errors:", forEachError);
            mongooseErrors.general = createError.message || "Ошибка валидации данных";
          }
        }
        if (Object.keys(mongooseErrors).length === 0) {
          mongooseErrors.general = createError.message || "Ошибка валидации данных";
        }
        return jsonResponse({
          success: false,
          errors: mongooseErrors,
          message: "Ошибка валидации данных",
        }, 400);
      }
      
      // Обработка ошибок валидации MongoDB
      if (createError.message?.includes("validation") || createError.message?.includes("Document failed validation") || createError.name === "MongoServerError") {
        return jsonResponse({
          success: false,
          message: "Ошибка валидации данных в базе данных",
          error: process.env.NODE_ENV === "development" ? createError.message : undefined,
        }, 400);
      }
      
      throw createError;
    }

    return jsonResponse({
      success: true,
      data: ad,
      message: "Объявление успешно создано",
    }, 201);
  } catch (error: any) {
    console.error("Create ad error:", error);
    console.error("Error stack:", error.stack);

    return jsonResponse({
      success: false,
      message: "Ошибка при создании объявления",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      errorDetails: process.env.NODE_ENV === "development" ? {
        name: error.name,
        code: error.code,
      } : undefined,
    }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: any = { status: "active" };

    if (category) {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const ads = await Ad.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
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
  } catch (error: any) {
    console.error("Get ads error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении объявлений",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

