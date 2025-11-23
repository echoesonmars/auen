import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema, validate, formatValidationErrors } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Валидация данных
    const validation = validate(loginSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Поиск пользователя с паролем
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          errors: { email: "Неверный email или пароль" },
        },
        { status: 401 }
      );
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          errors: { password: "Неверный email или пароль" },
        },
        { status: 401 }
      );
    }

    // Успешный вход
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
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при входе",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

