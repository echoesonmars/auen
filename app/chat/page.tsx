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
}

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      const userId = localStorage.getItem("userId") || "";
      if (!userId) return;

      const response = await fetch(`/api/chats?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setChats(result.data);
        if (result.data.length > 0 && !selectedChat) {
          setSelectedChat(result.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const userId = localStorage.getItem("userId") || "";
      const response = await fetch(`/api/chats/${chatId}/messages?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const currentChat = chats.find((chat) => chat.id === selectedChat);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    setSending(true);
    try {
      const userId = localStorage.getItem("userId") || "";
      
      // Получаем ID другого участника из API
      const receiverResponse = await fetch(`/api/chats/${selectedChat}/receiver?userId=${userId}`);
      const receiverResult = await receiverResponse.json();
      
      if (!receiverResult.success || !receiverResult.data?.receiverId) {
        alert("Не удалось определить получателя");
        setSending(false);
        return;
      }
      
      const receiverId = receiverResult.data.receiverId;

      const response = await fetch(`/api/chats/${selectedChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: messageInput,
          senderId: userId,
          receiverId,
        }),
      });

      const result = await response.json();

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
                      }`}
                    >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-color-light flex items-center justify-center text-2xl flex-shrink-0">
                        {chat.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-color-dark text-sm truncate">
                            {chat.name}
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
                const currentChat = chats.find((c) => c.id === selectedChat);
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
                  <div className="w-10 h-10 rounded-full bg-color-light flex items-center justify-center text-xl">
                    {currentChat.avatar}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-color-dark">{currentChat.name}</h2>
                    <p className="text-xs text-color-medium">В сети</p>
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
          {selectedChat && (
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
                <div className="w-10 h-10 rounded-full bg-color-light flex items-center justify-center text-xl">
                  {currentChat?.avatar}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-color-dark">{currentChat?.name}</h2>
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
          )}
        </div>
      </div>
    </div>
  );
}

