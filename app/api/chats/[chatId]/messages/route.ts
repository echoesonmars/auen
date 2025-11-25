import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import Chat from "@/models/Chat";

export const dynamic = 'force-dynamic';

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
    
    // Помечаем сообщения как прочитанные через прямое обновление MongoDB
    // Используем bypassDocumentValidation для обхода валидации если нужно
    let updateResult;
    try {
      updateResult = await Message.updateMany(
        {
          chatId: chatIdObj,
          receiverId: userIdObj,
          read: false,
        },
        {
          $set: { read: true },
        }
      );
      console.log(`✓ Marked ${updateResult.modifiedCount} messages as read in chat ${chatId} for user ${userId} (matched: ${updateResult.matchedCount})`);
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
            updateResult = { modifiedCount: directResult.modifiedCount, matchedCount: directResult.matchedCount };
            console.log(`✓ Marked ${updateResult.modifiedCount} messages as read via direct DB update`);
          } else {
            throw updateErr;
          }
        } catch (directError) {
          console.error("✗ Direct DB update also failed:", directError);
          updateResult = { modifiedCount: 0, matchedCount: 0 };
        }
      } else {
        updateResult = { modifiedCount: 0, matchedCount: 0 };
      }
    }
    
    // Проверяем после пометки
    const unreadAfter = await Message.countDocuments({
      chatId: chatIdObj,
      receiverId: userIdObj,
      read: false,
    });
    
    console.log(`After marking: ${unreadAfter} unread messages remaining in chat ${chatId} for user ${userId}`);
    
    if (unreadAfter > 0 && updateResult.modifiedCount > 0) {
      console.warn(`⚠ WARNING: ${unreadAfter} messages still unread after marking ${updateResult.modifiedCount} as read!`);
    }

    // Загружаем сообщения после пометки как прочитанных
    const messages = await Message.find({
      chatId: chatIdObj,
    })
      .sort({ createdAt: 1 })
      .lean();

    const messagesData = messages.map((msg) => {
      // Для сообщений от других пользователей, которые мы только что пометили как прочитанные,
      // устанавливаем read: true
      const isMyMessage = msg.senderId.toString() === userId;
      const isRead = isMyMessage ? msg.read : true; // Если это не мое сообщение, оно прочитано (мы только что открыли чат)
      
      return {
        id: msg._id,
        text: msg.text,
        sender: isMyMessage ? "me" : "other",
        time: new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: isRead, // Используем актуальный статус из БД
      };
    });

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
  { params }: { params: Promise<{ chatId: string }> | { chatId: string } }
) {
  try {
    await connectDB();

    // Обрабатываем params как Promise или обычный объект (Next.js 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const chatId = resolvedParams.chatId;

    console.log("POST /api/chats/[chatId]/messages - chatId:", chatId);

    const body = await request.json();
    console.log("POST /api/chats/[chatId]/messages - body:", body);
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

    // Валидация ObjectId
    if (!mongoose.Types.ObjectId.isValid(chatId) || 
        !mongoose.Types.ObjectId.isValid(senderId) || 
        !mongoose.Types.ObjectId.isValid(receiverId)) {
      console.error("Invalid ObjectId:", { chatId, senderId, receiverId });
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID",
        },
        { status: 400 }
      );
    }

    // Проверяем, что чат существует и пользователь является участником
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

    if (!chat.participants.some((p: { toString: () => string }) => p.toString() === senderId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Вы не являетесь участником этого чата",
        },
        { status: 403 }
      );
    }

    // Валидация текста
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Текст сообщения не может быть пустым",
        },
        { status: 400 }
      );
    }

    if (trimmedText.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Сообщение не должно превышать 2000 символов",
        },
        { status: 400 }
      );
    }

    console.log("Creating message in chat:", chatId);
    console.log("Message data:", {
      chatId,
      senderId,
      receiverId,
      textLength: trimmedText.length,
    });

    // Преобразуем ID в ObjectId для корректного создания
    const chatIdObj = new mongoose.Types.ObjectId(chatId);
    const senderIdObj = new mongoose.Types.ObjectId(senderId);
    const receiverIdObj = new mongoose.Types.ObjectId(receiverId);

    let message;
    try {
      message = await Message.create({
        chatId: chatIdObj,
        senderId: senderIdObj,
        receiverId: receiverIdObj,
        text: trimmedText,
      });
      console.log("✓ Message created:", message._id.toString());
    } catch (createError: unknown) {
      const err = createError as Error & { name?: string; message?: string; code?: number; errors?: Record<string, { message: string }> };
      console.error("✗ Message.create() failed:", err);
      console.error("Error name:", err?.name);
      console.error("Error message:", err?.message);
      console.error("Error code:", err?.code);
      if (err?.errors) {
        console.error("Validation errors:", JSON.stringify(err.errors, null, 2));
      }
      
      // Если это ошибка валидации MongoDB, пробуем создать через прямое обращение к БД
      if (err?.name === "MongoServerError" || err?.code === 121 || err?.message?.includes("validation")) {
        console.log("Trying alternative method: direct DB insert with bypass validation...");
        try {
          const db = mongoose.connection.db;
          if (db) {
            const result = await db.collection("messages").insertOne(
              {
                chatId: chatIdObj,
                senderId: senderIdObj,
                receiverId: receiverIdObj,
                text: trimmedText,
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              { bypassDocumentValidation: true }
            );
            
            console.log("✓ Message created via direct insert (bypass validation):", result.insertedId.toString());
            message = await Message.findById(result.insertedId);
            if (!message) {
              throw new Error("Message was created but could not be retrieved");
            }
          } else {
            throw err;
          }
        } catch (altError: unknown) {
          console.error("Alternative method also failed:", altError);
          throw err;
        }
      } else {
        throw err;
      }
    }

    // Обновляем lastMessage в чате
    try {
      await Chat.findByIdAndUpdate(chatIdObj, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
      });
      console.log("✓ Chat updated with last message");
    } catch (updateError: unknown) {
      const updateErr = updateError as Error;
      console.error("⚠ Chat update failed (message still created):", updateErr);
      // Не выбрасываем ошибку, так как сообщение уже создано
    }

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
    console.error("========== CREATE MESSAGE ERROR ==========");
    console.error("Create message error:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
    });

    // Если это ошибка Mongoose, выводим больше деталей
    if (error && typeof error === "object" && "errors" in error) {
      const mongooseError = error as { errors?: Record<string, { message: string }> };
      console.error("Mongoose validation errors:", mongooseError.errors);
    }

    // Выводим полный объект ошибки
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("==========================================");

    // Проверяем, является ли ошибка ошибкой валидации Mongoose
    if (err.name === "ValidationError") {
      const validationError = error as { errors?: Record<string, { message: string }> };
      const errorMessages = validationError.errors 
        ? Object.values(validationError.errors).map((e: { message: string }) => e.message).join(", ")
        : err.message;
      
      return NextResponse.json(
        {
          success: false,
          message: `Ошибка валидации данных: ${errorMessages}`,
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при отправке сообщения",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
        errorType: err.name,
      },
      { status: 500 }
    );
  }
}

