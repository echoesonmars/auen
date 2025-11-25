import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> | { chatId: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const chatId = resolvedParams.chatId;
    const userId = request.nextUrl.searchParams.get("userId");
    const action = request.nextUrl.searchParams.get("action"); // "clear" or "delete"

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID",
        },
        { status: 400 }
      );
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return NextResponse.json(
        {
          success: false,
          message: "Чат не найден",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является участником чата
    const isParticipant = chat.participants.some(
      (p: { toString: () => string }) => p.toString() === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        {
          success: false,
          message: "Нет доступа к этому чату",
        },
        { status: 403 }
      );
    }

    if (action === "clear") {
      // Очищаем все сообщения в чате
      const chatIdObj = new mongoose.Types.ObjectId(chatId);
      await Message.deleteMany({ chatId: chatIdObj });
      
      // Обновляем lastMessage и lastMessageAt
      chat.lastMessage = undefined;
      chat.lastMessageAt = undefined;
      await chat.save();

      return NextResponse.json({
        success: true,
        message: "Чат очищен",
      });
    } else {
      // Удаляем чат полностью
      const chatIdObj = new mongoose.Types.ObjectId(chatId);
      await Message.deleteMany({ chatId: chatIdObj });
      await Chat.findByIdAndDelete(chatId);

      return NextResponse.json({
        success: true,
        message: "Чат удален",
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete/Clear chat error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при удалении/очистке чата",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

