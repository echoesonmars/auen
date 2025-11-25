import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function GET(
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

    const User = (await import("@/models/User")).default;
    const chat = await Chat.findById(chatId).populate("participants", "_id name email avatar");

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
      (p: { _id: { toString: () => string } }) => p._id.toString() !== userId
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

    // Получаем полную информацию о получателе
    const receiverUser = await User.findById(receiver._id).select("name email avatar bio website instagram telegram vk youtube").lean();

    interface ReceiverData {
      _id: string | mongoose.Types.ObjectId;
      name?: string;
      email?: string;
      avatar?: string | null;
      bio?: string;
      website?: string;
      instagram?: string;
      telegram?: string;
      vk?: string;
      youtube?: string;
    }

    const receiverData: ReceiverData = receiverUser ? {
      _id: receiverUser._id,
      name: receiverUser.name,
      email: receiverUser.email,
      avatar: receiverUser.avatar || null,
      bio: receiverUser.bio,
      website: receiverUser.website,
      instagram: receiverUser.instagram,
      telegram: receiverUser.telegram,
      vk: receiverUser.vk,
      youtube: receiverUser.youtube,
    } : {
      _id: receiver._id,
      name: "Пользователь",
      email: "",
      avatar: null,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          receiverId: receiver._id.toString(),
          receiver: receiverData,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get receiver error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении получателя",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

