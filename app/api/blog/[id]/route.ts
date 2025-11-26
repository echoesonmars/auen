import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID",
        },
        { status: 400 }
      );
    }

    const blog = await Blog.findById(id)
      .populate("authorId", "name email avatar")
      .lean();

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Блог не найден",
        },
        { status: 404 }
      );
    }

    // Увеличиваем количество просмотров
    await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return NextResponse.json({
      success: true,
      data: blog,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get blog error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при загрузке блога",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { title, excerpt, content, category, image, readTime, status, authorId } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID",
        },
        { status: 400 }
      );
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Блог не найден",
        },
        { status: 404 }
      );
    }

    // Проверяем права доступа (только автор может редактировать)
    if (blog.authorId.toString() !== authorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нет доступа к редактированию этого блога",
        },
        { status: 403 }
      );
    }

    // Обновляем поля
    if (title) blog.title = title.trim();
    if (excerpt) blog.excerpt = excerpt.trim();
    if (content) {
      blog.content = content.trim();
      // Пересчитываем время чтения
      const wordCount = content.split(/\s+/).length;
      blog.readTime = readTime || Math.max(1, Math.ceil(wordCount / 200));
    }
    if (category) blog.category = category;
    if (image !== undefined) blog.image = image || null;
    if (status) blog.status = status;

    await blog.save();

    return NextResponse.json({
      success: true,
      message: "Блог успешно обновлен",
      data: blog,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update blog error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обновлении блога",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Блог не найден",
        },
        { status: 404 }
      );
    }

    // Проверяем права доступа (только автор может удалить)
    if (blog.authorId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нет доступа к удалению этого блога",
        },
        { status: 403 }
      );
    }

    await Blog.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Блог успешно удален",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete blog error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при удалении блога",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

