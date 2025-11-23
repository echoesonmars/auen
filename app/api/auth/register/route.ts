import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema, validate, formatValidationErrors } from "@/lib/validations";

interface RegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  data?: unknown;
  errorDetails?: unknown;
}

export async function POST(request: NextRequest) {
  // Убеждаемся, что всегда возвращаем JSON
  const jsonResponse = (data: RegisterResponse, status: number = 200) => {
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
      const dbErr = dbError as Error & { name?: string; code?: string };
      console.error("Database connection error:", dbError);
      console.error("Error details:", {
        message: dbErr.message,
        name: dbErr.name,
        code: dbErr.code,
      });
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
    } catch (parseError: unknown) {
      return jsonResponse({
        success: false,
        message: "Неверный формат данных",
        error: process.env.NODE_ENV === "development" && parseError instanceof Error ? parseError.message : undefined,
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

    const { name, email, phone: phoneRaw, password } = validation.data;
    let phone = phoneRaw;

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
    } catch (createError: unknown) {
      const error = createError as Error & { 
        name?: string; 
        code?: number; 
        errors?: Record<string, { message: string }>; 
        keyPattern?: Record<string, number> 
      };
      console.error("User creation error:", error);
      if (error.name) console.error("Error name:", error.name);
      if (error.message) console.error("Error message:", error.message);
      if (error.code) console.error("Error code:", error.code);
      console.error("Full error:", JSON.stringify(error, null, 2));
      
      // Обработка ошибок валидации Mongoose
      if (error.name === "ValidationError") {
        const mongooseErrors: Record<string, string> = {};
        if (error.errors && typeof error.errors === "object") {
          Object.keys(error.errors).forEach((key) => {
            if (error.errors && error.errors[key] && error.errors[key].message) {
              mongooseErrors[key] = error.errors[key].message;
            }
          });
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
      
      // Обработка ошибок валидации MongoDB (если валидации созданы вручную)
      if (error.message?.includes("validation") || error.message?.includes("Document failed validation") || error.name === "MongoServerError") {
        const mongoErrors: Record<string, string> = {};
        
        // Пытаемся извлечь детали ошибки
        if (error.errors && typeof error.errors === "object" && !Array.isArray(error.errors)) {
          Object.keys(error.errors).forEach((key) => {
            if (error.errors && error.errors[key] && error.errors[key].message) {
              mongoErrors[key] = error.errors[key].message;
            }
          });
        }
        
        // Если не удалось извлечь детали из errors, пробуем определить проблемное поле из сообщения
        if (Object.keys(mongoErrors).length === 0) {
          const errorMsg = error.message || "";
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
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        }, 400);
      }
      
      // Обработка ошибок MongoDB (дубликаты и т.д.)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "email";
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
  } catch (error: unknown) {
    const err = error as Error & { name?: string; code?: number };
    console.error("Registration error:", err);
    if (err.stack) console.error("Error stack:", err.stack);
    if (err.name) console.error("Error name:", err.name);
    if (err.code) console.error("Error code:", err.code);
    if (err.message) console.error("Error message:", err.message);

    // Обработка ошибок MongoDB
    if (err.code === 11000) {
      return jsonResponse({
        success: false,
        errors: { email: "Пользователь с таким email уже существует" },
      }, 400);
    }

    // Обработка ошибок валидации MongoDB (если валидации созданы вручную)
    if (err.name === "ValidationError" || err.message?.includes("validation")) {
      return jsonResponse({
        success: false,
        message: "Ошибка валидации данных",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      }, 400);
    }

    // Обработка ошибок подключения
    if (err.name === "MongoServerError" || err.name === "MongooseError") {
      return jsonResponse({
        success: false,
        message: "Ошибка базы данных",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      }, 500);
    }

    return jsonResponse({
      success: false,
      message: "Ошибка при регистрации",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
      errorDetails: process.env.NODE_ENV === "development" ? {
        name: err.name,
        code: err.code,
        stack: err.stack,
      } : undefined,
    }, 500);
  }
}

