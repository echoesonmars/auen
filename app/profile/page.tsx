"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Ad {
  id: string;
  title: string;
  category: string;
  price: string;
  status: string;
  views: number;
  createdAt: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "ads" | "settings">("info");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // TODO: Получить userId из сессии/контекста
      const userId = localStorage.getItem("userId") || "";

      if (!userId) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/user/me?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setUserInfo(result.data.user);
        setMyAds(result.data.ads);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-color-lightest py-8 sm:py-12 md:py-20">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <TextAnimate
            as="h1"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-color-dark mb-2"
          >
            Мой профиль
          </TextAnimate>
        </BlurFade>

        <div className="mt-8 sm:mt-12">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-color-medium">Загрузка...</p>
            </div>
          ) : userInfo ? (
            <>
              {/* Profile Header */}
              <BlurFade inView={true} delay={0.2} direction="up">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8 mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-color-light flex items-center justify-center text-5xl sm:text-6xl">
                      👤
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-2">
                        {userInfo.name}
                      </h2>
                      <p className="text-color-medium mb-1">{userInfo.email}</p>
                      <p className="text-color-medium mb-1">{userInfo.phone}</p>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-color-medium">Ошибка загрузки данных</p>
            </div>
          )}

          {/* Tabs */}
          <BlurFade inView={true} delay={0.3} direction="up">
            <div className="flex gap-2 mb-6 border-b border-color-light">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === "info"
                    ? "border-color-medium text-color-dark"
                    : "border-transparent text-color-medium hover:text-color-dark"
                }`}
              >
                Личная информация
              </button>
              <button
                onClick={() => setActiveTab("ads")}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === "ads"
                    ? "border-color-medium text-color-dark"
                    : "border-transparent text-color-medium hover:text-color-dark"
                }`}
              >
                Мои объявления
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === "settings"
                    ? "border-color-medium text-color-dark"
                    : "border-transparent text-color-medium hover:text-color-dark"
                }`}
              >
                Настройки
              </button>
            </div>
          </BlurFade>

          {/* Tab Content */}
          {activeTab === "info" && (
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-color-dark mb-6">
                  Личная информация
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);

                    const formData = new FormData(e.currentTarget);
                    const updateData = {
                      name: formData.get("name"),
                      email: formData.get("email"),
                      phone: formData.get("phone"),
                      userId: userInfo?.id,
                    };

                    try {
                      const response = await fetch("/api/user/profile", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updateData),
                      });

                      const result = await response.json();

                      if (result.success) {
                        setUserInfo(result.data);
                        alert("Профиль успешно обновлен");
                      } else {
                        alert("Ошибка: " + (result.message || "Неизвестная ошибка"));
                      }
                    } catch (error) {
                      console.error("Error updating profile:", error);
                      alert("Ошибка при обновлении профиля");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Имя
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={userInfo?.name}
                      className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={userInfo?.email}
                      className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={userInfo?.phone}
                      className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="mt-4 bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                </form>
              </div>
            </BlurFade>
          )}

          {activeTab === "ads" && (
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="space-y-4">
                {myAds.length > 0 ? (
                  myAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-color-dark mb-2">
                            {ad.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-color-medium">
                            <span>{ad.category}</span>
                            <span>•</span>
                            <span className="font-semibold text-color-medium">
                              {ad.price}
                            </span>
                            <span>•</span>
                            <span
                              className={
                                ad.status === "active"
                                  ? "text-green-600"
                                  : ad.status === "sold"
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }
                            >
                              {ad.status === "active"
                                ? "Активно"
                                : ad.status === "sold"
                                ? "Продано"
                                : "Неактивно"}
                            </span>
                            <span>•</span>
                            <span>{ad.views} просмотров</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 rounded-lg border border-color-light text-color-dark hover:bg-color-lightest transition-all duration-200 text-sm font-medium">
                            Редактировать
                          </button>
                          <button className="px-4 py-2 rounded-lg bg-color-medium text-white hover:bg-color-dark transition-all duration-200 text-sm font-medium">
                            Смотреть
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-12 text-center">
                    <p className="text-color-medium text-lg mb-4">
                      У вас пока нет объявлений
                    </p>
                    <a
                      href="/create"
                      className="inline-block bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200"
                    >
                      Создать объявление
                    </a>
                  </div>
                )}
              </div>
            </BlurFade>
          )}

          {activeTab === "settings" && (
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-color-dark mb-6">
                  Настройки
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-color-dark">Уведомления по email</p>
                      <p className="text-sm text-color-medium">
                        Получать уведомления о новых сообщениях
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-color-light peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-color-medium rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-medium"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-color-dark">Уведомления в браузере</p>
                      <p className="text-sm text-color-medium">
                        Показывать уведомления в браузере
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-color-light peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-color-medium rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-medium"></div>
                    </label>
                  </div>
                  <div className="pt-4 border-t border-color-light">
                    <button className="px-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-200">
                      Удалить аккаунт
                    </button>
                  </div>
                </div>
              </div>
            </BlurFade>
          )}
        </div>
      </div>
    </div>
  );
}

