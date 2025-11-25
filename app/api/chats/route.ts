import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Находим все чаты, где пользователь является участником
    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "name email")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 })
      .lean();

    // Формируем ответ с данными для UI
    const chatsData = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipant = chat.participants.find(
          (p: { _id: { toString: () => string }; name?: string; email?: string }) => p._id.toString() !== userId
        ) as { _id: { toString: () => string }; name?: string; email?: string } | undefined;

        // Подсчитываем непрочитанные сообщения
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          receiverId: userId,
          read: false,
        });

        // Получаем последнее сообщение
        const lastMessage = await Message.findOne({
          chatId: chat._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: chat._id,
          name: otherParticipant?.name || "Пользователь",
          avatar: "👤",
          lastMessage: lastMessage?.text || "",
          time: lastMessage?.createdAt
            ? new Date(lastMessage.createdAt).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          unread: unreadCount,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: chatsData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get chats error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении чатов",
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
    const { userId, receiverId } = body;

    if (!userId || !receiverId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимо указать userId и receiverId",
        },
        { status: 400 }
      );
    }

    if (userId === receiverId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя создать чат с самим собой",
        },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже чат между этими пользователями
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
    }).lean();

    if (existingChat) {
      return NextResponse.json(
        {
          success: true,
          data: {
            chatId: existingChat._id.toString(),
            exists: true,
          },
        },
        { status: 200 }
      );
    }

    // Создаем новый чат
    const newChat = await Chat.create({
      participants: [userId, receiverId],
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          chatId: newChat._id.toString(),
          exists: false,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create chat error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании чата",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

