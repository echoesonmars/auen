"use client";

import { useState, useEffect } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  read: boolean;
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

export default function ChatPage() {
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

  const [selectedChat, setSelectedChat] = useState<string | null>("auen-ai");
  const [messageInput, setMessageInput] = useState("");
  const [chats, setChats] = useState<Chat[]>([auenAIChatDefault]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadChats();
    // Загружаем сообщения для AI чата при первой загрузке
    if (selectedChat === "auen-ai") {
      loadMessages("auen-ai");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  const loadChats = async () => {
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
          const response = await fetch(`/api/chats?userId=${userId}`);
          
          // Обработка ошибки авторизации
          if (response.status === 401) {
            // Показываем только чат с AI при ошибке авторизации
            setChats([auenAIChat]);
            return;
          }
          
          const result = await response.json();

          if (result.success) {
            // Добавляем чат с Auen AI первым в списке
            const allChats = [auenAIChat, ...result.data];
            setChats(allChats);
          } else {
            // Если API вернул ошибку, показываем только чат с AI
            if (result.message?.includes("авторизац")) {
              setChats([auenAIChat]);
            } else {
              setChats([auenAIChat]);
            }
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

      // Если нет выбранного чата, выбираем чат с AI
      if (!selectedChat) {
        setSelectedChat("auen-ai");
      }
    } catch (error) {
      console.error("Error loading chats:", error);
      // В случае ошибки все равно показываем чат с AI
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
      if (!selectedChat) {
        setSelectedChat("auen-ai");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
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
        return;
      }

      const userId = localStorage.getItem("userId") || "";
      const response = await fetch(`/api/chats/${chatId}/messages?userId=${userId}`);
      
      // Обработка ошибки авторизации
      if (response.status === 401) {
        // Если ошибка авторизации и это не AI чат, переключаемся на AI чат
        if (chatId !== "auen-ai") {
          setSelectedChat("auen-ai");
          loadMessages("auen-ai");
        }
        return;
      }
      
      const result = await response.json();

      if (result.success) {
        setMessages(result.data);
      } else if (result.message?.includes("авторизац")) {
        // Если ошибка авторизации и это не AI чат, переключаемся на AI чат
        if (chatId !== "auen-ai") {
          setSelectedChat("auen-ai");
          loadMessages("auen-ai");
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
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

        // Симулируем ответ от AI (здесь можно добавить реальный AI API)
        setTimeout(() => {
          const aiMessage: Message = {
            id: `msg-${Date.now()}-ai`,
            text: "Спасибо за ваше сообщение! В данный момент я в разработке, но скоро смогу помочь вам с поиском инструментов и ответами на вопросы. 😊",
            sender: "other",
            time: new Date().toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: true,
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
                  lastMessage: aiMessage.text,
                  time: "только что",
                };
              }
              return chat;
            });
          });
        }, 1000);

        setSending(false);
        return;
      }

      // Обычная логика для обычных чатов
      // Получаем ID другого участника из API
      const receiverResponse = await fetch(`/api/chats/${selectedChat}/receiver?userId=${userId}`);
      
      // Обработка ошибки авторизации
      if (receiverResponse.status === 401) {
        alert("Сессия истекла. Пожалуйста, войдите в систему снова.");
        // Переключаемся на AI чат при ошибке авторизации
        setSelectedChat("auen-ai");
        loadMessages("auen-ai");
        setSending(false);
        return;
      }
      
      const receiverResult = await receiverResponse.json();
      
      if (!receiverResult.success || !receiverResult.data?.receiverId) {
        if (receiverResult.message?.includes("авторизац")) {
          alert("Сессия истекла. Пожалуйста, войдите в систему снова.");
          setSelectedChat("auen-ai");
          loadMessages("auen-ai");
        } else {
          alert("Не удалось определить получателя");
        }
        setSending(false);
        return;
      }
      
      const receiverId = receiverResult.data.receiverId;

      const response = await fetch(`/api/chats/${selectedChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: messageText,
          senderId: userId,
          receiverId,
        }),
      });

      // Обработка ошибки авторизации
      if (response.status === 401) {
        alert("Сессия истекла. Пожалуйста, войдите в систему снова.");
        setSelectedChat("auen-ai");
        loadMessages("auen-ai");
        setSending(false);
        return;
      }

      const result = await response.json();
      
      if (result.message?.includes("авторизац")) {
        alert("Сессия истекла. Пожалуйста, войдите в систему снова.");
        setSelectedChat("auen-ai");
        loadMessages("auen-ai");
        setSending(false);
        return;
      }

      if (result.success) {
        setMessages([...messages, result.data]);
        setMessageInput("");
        loadChats(); // Обновляем список чатов
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-color-lightest">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <TextAnimate
            as="h1"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-color-dark mb-6 sm:mb-8"
          >
            Сообщения
          </TextAnimate>
        </BlurFade>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-12rem)] sm:h-[calc(100vh-14rem)]">
          {/* Chat List */}
          <BlurFade inView={true} delay={0.2} direction="up" className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-color-light">
                <input
                  type="text"
                  placeholder="Поиск чатов..."
                  className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-sm text-color-dark placeholder:text-color-medium"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-color-medium">Загрузка...</div>
                ) : chats.length > 0 ? (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
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
          </BlurFade>

          {/* Chat Window */}
          <BlurFade
            inView={true}
            delay={0.3}
            direction="up"
            className="lg:col-span-2 hidden lg:block"
          >
            {loading ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light h-full flex items-center justify-center">
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
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light h-full flex items-center justify-center">
                      <p className="text-color-medium">Чат не найден</p>
                    </div>
                  );
                }
                return (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-4 border-b border-color-light flex items-center gap-3">
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
                  <button className="p-2 rounded-lg hover:bg-color-lightest transition-colors">
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
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-color-lightest/50">
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
                        <p className="text-sm mb-1">{message.text}</p>
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={`text-xs ${
                              message.sender === "me" ? "text-white/70" : "text-color-medium"
                            }`}
                          >
                            {message.time}
                          </span>
                          {message.sender === "me" && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={message.read ? "text-blue-300" : "text-white/50"}
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
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
                  className="p-4 border-t border-color-light flex items-center gap-3"
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
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light h-full flex items-center justify-center">
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
          </BlurFade>

          {/* Mobile Chat Window */}
          {selectedChat && (() => {
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
            <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
              <div className="p-4 border-b border-color-light flex items-center gap-3">
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

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-color-lightest/50">
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
                      <p className="text-sm mb-1">{message.text}</p>
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
                className="p-4 border-t border-color-light flex items-center gap-3"
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
      </div>
    </div>
  );
}

