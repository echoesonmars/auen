import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "published";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query: Record<string, unknown> = { status };

    if (category && category !== "all") {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(query)
      .populate("authorId", "name email avatar")
      .select("title excerpt category image readTime views status createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Blog.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get blogs error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при загрузке блогов",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, excerpt, content, authorId, category, image, readTime } = body;

    if (!title || !excerpt || !content || !authorId || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимы все обязательные поля",
        },
        { status: 400 }
      );
    }

    // Вычисляем время чтения на основе длины контента (примерно 200 слов в минуту)
    const wordCount = content.split(/\s+/).length;
    const calculatedReadTime = readTime || Math.max(1, Math.ceil(wordCount / 200));

    const blog = await Blog.create({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      authorId,
      category,
      image: image || null,
      readTime: calculatedReadTime,
      status: "draft",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Блог успешно создан",
        data: blog,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create blog error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании блога",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

