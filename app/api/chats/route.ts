import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import User from "@/models/User";

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
          (p: any) => p._id.toString() !== userId
        );

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
  } catch (error: any) {
    console.error("Get chats error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении чатов",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

