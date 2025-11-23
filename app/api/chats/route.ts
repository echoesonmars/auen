import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

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

