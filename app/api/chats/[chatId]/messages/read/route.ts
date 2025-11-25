import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Chat from "@/models/Chat";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> | { chatId: string } }
) {
  try {
    await connectDB();

    // Обрабатываем params как Promise или обычный объект (Next.js 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const chatId = resolvedParams.chatId;

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

    // Валидация ObjectId
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID",
        },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь является участником чата
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.some((p: { toString: () => string }) => p.toString() === userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Чат не найден",
        },
        { status: 404 }
      );
    }

    // Помечаем все непрочитанные сообщения, где пользователь является получателем, как прочитанные
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const chatIdObj = new mongoose.Types.ObjectId(chatId);

    // Сначала проверяем, сколько непрочитанных сообщений есть
    const unreadBefore = await Message.countDocuments({
      chatId: chatIdObj,
      receiverId: userIdObj,
      read: false,
    });
    
    console.log(`Before marking: ${unreadBefore} unread messages in chat ${chatId} for user ${userId}`);

    let result;
    try {
      result = await Message.updateMany(
        {
          chatId: chatIdObj,
          receiverId: userIdObj,
          read: false,
        },
        {
          $set: { read: true },
        }
      );
      console.log(`✓ Marked ${result.modifiedCount} messages as read in chat ${chatId} (matched: ${result.matchedCount})`);
    } catch (updateError: unknown) {
      const updateErr = updateError as Error & { code?: number; name?: string };
      console.error("✗ Error marking messages as read via Mongoose:", updateErr);
      
      // Если Mongoose updateMany не работает, пробуем через прямое обращение к БД
      if (updateErr.name === "MongoServerError" || updateErr.code === 121) {
        console.log("Trying direct MongoDB update with bypassDocumentValidation...");
        try {
          const db = mongoose.connection.db;
          if (db) {
            const directResult = await db.collection("messages").updateMany(
              {
                chatId: chatIdObj,
                receiverId: userIdObj,
                read: false,
              },
              {
                $set: { read: true },
              },
              { bypassDocumentValidation: true }
            );
            result = { modifiedCount: directResult.modifiedCount, matchedCount: directResult.matchedCount };
            console.log(`✓ Marked ${result.modifiedCount} messages as read via direct DB update`);
          } else {
            throw updateErr;
          }
        } catch (directError) {
          console.error("✗ Direct DB update also failed:", directError);
          throw updateErr;
        }
      } else {
        throw updateErr;
      }
    }
    
    // Проверяем после пометки
    const unreadAfter = await Message.countDocuments({
      chatId: chatIdObj,
      receiverId: userIdObj,
      read: false,
    });
    
    console.log(`After marking: ${unreadAfter} unread messages remaining in chat ${chatId} for user ${userId}`);
    
    if (unreadAfter > 0 && result.modifiedCount > 0) {
      console.warn(`⚠ WARNING: ${unreadAfter} messages still unread after marking ${result.modifiedCount} as read!`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          markedCount: result.modifiedCount,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Mark messages as read error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при пометке сообщений как прочитанных",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

