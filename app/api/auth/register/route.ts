import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema, validate, formatValidationErrors } from "@/lib/validations";

export async function POST(request: NextRequest) {
  // Убеждаемся, что всегда возвращаем JSON
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
      console.error("Error details:", {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code,
      });
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
    } catch (parseError: any) {
      return jsonResponse({
        success: false,
        message: "Неверный формат данных",
        error: process.env.NODE_ENV === "development" ? parseError.message : undefined,
      }, 400);
    }

    // Валидация данных
    const validation = validate(registerSchema, body);

    if (!validation.success) {
      return jsonResponse({
        success: false,
        errors: formatValidationErrors(validation.errors),
      }, 400);
    }

    let { name, email, phone, password } = validation.data;

    // Нормализация телефона: убираем все пробелы, скобки, дефисы
    // Оставляем только цифры и знак +
    phone = phone.replace(/[\s\-\(\)]/g, "");
    if (!phone.startsWith("+")) {
      // Если нет +, добавляем для казахстанских номеров
      if (phone.startsWith("7")) {
        phone = "+" + phone;
      } else if (phone.startsWith("8")) {
        phone = "+7" + phone.substring(1);
      } else {
        phone = "+7" + phone;
      }
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return jsonResponse({
        success: false,
        errors: { email: "Пользователь с таким email уже существует" },
      }, 400);
    }

    // Создание пользователя
    let user;
    try {
      console.log("Creating user with data:", { name, email, phone, password: "***" });
      console.log("Phone after normalization:", phone);
      
      // Проверяем, что телефон соответствует паттерну MongoDB
      const phonePattern = /^\+?[1-9]\d{1,14}$/;
      if (!phonePattern.test(phone)) {
        return jsonResponse({
          success: false,
          errors: { phone: "Телефон должен быть в формате: +77771234567 (без пробелов и скобок)" },
        }, 400);
      }
      
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone,
        password,
      });
      console.log("User created successfully:", user._id);
    } catch (createError: any) {
      console.error("User creation error:", createError);
      console.error("Error name:", createError.name);
      console.error("Error message:", createError.message);
      console.error("Error code:", createError.code);
      console.error("Full error:", JSON.stringify(createError, null, 2));
      
      // Обработка ошибок валидации Mongoose
      if (createError.name === "ValidationError") {
        const mongooseErrors: Record<string, string> = {};
        if (createError.errors && typeof createError.errors === "object") {
          Object.keys(createError.errors).forEach((key) => {
            if (createError.errors[key] && createError.errors[key].message) {
              mongooseErrors[key] = createError.errors[key].message;
            }
          });
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
      
      // Обработка ошибок валидации MongoDB (если валидации созданы вручную)
      if (createError.message?.includes("validation") || createError.message?.includes("Document failed validation") || createError.name === "MongoServerError") {
        const mongoErrors: Record<string, string> = {};
        
        // Пытаемся извлечь детали ошибки
        if (createError.errors && typeof createError.errors === "object" && !Array.isArray(createError.errors)) {
          Object.keys(createError.errors).forEach((key) => {
            if (createError.errors[key] && createError.errors[key].message) {
              mongoErrors[key] = createError.errors[key].message;
            }
          });
        }
        
        // Если не удалось извлечь детали из errors, пробуем определить проблемное поле из сообщения
        if (Object.keys(mongoErrors).length === 0) {
          const errorMsg = createError.message || "";
          if (errorMsg.toLowerCase().includes("name") || errorMsg.includes("имя")) {
            mongoErrors.name = "Имя не соответствует требованиям валидации MongoDB";
          } else if (errorMsg.toLowerCase().includes("email")) {
            mongoErrors.email = "Email не соответствует требованиям валидации MongoDB";
          } else if (errorMsg.toLowerCase().includes("phone") || errorMsg.includes("телефон")) {
            mongoErrors.phone = "Телефон не соответствует требованиям валидации MongoDB. Формат: +77771234567";
          } else if (errorMsg.toLowerCase().includes("password") || errorMsg.includes("пароль")) {
            mongoErrors.password = "Пароль не соответствует требованиям валидации MongoDB";
          } else {
            mongoErrors.general = "Данные не прошли валидацию MongoDB. Проверьте формат всех полей.";
          }
        }
        
        return jsonResponse({
          success: false,
          errors: mongoErrors,
          message: "Ошибка валидации данных в базе данных",
          error: process.env.NODE_ENV === "development" ? createError.message : undefined,
        }, 400);
      }
      
      // Обработка ошибок MongoDB (дубликаты и т.д.)
      if (createError.code === 11000) {
        const field = Object.keys(createError.keyPattern || {})[0] || "email";
        return jsonResponse({
          success: false,
          errors: { [field]: `Пользователь с таким ${field === "email" ? "email" : field} уже существует` },
        }, 400);
      }
      
      throw createError; // Пробрасываем дальше для общей обработки
    }

    // Не возвращаем пароль
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
    };

    return jsonResponse({
      success: true,
      data: userResponse,
      message: "Пользователь успешно зарегистрирован",
    }, 201);
  } catch (error: any) {
    console.error("Registration error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    // Обработка ошибок MongoDB
    if (error.code === 11000) {
      return jsonResponse({
        success: false,
        errors: { email: "Пользователь с таким email уже существует" },
      }, 400);
    }

    // Обработка ошибок валидации MongoDB (если валидации созданы вручную)
    if (error.name === "ValidationError" || error.message?.includes("validation")) {
      return jsonResponse({
        success: false,
        message: "Ошибка валидации данных",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      }, 400);
    }

    // Обработка ошибок подключения
    if (error.name === "MongoServerError" || error.name === "MongooseError") {
      return jsonResponse({
        success: false,
        message: "Ошибка базы данных",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      }, 500);
    }

    return jsonResponse({
      success: false,
      message: "Ошибка при регистрации",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      errorDetails: process.env.NODE_ENV === "development" ? {
        name: error.name,
        code: error.code,
        stack: error.stack,
      } : undefined,
    }, 500);
  }
}

