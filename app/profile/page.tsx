"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import BookingsTab from "./BookingsTab";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  website?: string;
  instagram?: string;
  telegram?: string;
  vk?: string;
  youtube?: string;
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
  const [activeTab, setActiveTab] = useState<"info" | "ads" | "bookings" | "settings">("info");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Обработка ошибки авторизации
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      
      const result = await response.json();

      if (result.success) {
        setUserInfo(result.data.user);
        setMyAds(result.data.ads);
      } else if (result.message?.includes("авторизац") || response.status === 401) {
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-color-lightest pt-12 sm:pt-16 md:pt-20 pb-10 sm:pb-14">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-0">
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
                    {/* Avatar */}
                    <div className="relative group">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-color-light flex items-center justify-center text-5xl sm:text-6xl overflow-hidden border-4 border-white shadow-lg">
                        {userInfo.avatar ? (
                          <img
                            src={userInfo.avatar}
                            alt={userInfo.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Если изображение не загрузилось, показываем эмодзи
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = "👤";
                              }
                            }}
                          />
                        ) : (
                          "👤"
                        )}
                      </div>
                      {/* Upload button overlay */}
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full cursor-pointer transition-all">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsUploadingAvatar(true);
                            try {
                              const formData = new FormData();
                              formData.append("avatar", file);
                              formData.append("userId", userInfo.id);

                              const response = await fetch("/api/user/avatar", {
                                method: "POST",
                                body: formData,
                              });

                              const result = await response.json();

                              if (result.success && result.data.avatar) {
                                setUserInfo({ ...userInfo, avatar: result.data.avatar });
                                showToast("Аватар успешно загружен", "success");
                              } else {
                                showToast(result.message || "Ошибка при загрузке аватара", "error");
                              }
                            } catch (error) {
                              console.error("Error uploading avatar:", error);
                              showToast("Ошибка при загрузке аватара", "error");
                            } finally {
                              setIsUploadingAvatar(false);
                              // Сбрасываем input, чтобы можно было загрузить тот же файл снова
                              e.target.value = "";
                            }
                          }}
                          disabled={isUploadingAvatar}
                        />
                        {isUploadingAvatar ? (
                          <div className="text-white text-sm">Загрузка...</div>
                        ) : (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                        )}
                      </label>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-2">
                        {userInfo.name}
                      </h2>
                      <p className="text-color-medium mb-1">{userInfo.email}</p>
                      {userInfo.phone && (
                        <p className="text-color-medium mb-1">{userInfo.phone}</p>
                      )}
                      {userInfo.bio && (
                        <p className="text-color-medium mb-3 mt-2 text-sm">{userInfo.bio}</p>
                      )}
                      {/* Social Links */}
                      {(userInfo.website || userInfo.instagram || userInfo.telegram || userInfo.vk || userInfo.youtube) && (
                        <div className="flex flex-wrap gap-3 mt-3">
                          {userInfo.website && (
                            <a
                              href={userInfo.website.startsWith('http') ? userInfo.website : `https://${userInfo.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-color-lightest hover:bg-color-light transition-colors text-sm text-color-dark"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                              </svg>
                              Сайт
                            </a>
                          )}
                          {userInfo.instagram && (
                            <a
                              href={`https://instagram.com/${userInfo.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors text-sm text-white"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="white"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2"></line>
                              </svg>
                              Instagram
                            </a>
                          )}
                          {userInfo.telegram && (
                            <a
                              href={`https://t.me/${userInfo.telegram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors text-sm text-white"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.169 0-.315.06-.45.151l-1.718 1.403-1.403 2.315c-.06.113-.113.225-.113.338 0 .151.075.302.188.377l1.5 1.125c.075.075.188.113.301.113.075 0 .15-.038.225-.075l2.25-.75c.113-.038.188-.15.188-.263l.375-2.25c.038-.113-.038-.225-.15-.263l-1.875-.75c-.038 0-.113-.038-.188-.038zm-5.25 3.375l-1.875 3.188c-.038.075-.113.113-.188.113-.075 0-.15-.038-.188-.113l-1.875-3.188c-.038-.075-.038-.15 0-.225l1.875-3.188c.038-.075.113-.113.188-.113.075 0 .15.038.188.113l1.875 3.188c.038.075.038.15 0 .225z"></path>
                              </svg>
                              Telegram
                            </a>
                          )}
                          {userInfo.vk && (
                            <a
                              href={`https://vk.com/${userInfo.vk}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm text-white"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.785 16.241s.287-.029.434-.174c.135-.135.131-.388.131-.388s-.02-1.126.577-1.292c.591-.17 1.35.895 2.152 1.29.604.295 1.062.23 1.062.23l2.15-.03s1.123-.072.59-.956c-.044-.072-.308-.64-1.583-1.81-1.339-1.24-1.16-1.04.453-3.188.984-1.31 1.377-2.11 1.253-2.451-.117-.32-.84-.235-.84-.235l-2.405.015s-.178-.025-.31.055c-.13.077-.214.257-.214.257s-.385 1.02-.897 1.889c-1.082 1.699-1.515 1.79-1.692 1.685-.41-.247-.308-1.001-.308-1.533 0-1.667.25-2.36-.49-2.54-.246-.06-.427-.1-1.057-.106-.81-.008-1.496.003-1.884.166-.259.11-.458.355-.337.369.15.018.49.028.67.46.23.55.226 1.78.226 1.78s.135 1.98-1.57 2.226c-.31.044-.54.08-.68.163-.35.21-.247.68-.247 1.19 0 1.36.404 1.58.404 1.58s.15.09.15.27c0 .28-.15.35-.15.35s-.15.09-.15.27c0 .28.15.35.15.35s.15.09.15.27c0 .28-.15.35-.15.35z"></path>
                              </svg>
                              VK
                            </a>
                          )}
                          {userInfo.youtube && (
                            <a
                              href={`https://youtube.com/@${userInfo.youtube}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm text-white"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                              </svg>
                              YouTube
                            </a>
                          )}
                        </div>
                      )}
                      <button
                        onClick={logout}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Выйти из аккаунта
                      </button>
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
            <div className="flex gap-1 sm:gap-2 mb-6 border-b border-color-light overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === "info"
                    ? "border-color-medium text-color-dark"
                    : "border-transparent text-color-medium hover:text-color-dark"
                }`}
              >
                Личная информация
              </button>
              <button
                onClick={() => setActiveTab("ads")}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === "ads"
                    ? "border-color-medium text-color-dark"
                    : "border-transparent text-color-medium hover:text-color-dark"
                }`}
              >
                Мои объявления
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === "bookings"
                    ? "border-color-medium text-color-dark"
                    : "border-transparent text-color-medium hover:text-color-dark"
                }`}
              >
                Мои бронирования
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
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

                      // Обработка ошибки авторизации
                      if (response.status === 401) {
                        showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
                        router.push("/login");
                        return;
                      }

                      const result = await response.json();

                      if (result.success) {
                        setUserInfo(result.data);
                        showToast("Профиль успешно обновлен", "success");
                      } else {
                        if (result.message?.includes("авторизац")) {
                          showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
                          router.push("/login");
                        } else {
                          showToast("Ошибка: " + (result.message || "Неизвестная ошибка"), "error");
                        }
                      }
                    } catch (error) {
                      console.error("Error updating profile:", error);
                      showToast("Ошибка при обновлении профиля", "error");
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
                          <button
                            onClick={() => router.push(`/ads/${ad.id}/edit`)}
                            className="px-4 py-2 rounded-lg border border-color-light text-color-dark hover:bg-color-lightest transition-all duration-200 text-sm font-medium"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => router.push(`/ads/${ad.id}`)}
                            className="px-4 py-2 rounded-lg bg-color-medium text-white hover:bg-color-dark transition-all duration-200 text-sm font-medium"
                          >
                            Смотреть
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("Вы уверены, что хотите удалить это объявление?")) {
                                try {
                                  const userId = localStorage.getItem("userId");
                                  if (!userId) {
                                    showToast("Необходима авторизация", "error");
                                    return;
                                  }

                                  const response = await fetch(`/api/ads/${ad.id}?userId=${userId}`, {
                                    method: "DELETE",
                                  });

                                  const result = await response.json();

                                  if (result.success) {
                                    showToast("Объявление успешно удалено", "success");
                                    loadUserData();
                                  } else {
                                    showToast(result.message || "Ошибка при удалении объявления", "error");
                                  }
                                } catch (error) {
                                  console.error("Error deleting ad:", error);
                                  showToast("Ошибка при удалении объявления", "error");
                                }
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200 text-sm font-medium"
                          >
                            Удалить
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

          {activeTab === "bookings" && (
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
                <BookingsTab />
              </div>
            </BlurFade>
          )}

          {activeTab === "settings" && (
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-color-dark mb-6">
                  Настройки профиля
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);

                    const formData = new FormData(e.currentTarget);
                    
                    // Преобразуем пустые строки в null для опциональных полей
                    const getValueOrNull = (value: FormDataEntryValue | null): string | null => {
                      if (!value || (typeof value === 'string' && value.trim() === '')) {
                        return null;
                      }
                      return typeof value === 'string' ? value.trim() : String(value);
                    };
                    
                    const updateData = {
                      name: getValueOrNull(formData.get("name")),
                      email: getValueOrNull(formData.get("email")),
                      phone: getValueOrNull(formData.get("phone")),
                      bio: getValueOrNull(formData.get("bio")),
                      website: getValueOrNull(formData.get("website")),
                      instagram: getValueOrNull(formData.get("instagram")),
                      telegram: getValueOrNull(formData.get("telegram")),
                      vk: getValueOrNull(formData.get("vk")),
                      youtube: getValueOrNull(formData.get("youtube")),
                      userId: userInfo?.id,
                    };

                    try {
                      const response = await fetch("/api/user/profile", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updateData),
                      });

                      if (response.status === 401) {
                        showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
                        router.push("/login");
                        setIsSaving(false);
                        return;
                      }

                      let result;
                      try {
                        result = await response.json();
                      } catch (jsonError) {
                        const errorText = await response.text();
                        console.error("JSON parse error:", jsonError, "Response:", errorText);
                        showToast("Ошибка при обработке ответа сервера: " + errorText.substring(0, 100), "error");
                        setIsSaving(false);
                        return;
                      }

                      if (result.success) {
                        setUserInfo(result.data);
                        showToast("Профиль успешно обновлен", "success");
                      } else {
                        if (result.message?.includes("авторизац")) {
                          showToast("Сессия истекла. Пожалуйста, войдите в систему снова.", "warning");
                          router.push("/login");
                        } else {
                          // Показываем детальные ошибки валидации, если они есть
                          const errorMessages: string[] = [];
                          if (result.errors) {
                            Object.values(result.errors).forEach((error: unknown) => {
                              if (typeof error === 'string') {
                                errorMessages.push(error);
                              } else if (Array.isArray(error)) {
                                errorMessages.push(...error.map(e => String(e)));
                              }
                            });
                          }
                          const errorMessage = errorMessages.length > 0 
                            ? errorMessages.join(", ")
                            : (result.message || "Неизвестная ошибка");
                          showToast("Ошибка: " + errorMessage, "error");
                          console.error("Profile update error:", result);
                        }
                      }
                    } catch (error) {
                      console.error("Error updating profile:", error);
                      const errorMessage = error instanceof Error ? error.message : "Ошибка при обновлении профиля";
                      showToast("Ошибка: " + errorMessage, "error");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Описание профиля
                    </label>
                    <textarea
                      name="bio"
                      defaultValue={userInfo?.bio || ""}
                      maxLength={500}
                      rows={4}
                      placeholder="Расскажите о себе..."
                      className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark resize-none"
                    />
                    <p className="text-xs text-color-medium mt-1">Максимум 500 символов</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Сайт
                    </label>
                    <input
                      type="url"
                      name="website"
                      defaultValue={userInfo?.website || ""}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-color-dark mb-2">
                        Instagram
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-color-medium">@</span>
                        <input
                          type="text"
                          name="instagram"
                          defaultValue={userInfo?.instagram || ""}
                          placeholder="username"
                          className="flex-1 px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-color-dark mb-2">
                        Telegram
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-color-medium">@</span>
                        <input
                          type="text"
                          name="telegram"
                          defaultValue={userInfo?.telegram || ""}
                          placeholder="username"
                          className="flex-1 px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-color-dark mb-2">
                        VK
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-color-medium">vk.com/</span>
                        <input
                          type="text"
                          name="vk"
                          defaultValue={userInfo?.vk || ""}
                          placeholder="username"
                          className="flex-1 px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-color-dark mb-2">
                        YouTube
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-color-medium">@</span>
                        <input
                          type="text"
                          name="youtube"
                          defaultValue={userInfo?.youtube || ""}
                          placeholder="username"
                          className="flex-1 px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-color-light">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Сохранение..." : "Сохранить изменения"}
                    </button>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-color-light space-y-6">
                  <h4 className="text-lg font-bold text-color-dark mb-4">Уведомления</h4>
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
                  <div className="pt-4 border-t border-color-light space-y-3">
                    <button
                      onClick={logout}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Выйти из аккаунта
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-all duration-200">
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

