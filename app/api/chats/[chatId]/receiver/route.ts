import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    await connectDB();

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

    const chat = await Chat.findById(params.chatId).populate("participants", "_id");

    if (!chat) {
      return NextResponse.json(
        {
          success: false,
          message: "Чат не найден",
        },
        { status: 404 }
      );
    }

    // Находим другого участника
    const receiver = chat.participants.find(
      (p: any) => p._id.toString() !== userId
    );

    if (!receiver) {
      return NextResponse.json(
        {
          success: false,
          message: "Получатель не найден",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          receiverId: receiver._id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get receiver error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении получателя",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

