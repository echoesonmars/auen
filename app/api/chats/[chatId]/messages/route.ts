import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
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

    // Проверяем, что пользователь является участником чата
    const chat = await Chat.findById(params.chatId);

    if (!chat || !chat.participants.some((p: { toString: () => string }) => p.toString() === userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Чат не найден",
        },
        { status: 404 }
      );
    }

    const messages = await Message.find({
      chatId: params.chatId,
    })
      .sort({ createdAt: 1 })
      .lean();

    const messagesData = messages.map((msg) => ({
      id: msg._id,
      text: msg.text,
      sender: msg.senderId.toString() === userId ? "me" : "other",
      time: new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: msg.read,
    }));

    return NextResponse.json(
      {
        success: true,
        data: messagesData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get messages error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении сообщений",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { text, senderId, receiverId } = body;

    if (!senderId || !receiverId || !text) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимы senderId, receiverId и text",
        },
        { status: 400 }
      );
    }

    const message = await Message.create({
      chatId: params.chatId,
      senderId,
      receiverId,
      text,
    });

    // Обновляем lastMessage в чате
    await Chat.findByIdAndUpdate(params.chatId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message._id,
          text: message.text,
          sender: "me",
          time: new Date(message.createdAt).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: false,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create message error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при отправке сообщения",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

