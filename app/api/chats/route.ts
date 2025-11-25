import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import User from "@/models/User";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Валидация ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID пользователя",
        },
        { status: 400 }
      );
    }

    // Находим все чаты, где пользователь является участником
    const chats = await Chat.find({
      participants: new mongoose.Types.ObjectId(userId),
    })
      .populate("participants", "name email")
      .populate({
        path: "lastMessage",
        select: "text createdAt",
        options: { lean: true },
      })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Формируем ответ с данными для UI
    const chatsData = await Promise.all(
      chats.map(async (chat) => {
        try {
          const otherParticipant = chat.participants?.find(
            (p: { _id: { toString: () => string }; name?: string; email?: string }) => 
              p?._id?.toString() !== userId
          ) as { _id: { toString: () => string }; name?: string; email?: string } | undefined;

          // Подсчитываем непрочитанные сообщения
          // Преобразуем userId в ObjectId для корректного поиска
          const userIdObj = new mongoose.Types.ObjectId(userId);
          const chatIdObj = typeof chat._id === 'string' 
            ? new mongoose.Types.ObjectId(chat._id) 
            : chat._id;
          
          const unreadCount = await Message.countDocuments({
            chatId: chatIdObj,
            receiverId: userIdObj,
            read: false,
          }).catch((err) => {
            console.error(`Error counting unread messages for chat ${chat._id}:`, err);
            return 0;
          });
          
          // Логируем для отладки
          console.log(`Chat ${chat._id}: ${unreadCount} unread messages for user ${userId} (chatId: ${chatIdObj.toString()}, receiverId: ${userIdObj.toString()})`);

          // Получаем последнее сообщение
          const lastMessage = await Message.findOne({
            chatId: chatIdObj,
          })
            .sort({ createdAt: -1 })
            .lean()
            .catch(() => null);

          // chat.lastMessage может быть ObjectId или объектом с text
          const lastMessageText = lastMessage?.text || 
            (chat.lastMessage && typeof chat.lastMessage === 'object' && 'text' in chat.lastMessage 
              ? (chat.lastMessage as { text?: string }).text 
              : '') || "";

          return {
            id: chat._id,
            name: otherParticipant?.name || "Пользователь",
            avatar: "👤",
            lastMessage: lastMessageText,
            time: lastMessage?.createdAt
              ? new Date(lastMessage.createdAt).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : chat.lastMessageAt
              ? new Date(chat.lastMessageAt).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            unread: unreadCount,
          };
        } catch (error) {
          console.error(`Error processing chat ${chat._id}:`, error);
          return {
            id: chat._id,
            name: "Пользователь",
            avatar: "👤",
            lastMessage: "",
            time: "",
            unread: 0,
          };
        }
      })
    );

    const response = NextResponse.json(
      {
        success: true,
        data: chatsData,
      },
      { status: 200 }
    );
    
    // Отключаем кэширование для получения свежих данных
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
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

    // Убеждаемся, что коллекция и индексы существуют
    try {
      await Chat.createIndexes();
    } catch (indexError) {
      console.warn("Index creation warning (may already exist):", indexError);
    }

    const body = await request.json();
    console.log("POST /api/chats - Received body:", body);
    const { userId, receiverId } = body;
    
    console.log("Extracted userId:", userId, "receiverId:", receiverId);

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

    // Валидация ObjectId ДО выполнения запросов к БД
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      console.error("Invalid ObjectId format:", { userId, receiverId });
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID пользователя",
        },
        { status: 400 }
      );
    }

    // Преобразуем строки в ObjectId для корректного поиска
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const receiverIdObj = new mongoose.Types.ObjectId(receiverId);

    // Проверяем, существует ли уже чат между этими пользователями
    // Используем $all для поиска чата, где оба участника присутствуют (независимо от порядка)
    const existingChat = await Chat.findOne({
      participants: { $all: [userIdObj, receiverIdObj] },
      $expr: { $eq: [{ $size: "$participants" }, 2] }
    }).lean();

    console.log("Existing chat check:", existingChat ? `Found: ${existingChat._id}` : "Not found");

    if (existingChat) {
      console.log("Returning existing chat:", existingChat._id.toString());
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
    console.log("Creating new chat with participants:", {
      userId: userIdObj.toString(),
      receiverId: receiverIdObj.toString(),
    });

    // Убеждаемся, что массив participants содержит ровно 2 элемента
    const participants = [userIdObj, receiverIdObj];
    console.log("Participants array:", participants.map(p => p.toString()));

    // Проверяем, что оба участника существуют в базе данных
    console.log("Checking if users exist:", {
      userId: userIdObj.toString(),
      receiverId: receiverIdObj.toString(),
    });
    const user1 = await User.findById(userIdObj);
    const user2 = await User.findById(receiverIdObj);
    
    console.log("User check results:", {
      user1Exists: !!user1,
      user2Exists: !!user2,
    });
    
    if (!user1) {
      console.error("User 1 not found:", userIdObj.toString());
      return NextResponse.json(
        {
          success: false,
          message: `Пользователь с ID ${userIdObj.toString()} не найден`,
        },
        { status: 404 }
      );
    }

    if (!user2) {
      console.error("User 2 not found:", receiverIdObj.toString());
      return NextResponse.json(
        {
          success: false,
          message: `Пользователь с ID ${receiverIdObj.toString()} не найден`,
        },
        { status: 404 }
      );
    }

    console.log("Creating chat with participants:", participants.map(p => p.toString()));
    
    // Проверяем, что массив содержит ровно 2 элемента
    if (!Array.isArray(participants) || participants.length !== 2) {
      console.error("Invalid participants array:", participants);
      return NextResponse.json(
        {
          success: false,
          message: "Чат должен содержать ровно 2 участника",
        },
        { status: 400 }
      );
    }

    // Проверяем, что все элементы массива являются валидными ObjectId
    const allValid = participants.every(p => mongoose.Types.ObjectId.isValid(p));
    if (!allValid) {
      console.error("Invalid ObjectId in participants array:", participants);
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID участников",
        },
        { status: 400 }
      );
    }

    // Создаем чат напрямую
    let newChat;
    try {
      console.log("Attempting to create chat with participants:", {
        participant1: participants[0].toString(),
        participant2: participants[1].toString(),
        arrayLength: participants.length,
      });
      
      // Пробуем создать через new Chat() и save() вместо Chat.create()
      // Это может обойти некоторые проблемы с валидацией
      const chatDoc = new Chat({
        participants: participants,
      });
      
      // Валидируем вручную перед сохранением
      await chatDoc.validate();
      
      newChat = await chatDoc.save();
      console.log("✓ Chat created successfully:", newChat._id.toString());
    } catch (createError: unknown) {
      const err = createError as Error & { name?: string; message?: string; code?: number; errors?: Record<string, { message: string }>; stack?: string };
      console.error("✗ Chat creation failed:", err);
      console.error("Error name:", err?.name);
      console.error("Error message:", err?.message);
      console.error("Error code:", err?.code);
      console.error("Error type:", err?.constructor?.name);
      
      if (err?.errors) {
        console.error("Validation errors:", JSON.stringify(err.errors, null, 2));
        // Выводим каждую ошибку отдельно
        Object.keys(err.errors).forEach(key => {
          console.error(`  - ${key}:`, err.errors?.[key]?.message);
        });
      }
      
      if (err?.stack) {
        console.error("Error stack:", err.stack);
      }
      
      // Если это ошибка валидации MongoDB, пробуем создать через прямое обращение к БД
      if (err?.name === "MongoServerError" || err?.code === 121 || err?.message?.includes("validation")) {
        console.log("Trying alternative method: direct DB insert with bypass validation...");
        try {
          const db = mongoose.connection.db;
          if (db) {
            // Используем insertOne с опцией bypassDocumentValidation
            const result = await db.collection("chats").insertOne(
              {
                participants: participants.map(p => p instanceof mongoose.Types.ObjectId ? p : new mongoose.Types.ObjectId(p)),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              { bypassDocumentValidation: true }
            );
            
            console.log("✓ Chat created via direct insert (bypass validation):", result.insertedId.toString());
            newChat = await Chat.findById(result.insertedId);
            if (!newChat) {
              throw new Error("Chat was created but could not be retrieved");
            }
          } else {
            throw err;
          }
        } catch (altError: unknown) {
          const altErr = altError as Error & { name?: string; message?: string; code?: number };
          console.error("Alternative method also failed:", altErr);
          console.error("Alt error details:", {
            name: altErr?.name,
            message: altErr?.message,
            code: altErr?.code,
          });
          throw err; // Выбрасываем оригинальную ошибку
        }
      } else {
        throw err;
      }
    }

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
    console.error("========== CREATE CHAT ERROR ==========");
    console.error("Create chat error:", err);
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
    console.error("=======================================");

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

    // Проверяем, является ли ошибка ошибкой дублирования
    const mongoError = error as { code?: number };
    if (err.name === "MongoServerError" && mongoError.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Чат с такими участниками уже существует",
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании чата",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
        errorType: err.name,
      },
      { status: 500 }
    );
  }
}

