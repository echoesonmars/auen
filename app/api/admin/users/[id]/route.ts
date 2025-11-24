import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

// Обновление роли пользователя
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    // Проверяем права администратора
    const adminUser = await User.findById(userId).select("role").lean();

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ запрещен. Только администраторы могут изменять роли",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["user", "admin", "moderator"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректная роль",
        },
        { status: 400 }
      );
    }

    // Нельзя изменить роль самому себе
    if (id === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя изменить свою собственную роль",
        },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password").lean();

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
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "Роль пользователя обновлена",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update user role error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обновлении роли",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Удаление пользователя (только для админов)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    // Проверяем права администратора
    const adminUser = await User.findById(userId).select("role").lean();

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ запрещен. Только администраторы могут удалять пользователей",
        },
        { status: 403 }
      );
    }

    // Нельзя удалить самого себя
    if (id === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя удалить самого себя",
        },
        { status: 400 }
      );
    }

    // Удаляем все объявления пользователя
    await Ad.deleteMany({ userId: id });

    // Удаляем пользователя
    const user = await User.findByIdAndDelete(id);

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
        message: "Пользователь и все его объявления удалены",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete user error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при удалении пользователя",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

