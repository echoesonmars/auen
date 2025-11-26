"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { getImageUrl } from "@/lib/utils";
import MarkdownMessage from "@/app/components/MarkdownMessage";

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  read: boolean;
  ads?: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    price: string;
    location: string;
    images: string[];
    bookings: Array<{
      startDate: string | Date;
      endDate: string | Date;
      status: string;
    }>;
  }>;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  participants?: Array<{ _id: string; name: string; email: string }>;
  isAI?: boolean;
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  // Чат с Auen AI всегда доступен
  const auenAIChatDefault: Chat = {
    id: "auen-ai",
    name: "Auen AI",
    avatar: "🤖",
    lastMessage: "Привет! Я ваш AI помощник. Чем могу помочь?",
    time: "только что",
    unread: 0,
    isAI: true,
  };

  // На мобилке по умолчанию показываем список чатов (null), на десктопе - чат с AI
  // Восстанавливаем выбранный чат из sessionStorage при инициализации
  const [selectedChat, setSelectedChat] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("selectedChat") || null;
    }
    return null;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [chats, setChats] = useState<Chat[]>([auenAIChatDefault]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adInfo, setAdInfo] = useState<{ id: string; title: string } | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Сохраняем выбранный чат в sessionStorage при изменении
  useEffect(() => {
    if (selectedChat) {
      sessionStorage.setItem("selectedChat", selectedChat);
    } else {
      sessionStorage.removeItem("selectedChat");
    }
  }, [selectedChat]);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showChatMenu && !(event.target as Element).closest('.relative')) {
        setShowChatMenu(false);
      }
    };

    if (showChatMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatMenu]);

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // НЕ устанавливаем автоматически чат с AI при обновлении страницы
  // Пользователь должен сам выбрать чат из списка

  useEffect(() => {
    const initChat = async () => {
      // Проверяем авторизацию
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        // Сохраняем параметры для редиректа после логина
        const chatId = searchParams.get("chatId");
        const adId = searchParams.get("adId");
        const userIdParam = searchParams.get("userId");
        
        let redirectUrl = "/chat";
        const params = new URLSearchParams();
        if (chatId) params.set("chatId", chatId);
        if (adId) params.set("adId", adId);
        if (userIdParam) params.set("userId", userIdParam);
        if (params.toString()) redirectUrl += "?" + params.toString();
        
        showToast("Необходима авторизация", "warning");
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        }, 500);
        return;
      }

      const chatId = searchParams.get("chatId");
      const adId = searchParams.get("adId");
      const userIdParam = searchParams.get("userId");

      // Если есть adId, загружаем информацию об объявлении
      if (adId) {
        try {
          const adResponse = await fetch(`/api/ads/${adId}`);
          const adResult = await adResponse.json();
          if (adResult.success) {
            setAdInfo({ id: adId, title: adResult.data.title });
          }
        } catch (error) {
          console.error("Error loading ad info:", error);
        }
      }

      // Загружаем чаты
      await loadChats();

      // Если передан userId, создаем/находим чат
      if (userIdParam) {
          try {
          console.log("Creating chat with userId:", currentUserId, "receiverId:", userIdParam);
            const chatResponse = await fetch("/api/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: currentUserId,
                receiverId: userIdParam,
              }),
            });

          console.log("Chat response status:", chatResponse.status);
          console.log("Chat response headers:", Object.fromEntries(chatResponse.headers.entries()));

          // Проверяем Content-Type
          const contentType = chatResponse.headers.get("content-type");
          console.log("Content-Type:", contentType);

          if (!chatResponse.ok) {
            let errorText;
            try {
              errorText = await chatResponse.text();
            } catch {
              errorText = "Не удалось прочитать ответ сервера";
            }
            
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: "Ошибка сервера", raw: errorText.substring(0, 500) };
            }
            
            console.error("========== CHAT CREATION ERROR ==========");
            console.error("Status:", chatResponse.status);
            console.error("Status Text:", chatResponse.statusText);
            console.error("Error data:", errorData);
            console.error("Full error text:", errorText.substring(0, 1000));
            console.error("=========================================");
            
            const errorMessage = errorData.message || errorData.error || "Неизвестная ошибка";
            showToast("Ошибка при создании чата: " + errorMessage, "error");
            return;
          }

          // Проверяем, что ответ является JSON
          if (!contentType || !contentType.includes("application/json")) {
            const text = await chatResponse.text();
            console.error("Non-JSON response:", text.substring(0, 500));
            showToast("Ошибка: сервер вернул неверный формат данных", "error");
            return;
          }

          let chatResult;
          try {
            chatResult = await chatResponse.json();
          } catch (jsonError) {
            console.error("JSON parse error:", jsonError);
            const text = await chatResponse.text();
            console.error("Response text:", text.substring(0, 500));
            showToast("Ошибка при обработке ответа сервера", "error");
            return;
          }
          console.log("Chat result:", JSON.stringify(chatResult, null, 2));

            if (chatResult.success) {
            console.log("✓ Chat created/found successfully:", chatResult.data.chatId);
            // Устанавливаем выбранный чат
              setSelectedChat(chatResult.data.chatId);
            sessionStorage.setItem("selectedChat", chatResult.data.chatId);
            // Перезагружаем чаты после создания (без изменения selectedChat)
            await loadChats(true);
              // Если есть adId, добавляем сообщение о товаре
              if (adId && adInfo) {
                setTimeout(() => {
                  setMessageInput(`Здравствуйте! Меня заинтересовал товар: ${adInfo.title}`);
                }, 500);
              }
          } else {
            // Показываем ошибку пользователю
            console.error("========== CHAT CREATION FAILED ==========");
            console.error("Chat result:", JSON.stringify(chatResult, null, 2));
            console.error("Message:", chatResult.message);
            console.error("Error:", chatResult.error);
            console.error("Error type:", chatResult.errorType);
            console.error("==========================================");
            showToast(chatResult.message || "Ошибка при создании чата", "error");
            }
          } catch (error) {
            console.error("Error creating chat:", error);
          showToast("Ошибка при создании чата", "error");
        }
      } else if (chatId) {
        // Если передан chatId, открываем его
        setSelectedChat(chatId);
        sessionStorage.setItem("selectedChat", chatId);
        // Если есть adId, добавляем сообщение о товаре
        if (adId && adInfo) {
          setTimeout(() => {
            setMessageInput(`Здравствуйте! Меня заинтересовал товар: ${adInfo.title}`);
          }, 500);
        }
      } else {
        // Обычная загрузка - НЕ устанавливаем автоматически чат с AI
        // Пользователь сам выберет чат из списка
        // Восстанавливаем выбранный чат из sessionStorage если он есть
        const savedChat = sessionStorage.getItem("selectedChat");
        if (savedChat && savedChat !== "auen-ai") {
          // Проверяем, что сохраненный чат существует в списке (будет проверено после загрузки)
          // Пока просто не устанавливаем ничего
        }
      }
      
      setLoading(false);
    };

    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (selectedChat && !loadingMessages) {
      loadMessages(selectedChat);
      // После загрузки сообщений счетчик обновится в loadMessages
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  const loadChats = async (preserveSelection = true) => {
    // Предотвращаем множественные одновременные загрузки
    if (isLoadingChats) return;
    
    setIsLoadingChats(true);
    try {
      // Чат с Auen AI всегда должен быть доступен
      const auenAIChat: Chat = {
        id: "auen-ai",
        name: "Auen AI",
        avatar: "🤖",
        lastMessage: "Привет! Я ваш AI помощник. Чем могу помочь?",
        time: "только что",
        unread: 0,
        isAI: true,
      };

      const userId = localStorage.getItem("userId") || "";
      
      // Загружаем обычные чаты, если есть userId
      if (userId) {
        try {
          const response = await fetch(`/api/chats?userId=${userId}`, {
            cache: 'no-store'
          });
          
          // Обработка ошибки авторизации
          if (response.status === 401) {
            // Показываем только чат с AI при ошибке авторизации
            setChats([auenAIChat]);
            setIsLoadingChats(false);
            return;
          }
          
          const result = await response.json();

          if (result.success) {
            // Добавляем чат с Auen AI первым в списке
            const allChats = [auenAIChat, ...result.data];
            
            // Сохраняем текущий выбранный чат перед обновлением списка
            const currentSelectedChat = preserveSelection 
              ? (selectedChat || sessionStorage.getItem("selectedChat"))
              : null;
            
            setChats(allChats);
            
            // Восстанавливаем выбранный чат только если preserveSelection = true
            // и чат существует в новом списке
            if (preserveSelection && currentSelectedChat && currentSelectedChat !== "auen-ai") {
              // Проверяем, что выбранный чат существует в новом списке
              const chatExists = allChats.some(chat => chat.id === currentSelectedChat);
              if (chatExists) {
                // Чат существует, НЕ меняем selectedChat здесь, чтобы избежать бесконечного цикла
                // Просто обновляем sessionStorage
                sessionStorage.setItem("selectedChat", currentSelectedChat);
              } else {
                // Чат не найден, очищаем выбор (пользователь выберет сам)
                if (selectedChat === currentSelectedChat) {
                  setSelectedChat(null);
                }
                sessionStorage.removeItem("selectedChat");
              }
            }
            
            // Обновляем непрочитанные в навбаре
            window.dispatchEvent(new Event("chatsUpdated"));
          } else {
            // Если API вернул ошибку, показываем только чат с AI
              setChats([auenAIChat]);
          }
        } catch (error) {
          console.error("Error loading chats:", error);
          // При ошибке загрузки показываем только чат с AI
          setChats([auenAIChat]);
        }
      } else {
        // Если нет userId, показываем только чат с AI
        setChats([auenAIChat]);
      }

      // НЕ устанавливаем автоматически чат с AI при обновлении страницы
      // Пользователь должен сам выбрать чат из списка
    } catch (error) {
      console.error("Error loading chats:", error);
      // В случае ошибки показываем только чат с AI
      const auenAIChat: Chat = {
        id: "auen-ai",
        name: "Auen AI",
        avatar: "🤖",
        lastMessage: "Привет! Я ваш AI помощник. Чем могу помочь?",
        time: "только что",
        unread: 0,
        isAI: true,
      };
      setChats([auenAIChat]);
      // НЕ устанавливаем автоматически чат с AI
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Функция markMessagesAsRead удалена, так как сообщения помечаются автоматически в GET /api/chats/[chatId]/messages

  const loadMessages = async (chatId: string) => {
    // Предотвращаем множественные одновременные загрузки
    if (loadingMessages) return;
    
    setLoadingMessages(true);
    try {
      // Если это чат с AI, загружаем сообщения из localStorage или показываем приветствие
      if (chatId === "auen-ai") {
        const storedMessages = localStorage.getItem(`auen-ai-messages-${localStorage.getItem("userId")}`);
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        } else {
          // Приветственное сообщение от AI
          setMessages([
            {
              id: "ai-welcome",
              text: "Привет! Я Auen AI, ваш помощник. Я могу помочь вам с поиском инструментов, ответить на вопросы и многое другое. Чем могу помочь?",
              sender: "other",
              time: new Date().toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              read: true,
            },
          ]);
        }
        setLoadingMessages(false);
        return;
      }

      const userId = localStorage.getItem("userId") || "";
      
      // Получаем информацию о собеседнике для обычных чатов
      if (chatId !== "auen-ai") {
        try {
          const receiverResponse = await fetch(`/api/chats/${chatId}/receiver?userId=${userId}`, {
            cache: 'no-store'
          });
          if (receiverResponse.ok) {
            const receiverResult = await receiverResponse.json();
            if (receiverResult.success && receiverResult.data.receiverId) {
              setReceiverId(receiverResult.data.receiverId);
            }
          }
        } catch (error) {
          console.error("Error loading receiver:", error);
        }
      }
      
      const response = await fetch(`/api/chats/${chatId}/messages?userId=${userId}`, {
        cache: 'no-store'
      });
      
      // Обработка ошибки авторизации
      if (response.status === 401) {
        // Если ошибка авторизации и это не AI чат, НЕ переключаемся автоматически
        // Пользователь должен сам выбрать чат
        if (chatId !== "auen-ai") {
          // Просто очищаем выбранный чат
          setSelectedChat(null);
          sessionStorage.removeItem("selectedChat");
        }
        setLoadingMessages(false);
        return;
      }
      
      const result = await response.json();

      if (result.success) {
        setMessages(result.data);
        
        // Сбрасываем счетчик для текущего чата в локальном состоянии
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === chatId ? { ...chat, unread: 0 } : chat
          )
        );
        
        // Обновляем непрочитанные в навбаре
        window.dispatchEvent(new Event("chatsUpdated"));
        
        // Обновляем список чатов из БД (без изменения selectedChat)
        setTimeout(async () => {
          await loadChats(true);
          // Снова сбрасываем счетчик после обновления из БД
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === chatId ? { ...chat, unread: 0 } : chat
            )
          );
          window.dispatchEvent(new Event("chatsUpdated"));
        }, 300);
      } else if (result.message?.includes("авторизац")) {
        // Если ошибка авторизации и это не AI чат, НЕ переключаемся автоматически
        if (chatId !== "auen-ai") {
          setSelectedChat(null);
          sessionStorage.removeItem("selectedChat");
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    setSending(true);
    try {
      const userId = localStorage.getItem("userId") || "";
      const messageText = messageInput.trim();

      // Если это чат с AI
      if (selectedChat === "auen-ai") {
        // Добавляем сообщение пользователя
        const userMessage: Message = {
          id: `msg-${Date.now()}-user`,
          text: messageText,
          sender: "me",
          time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: true,
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setMessageInput("");
        
        // Сохраняем в localStorage
        localStorage.setItem(`auen-ai-messages-${userId}`, JSON.stringify(newMessages));

        // Обновляем список чатов сразу с сообщением пользователя
        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id === "auen-ai") {
              return {
                ...chat,
                lastMessage: messageText.length > 50 ? messageText.substring(0, 50) + "..." : messageText,
                time: "только что",
              };
            }
            return chat;
          });
        });

        // Отправляем запрос к AI API
        try {
          const aiResponse = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: messageText,
              userId: userId,
            }),
          });

          if (!aiResponse.ok) {
            throw new Error("Ошибка при обращении к AI");
          }

          const aiResult = await aiResponse.json();

          if (aiResult.success) {
          const aiMessage: Message = {
            id: `msg-${Date.now()}-ai`,
              text: aiResult.data.message,
            sender: "other",
            time: new Date().toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: true,
              ads: aiResult.data.ads || [],
          };
          
          const updatedMessages = [...newMessages, aiMessage];
          setMessages(updatedMessages);
          localStorage.setItem(`auen-ai-messages-${userId}`, JSON.stringify(updatedMessages));
          
          // Обновляем список чатов, чтобы показать последнее сообщение
          setChats((prevChats) => {
            return prevChats.map((chat) => {
              if (chat.id === "auen-ai") {
                return {
                  ...chat,
                    lastMessage: aiMessage.text.length > 50 ? aiMessage.text.substring(0, 50) + "..." : aiMessage.text,
                  time: "только что",
                };
              }
              return chat;
            });
          });
          } else {
            throw new Error(aiResult.message || "Ошибка при обработке ответа AI");
          }
        } catch (error) {
          console.error("Error calling AI API:", error);
          const errorMessage: Message = {
            id: `msg-${Date.now()}-ai-error`,
            text: "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.",
            sender: "other",
            time: new Date().toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: true,
          };
          
          const updatedMessages = [...newMessages, errorMessage];
          setMessages(updatedMessages);
          localStorage.setItem(`auen-ai-messages-${userId}`, JSON.stringify(updatedMessages));
          
          showToast("Ошибка при обращении к AI", "error");
        }

        setSending(false);
        return;
      }

      // Обычная логика для обычных чатов
      // Получаем ID другого участника из API
      const receiverResponse = await fetch(`/api/chats/${selectedChat}/receiver?userId=${userId}`);
      
      // Обработка ошибки авторизации
      if (receiverResponse.status === 401) {
        showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
        // НЕ переключаемся автоматически на AI чат
        setSelectedChat(null);
        sessionStorage.removeItem("selectedChat");
        setSending(false);
        return;
      }
      
      const receiverResult = await receiverResponse.json();
      
      if (!receiverResult.success || !receiverResult.data?.receiverId) {
        if (receiverResult.message?.includes("авторизац")) {
          showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
          setSelectedChat(null);
          sessionStorage.removeItem("selectedChat");
        } else {
          showToast("Не удалось определить получателя", "error");
        }
        setSending(false);
        return;
      }
      
      const receiverId = receiverResult.data.receiverId;

      console.log("Sending message to:", `/api/chats/${selectedChat}/messages`);
      console.log("Message data:", { text: messageText, senderId: userId, receiverId });

      const response = await fetch(`/api/chats/${selectedChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: messageText,
          senderId: userId,
          receiverId,
        }),
      });

      console.log("Message response status:", response.status);

      // Обработка ошибки авторизации
      if (response.status === 401) {
        showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
        setSelectedChat(null);
        sessionStorage.removeItem("selectedChat");
        setSending(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: "Ошибка сервера", raw: errorText.substring(0, 500) };
        }
        
        console.error("========== SEND MESSAGE ERROR ==========");
        console.error("Status:", response.status);
        console.error("Error data:", errorData);
        console.error("Full error text:", errorText);
        console.error("========================================");
        
        showToast("Ошибка при отправке сообщения: " + (errorData.message || "Неизвестная ошибка"), "error");
        setSending(false);
        return;
      }

      const result = await response.json();
      console.log("Message result:", result);
      
      if (result.message?.includes("авторизац")) {
        showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
        setSelectedChat(null);
        sessionStorage.removeItem("selectedChat");
        setSending(false);
        return;
      }

      if (result.success) {
        console.log("✓ Message sent successfully");
        setMessages([...messages, result.data]);
        setMessageInput("");
        // Обновляем список чатов после отправки сообщения (без изменения selectedChat)
        setTimeout(async () => {
          await loadChats(true);
          window.dispatchEvent(new Event("chatsUpdated"));
        }, 100);
      } else {
        console.error("Message send failed:", result);
        showToast(result.message || "Ошибка при отправке сообщения", "error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-color-lightest fixed top-16 left-0 right-0 bottom-0 lg:top-16" style={{ overflow: 'hidden' }}>
      <div className="w-full h-full flex flex-1 min-h-0" style={{ overflow: 'hidden' }}>
        {/* Chat List */}
        <div className={`w-full ${selectedChat && isMobile ? 'hidden' : 'flex'} lg:w-1/3 lg:flex border-r border-color-light flex-col`} style={{ height: '100%', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
          <div className="bg-white flex flex-col h-full min-h-0" style={{ overflow: 'hidden' }}>
            <div className="p-4 border-b border-color-light flex-shrink-0">
              <input
                type="text"
                placeholder="Поиск чатов..."
                className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-sm text-color-dark placeholder:text-color-medium"
              />
            </div>
            <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, maxHeight: '100%' }}>
                {loading ? (
                  <div className="p-4 text-center text-color-medium">Загрузка...</div>
                ) : chats.length > 0 ? (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        // Предотвращаем переключение, если уже загружаются сообщения
                        if (loadingMessages) return;
                        
                        // Если кликаем на уже выбранный чат, ничего не делаем
                        if (selectedChat === chat.id) return;
                        
                        // СРАЗУ сбрасываем счетчик непрочитанных при клике на чат
                        if (chat.id !== "auen-ai") {
                          setChats(prevChats => 
                            prevChats.map(c => 
                              c.id === chat.id ? { ...c, unread: 0 } : c
                            )
                          );
                          // Обновляем непрочитанные в навбаре
                          window.dispatchEvent(new Event("chatsUpdated"));
                        }
                        
                        // Устанавливаем выбранный чат
                        setSelectedChat(chat.id);
                        sessionStorage.setItem("selectedChat", chat.id);
                      }}
                      className={`w-full p-4 text-left border-b border-color-light hover:bg-color-lightest transition-colors ${
                        selectedChat === chat.id ? "bg-color-lightest" : ""
                      } ${chat.isAI ? "bg-gradient-to-r from-color-medium/5 to-transparent" : ""}`}
                    >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
                        chat.isAI ? "bg-gradient-to-br from-color-medium to-color-dark" : "bg-color-light"
                      }`}>
                        {chat.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-color-dark text-sm truncate">
                            {chat.name}
                            {chat.isAI && (
                              <span className="ml-2 text-xs bg-color-medium/20 text-color-medium px-2 py-0.5 rounded-full">
                                AI
                              </span>
                            )}
                          </h3>
                          <span className="text-xs text-color-medium flex-shrink-0 ml-2">
                            {chat.time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-color-medium truncate">{chat.lastMessage}</p>
                          {chat.unread > 0 && (
                            <span className="bg-color-medium text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-color-medium">Нет чатов</div>
                )}
              </div>
            </div>
          </div>

        {/* Chat Window - Desktop */}
        <div className="hidden lg:flex lg:w-2/3 flex-col" style={{ height: '100%', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
            {loading ? (
              <div className="bg-white flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
                <p className="text-color-medium">Загрузка...</p>
              </div>
            ) : selectedChat ? (
              (() => {
                let currentChat = chats.find((c) => c.id === selectedChat);
                
                // Fallback для чата с AI, если его нет в массиве
                if (!currentChat && selectedChat === "auen-ai") {
                  currentChat = {
                    id: "auen-ai",
                    name: "Auen AI",
                    avatar: "🤖",
                    lastMessage: "Привет! Я ваш AI помощник. Чем могу помочь?",
                    time: "только что",
                    unread: 0,
                    isAI: true,
                  };
                }
                
                if (!currentChat) {
                  return (
                    <div className="bg-white flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
                      <p className="text-color-medium">Чат не найден</p>
                    </div>
                  );
                }
                return (
              <div className="bg-white flex flex-col flex-1" style={{ minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
                {/* Chat Header */}
                <div className="p-4 border-b border-color-light flex items-center gap-3 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    currentChat.isAI ? "bg-gradient-to-br from-color-medium to-color-dark" : "bg-color-light"
                  }`}>
                    {currentChat.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-color-dark">{currentChat.name}</h2>
                      {currentChat.isAI && (
                        <span className="text-xs bg-color-medium/20 text-color-medium px-2 py-0.5 rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-color-medium">
                      {currentChat.isAI ? "Всегда в сети" : "В сети"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!currentChat.isAI && receiverId && (
                      <Link
                        href={`/user/${receiverId}`}
                        className="p-2 rounded-lg hover:bg-color-lightest transition-colors"
                        title="Профиль пользователя"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-color-medium"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </Link>
                    )}
                    {!currentChat.isAI && (
                      <div className="relative">
                        <button
                          onClick={() => setShowChatMenu(!showChatMenu)}
                          className="p-2 rounded-lg hover:bg-color-lightest transition-colors"
                          title="Меню чата"
                        >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-color-medium"
                    >
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                        </button>
                        {showChatMenu && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-color-light z-50">
                            <button
                              onClick={async () => {
                                if (!selectedChat || selectedChat === "auen-ai") return;
                                const userId = localStorage.getItem("userId");
                                if (!userId) return;
                                
                                if (confirm("Вы уверены, что хотите очистить все сообщения в этом чате?")) {
                                  try {
                                    const response = await fetch(`/api/chats/${selectedChat}?userId=${userId}&action=clear`, {
                                      method: "DELETE",
                                    });
                                    const result = await response.json();
                                    if (result.success) {
                                      setMessages([]);
                                      setShowChatMenu(false);
                                      showToast("Чат очищен", "success");
                                      loadChats();
                                    } else {
                                      showToast(result.message || "Ошибка при очистке чата", "error");
                                    }
                                  } catch (error) {
                                    console.error("Error clearing chat:", error);
                                    showToast("Ошибка при очистке чата", "error");
                                  }
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-color-dark hover:bg-color-lightest transition-colors"
                            >
                              Очистить чат
                            </button>
                            <button
                              onClick={async () => {
                                if (!selectedChat || selectedChat === "auen-ai") return;
                                const userId = localStorage.getItem("userId");
                                if (!userId) return;
                                
                                if (confirm("Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.")) {
                                  try {
                                    const response = await fetch(`/api/chats/${selectedChat}?userId=${userId}&action=delete`, {
                                      method: "DELETE",
                                    });
                                    const result = await response.json();
                                    if (result.success) {
                                      setSelectedChat(null);
                                      sessionStorage.removeItem("selectedChat");
                                      setShowChatMenu(false);
                                      showToast("Чат удален", "success");
                                      loadChats();
                                    } else {
                                      showToast(result.message || "Ошибка при удалении чата", "error");
                                    }
                                  } catch (error) {
                                    console.error("Error deleting chat:", error);
                                    showToast("Ошибка при удалении чата", "error");
                                  }
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Удалить чат
                  </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-color-lightest/50" style={{ minHeight: 0, maxHeight: '100%' }}>
                  {messages.length > 0 ? (
                    messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] sm:max-w-[60%] rounded-lg px-4 py-2 ${
                          message.sender === "me"
                            ? "bg-color-medium text-white"
                            : "bg-white text-color-dark border border-color-light"
                        }`}
                      >
                        {selectedChat === "auen-ai" ? (
                          <MarkdownMessage content={message.text} className="text-sm" />
                        ) : (
                          <p className="text-sm mb-1 whitespace-pre-wrap">{message.text}</p>
                        )}
                        
                        {/* Отображение объявлений, если они есть */}
                        {message.ads && message.ads.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {message.ads.map((ad) => {
                              const bookedPeriods = (ad.bookings || [])
                                .filter((b: { status: string }) => b.status === "confirmed" || b.status === "pending")
                                .map((b: { startDate: string | Date; endDate: string | Date }) => {
                                  const start = new Date(b.startDate).toLocaleDateString("ru-RU");
                                  const end = new Date(b.endDate).toLocaleDateString("ru-RU");
                                  return `${start} - ${end}`;
                                });

                              return (
                                <Link
                                  key={ad.id}
                                  href={`/ads/${ad.id}`}
                                  className="block border border-color-light rounded-lg p-3 bg-white hover:bg-color-lightest transition-colors"
                                >
                                  <div className="flex gap-3">
                                    {ad.images && ad.images.length > 0 && (
                                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-color-lightest">
                                        <img
                                          src={getImageUrl(ad.images[0])}
                                          alt={ad.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = "none";
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-color-dark text-sm mb-1 line-clamp-1">
                                        {ad.title}
                                      </h4>
                                      <p className="text-xs text-color-medium mb-1">{ad.category}</p>
                                      <p className="text-sm font-bold text-color-medium mb-1">{ad.price}</p>
                                      <p className="text-xs text-color-medium mb-1">📍 {ad.location}</p>
                                      {bookedPeriods.length > 0 && (
                                        <p className="text-xs text-red-600 mt-1">
                                          ⚠️ Занято: {bookedPeriods.join(", ")}
                                        </p>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          router.push(`/ads/${ad.id}`);
                                        }}
                                        className="mt-2 text-xs bg-color-medium text-white px-3 py-1 rounded hover:bg-color-dark transition-colors"
                                      >
                                        Посмотреть и забронировать
                                      </button>
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={`text-xs ${
                              message.sender === "me" ? "text-white/70" : "text-color-medium"
                            }`}
                          >
                            {message.time}
                          </span>
                          {message.sender === "me" && (
                            <div className="flex items-center gap-0">
                              {/* Первая галочка - отправлено (всегда видна) */}
                            <svg
                                width="14"
                                height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                                className={message.read ? "text-blue-400" : "text-white/50"}
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              {/* Вторая галочка - прочитано (только если прочитано) */}
                              {message.read && (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-blue-400 -ml-2"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center text-color-medium py-8">
                      Нет сообщений. Начните общение!
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-color-light flex items-center gap-3 flex-shrink-0"
                >
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-color-lightest transition-colors text-color-medium"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="flex-1 px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-sm text-color-dark placeholder:text-color-medium"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="bg-color-medium text-white px-4 py-2 rounded-lg font-medium hover:bg-color-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <span className="text-sm">...</span>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
                );
              })()
            ) : (
              <div className="bg-white flex-1 flex items-center justify-center" style={{ minHeight: 0 }}>
                <div className="text-center">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-color-light mx-auto mb-4"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p className="text-color-medium">Выберите чат для начала общения</p>
                </div>
              </div>
            )}
          </div>
        </div>
      
      {/* Mobile Chat Window */}
      {selectedChat && isMobile && (() => {
        let mobileCurrentChat = chats.find((c) => c.id === selectedChat);
        
        // Fallback для чата с AI, если его нет в массиве
        if (!mobileCurrentChat && selectedChat === "auen-ai") {
          mobileCurrentChat = {
            id: "auen-ai",
            name: "Auen AI",
            avatar: "🤖",
            lastMessage: "Привет! Я ваш AI помощник. Чем могу помочь?",
            time: "только что",
            unread: 0,
            isAI: true,
          };
        }
        
        return mobileCurrentChat ? (
          <div className="lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-white z-50 flex flex-col min-h-0" style={{ overflow: 'hidden' }}>
              <div className="p-4 border-b border-color-light flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-2 rounded-lg hover:bg-color-lightest transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-color-medium"
                  >
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  mobileCurrentChat.isAI ? "bg-gradient-to-br from-color-medium to-color-dark" : "bg-color-light"
                }`}>
                  {mobileCurrentChat.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-color-dark">{mobileCurrentChat.name}</h2>
                    {mobileCurrentChat.isAI && (
                      <span className="text-xs bg-color-medium/20 text-color-medium px-2 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-color-lightest/50 min-h-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.sender === "me"
                          ? "bg-color-medium text-white"
                          : "bg-white text-color-dark border border-color-light"
                      }`}
                    >
                      {selectedChat === "auen-ai" ? (
                        <MarkdownMessage content={message.text} className="text-sm" />
                      ) : (
                        <p className="text-sm mb-1 whitespace-pre-wrap">{message.text}</p>
                      )}
                      
                      {/* Отображение объявлений, если они есть */}
                      {message.ads && message.ads.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {message.ads.map((ad) => {
                            const bookedPeriods = (ad.bookings || [])
                              .filter((b: { status: string }) => b.status === "confirmed" || b.status === "pending")
                              .map((b: { startDate: string | Date; endDate: string | Date }) => {
                                const start = new Date(b.startDate).toLocaleDateString("ru-RU");
                                const end = new Date(b.endDate).toLocaleDateString("ru-RU");
                                return `${start} - ${end}`;
                              });

                            return (
                              <Link
                                key={ad.id}
                                href={`/ads/${ad.id}`}
                                className="block border border-color-light rounded-lg p-3 bg-white hover:bg-color-lightest transition-colors"
                              >
                                <div className="flex gap-3">
                                  {ad.images && ad.images.length > 0 && (
                                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-color-lightest">
                                      <img
                                        src={ad.images[0].startsWith("/") ? ad.images[0] : `/${ad.images[0]}`}
                                        alt={ad.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = "none";
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-color-dark text-sm mb-1 line-clamp-1">
                                      {ad.title}
                                    </h4>
                                    <p className="text-xs text-color-medium mb-1">{ad.category}</p>
                                    <p className="text-sm font-bold text-color-medium mb-1">{ad.price}</p>
                                    <p className="text-xs text-color-medium mb-1">📍 {ad.location}</p>
                                    {bookedPeriods.length > 0 && (
                                      <p className="text-xs text-red-600 mt-1">
                                        ⚠️ Занято: {bookedPeriods.join(", ")}
                                      </p>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        router.push(`/ads/${ad.id}`);
                                      }}
                                      className="mt-2 text-xs bg-color-medium text-white px-3 py-1 rounded hover:bg-color-dark transition-colors"
                                    >
                                      Посмотреть и забронировать
                                    </button>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                      
                      <span
                        className={`text-xs ${
                          message.sender === "me" ? "text-white/70" : "text-color-medium"
                        }`}
                      >
                        {message.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-color-light flex items-center gap-3 flex-shrink-0"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="flex-1 px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-sm text-color-dark placeholder:text-color-medium"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-color-medium text-white px-4 py-2 rounded-lg font-medium hover:bg-color-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
          </div>
        ) : null;
      })()}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-color-medium">Загрузка...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

