import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema, validate, formatValidationErrors } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    // Подключение к БД
    try {
      await connectDB();
      console.log("Database connected successfully for login");
    } catch (dbError: unknown) {
      const dbErr = dbError as Error;
      console.error("Database connection error:", dbErr);
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка подключения к базе данных",
          error: process.env.NODE_ENV === "development" ? dbErr.message : undefined,
        },
        { status: 500 }
      );
    }

    // Парсинг тела запроса
    let body;
    try {
      body = await request.json();
    } catch (parseError: unknown) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат данных",
        },
        { status: 400 }
      );
    }

    // Валидация данных
    const validation = validate(loginSchema, body);

    if (!validation.success) {
      console.log("Validation failed:", validation.errors);
      return NextResponse.json(
        {
          success: false,
          errors: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    console.log("Attempting login for email:", email);

    // Поиск пользователя с паролем
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json(
        {
          success: false,
          errors: { email: "Неверный email или пароль" },
        },
        { status: 401 }
      );
    }

    // Проверка наличия пароля (для пользователей Google OAuth)
    if (!user.password) {
      console.log("User exists but has no password (Google OAuth user):", email);
      return NextResponse.json(
        {
          success: false,
          errors: { 
            email: "Этот аккаунт использует вход через Google. Войдите через Google или используйте другой email." 
          },
        },
        { status: 401 }
      );
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log("Invalid password for email:", email);
      return NextResponse.json(
        {
          success: false,
          errors: { password: "Неверный email или пароль" },
        },
        { status: 401 }
      );
    }

    // Успешный вход
    console.log("Login successful for user:", user._id.toString());
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    return NextResponse.json(
      {
        success: true,
        data: userResponse,
        message: "Успешный вход",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Login error:", err);
    console.error("Error stack:", err.stack);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при входе",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

