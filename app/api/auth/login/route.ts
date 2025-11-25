import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema, validate, formatValidationErrors } from "@/lib/validations";

export async function POST(request: NextRequest) {
  // Убеждаемся, что всегда возвращаем JSON
  const jsonResponse = (data: { success: boolean; message?: string; error?: string; errors?: Record<string, string>; data?: unknown; stack?: string }, status: number = 200) => {
    return NextResponse.json(data, { 
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    console.log("Login API called");
    // Подключение к БД
    try {
      console.log("Connecting to DB...");
      await connectDB();
      console.log("DB connected");
    } catch (dbError: unknown) {
      const dbErr = dbError as Error;
      console.error("Database connection error:", dbError);
      return jsonResponse({
        success: false,
        message: "Ошибка подключения к базе данных",
        error: process.env.NODE_ENV === "development" ? dbErr.message : undefined,
      }, 500);
    }

    // Парсинг тела запроса
    let body;
    try {
      console.log("Parsing request body...");
      body = await request.json();
      console.log("Body parsed:", { email: body.email, hasPassword: !!body.password });
    } catch (parseError: unknown) {
      console.error("Parse error:", parseError);
      return jsonResponse({
        success: false,
        message: "Неверный формат данных",
        error: process.env.NODE_ENV === "development" && parseError instanceof Error ? parseError.message : undefined,
      }, 400);
    }

    // Валидация данных
    console.log("Validating data...");
    let validation;
    try {
      validation = validate(loginSchema, body);
      console.log("Validation result:", validation.success);
    } catch (validationError: unknown) {
      const valErr = validationError as Error;
      console.error("Validation error:", valErr);
      return jsonResponse({
        success: false,
        message: "Ошибка валидации",
        error: valErr.message,
      }, 400);
    }

    if (!validation.success) {
      return jsonResponse({
        success: false,
        errors: formatValidationErrors(validation.errors),
      }, 400);
    }

    const { email, password } = validation.data;

    // Поиск пользователя с паролем
    let user;
    try {
      console.log("Searching for user with email:", email);
      user = await User.findOne({ email }).select("+password");
      console.log("User found:", user ? "yes" : "no");
      if (user) {
        console.log("User has password:", !!user.password);
        console.log("User isBlocked:", user.isBlocked);
        console.log("User _id:", user._id);
      }
    } catch (findError: unknown) {
      const findErr = findError as Error;
      if (process.env.NODE_ENV === "development") {
        console.error("Error finding user:", findErr);
      }
      return jsonResponse({
        success: false,
        message: "Ошибка при поиске пользователя",
        error: process.env.NODE_ENV === "development" ? findErr.message : undefined,
      }, 500);
    }

    if (!user) {
      return jsonResponse({
        success: false,
        errors: { email: "Неверный email или пароль" },
      }, 401);
    }

    // Проверка блокировки
    if (user.isBlocked) {
      return jsonResponse({
        success: false,
        errors: { email: "Ваш аккаунт заблокирован. Обратитесь к администратору." },
      }, 403);
    }

    // Проверка наличия пароля (для пользователей Google OAuth)
    if (!user.password) {
      return jsonResponse({
        success: false,
        errors: { 
          email: "Этот аккаунт использует вход через Google. Войдите через Google или используйте другой email." 
        },
      }, 401);
    }

    // Проверка пароля
    if (typeof user.comparePassword !== "function") {
      console.error("comparePassword method is not a function on user object");
      console.error("User object keys:", Object.keys(user));
      console.error("User object:", JSON.stringify(user, null, 2));
      return jsonResponse({
        success: false,
        message: "Ошибка: метод сравнения пароля не найден",
        error: "comparePassword is not a function",
      }, 500);
    }

    let isPasswordValid = false;
    try {
      console.log("Comparing password...");
      isPasswordValid = await user.comparePassword(password);
      console.log("Password valid:", isPasswordValid);
    } catch (compareError: unknown) {
      const compareErr = compareError as Error;
      if (process.env.NODE_ENV === "development") {
        console.error("Error comparing password:", compareErr);
        console.error("Error stack:", compareErr.stack);
      }
      return jsonResponse({
        success: false,
        message: "Ошибка при проверке пароля",
        error: process.env.NODE_ENV === "development" ? compareErr.message : undefined,
        stack: process.env.NODE_ENV === "development" ? compareErr.stack : undefined,
      }, 500);
    }

    if (!isPasswordValid) {
      return jsonResponse({
        success: false,
        errors: { password: "Неверный email или пароль" },
      }, 401);
    }

    // Успешный вход
    if (!user._id) {
      console.error("User _id is missing:", user);
      return jsonResponse({
        success: false,
        message: "Ошибка: отсутствует ID пользователя",
      }, 500);
    }

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
    };

    // Создаем response с данными пользователя
    const response = jsonResponse({
      success: true,
      data: userResponse,
      message: "Успешный вход",
    }, 200);

    // Устанавливаем cookies для middleware (опционально, для совместимости)
    // Также устанавливаем httpOnly: false, чтобы клиент мог их читать
    response.cookies.set("auth_token", "authenticated", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    response.cookies.set("userId", user._id.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return response;
  } catch (error: unknown) {
    const err = error as Error;
    
    // Логируем ошибку для отладки (всегда)
    console.error("=== LOGIN ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error name:", err.name);
    console.error("Error stack:", err.stack);
    if (err instanceof Error) {
      console.error("Full error:", err);
    }

    return jsonResponse({
      success: false,
      message: "Ошибка при входе",
      error: err.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    }, 500);
  }
}

