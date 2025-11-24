"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  totalChats: number;
}

interface Ad {
  id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  status: string;
  views: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string | null;
  adsCount: number;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stats" | "ads" | "users">("stats");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adsPage, setAdsPage] = useState(1);
  const [adsStatusFilter, setAdsStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "stats") {
        loadStats();
      } else if (activeTab === "ads") {
        loadAds();
      } else if (activeTab === "users") {
        loadUsers();
      }
    }
  }, [isAdmin, activeTab, adsPage, adsStatusFilter]);

  const checkAdminAccess = async () => {
    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/admin/check?userId=${userId}`);
      const result = await response.json();

      if (result.success && result.data.isAdmin) {
        setIsAdmin(true);
      } else {
        setError("Доступ запрещен. Необходимы права администратора.");
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setError("Ошибка при проверке доступа");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetch(`/api/admin/stats?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadAds = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const statusParam = adsStatusFilter !== "all" ? `&status=${adsStatusFilter}` : "";
      const response = await fetch(
        `/api/admin/ads?userId=${userId}&page=${adsPage}&limit=20${statusParam}`
      );
      const result = await response.json();

      if (result.success) {
        setAds(result.data);
      }
    } catch (error) {
      console.error("Error loading ads:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetch(
        `/api/admin/users?userId=${userId}&page=1&limit=20`
      );
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const updateAdStatus = async (adId: string, newStatus: string) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetch(`/api/admin/ads/${adId}?userId=${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        loadAds();
        loadStats();
      } else {
        alert(result.message || "Ошибка при обновлении статуса");
      }
    } catch (error) {
      console.error("Error updating ad status:", error);
      alert("Ошибка при обновлении статуса");
    }
  };

  const updateUserRole = async (userIdToUpdate: string, newRole: string) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetch(`/api/admin/users/${userIdToUpdate}?userId=${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await response.json();

      if (result.success) {
        loadUsers();
      } else {
        alert(result.message || "Ошибка при обновлении роли");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Ошибка при обновлении роли");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Активно";
      case "pending":
        return "На модерации";
      case "rejected":
        return "Отклонено";
      case "inactive":
        return "Неактивно";
      case "sold":
        return "Продано";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-medium mx-auto mb-4"></div>
          <p className="text-color-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || error) {
    return (
      <div className="min-h-screen bg-color-lightest flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full text-center">
          <BlurFade inView={true} delay={0.1} direction="up">
            <div className="bg-white rounded-2xl shadow-lg border border-color-light p-8">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-color-dark mb-2">Доступ запрещен</h1>
              <p className="text-color-medium mb-6">
                {error || "У вас нет прав доступа к админ панели"}
              </p>
              <Link
                href="/"
                className="inline-block bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark transition-colors"
              >
                На главную
              </Link>
            </div>
          </BlurFade>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-color-lightest py-8 sm:py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <div className="mb-8">
            <TextAnimate
              as="h1"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.1}
              className="text-4xl sm:text-5xl font-bold text-color-dark mb-2"
            >
              Админ панель
            </TextAnimate>
            <p className="text-color-medium">Управление платформой</p>
          </div>
        </BlurFade>

        {/* Tabs */}
        <BlurFade inView={true} delay={0.2} direction="up">
          <div className="bg-white rounded-xl shadow-lg border border-color-light mb-6">
            <div className="flex border-b border-color-light">
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === "stats"
                    ? "text-color-medium border-b-2 border-color-medium"
                    : "text-color-dark hover:text-color-medium"
                }`}
              >
                Статистика
              </button>
              <button
                onClick={() => setActiveTab("ads")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === "ads"
                    ? "text-color-medium border-b-2 border-color-medium"
                    : "text-color-dark hover:text-color-medium"
                }`}
              >
                Объявления
                {stats && stats.pendingAds > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.pendingAds}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === "users"
                    ? "text-color-medium border-b-2 border-color-medium"
                    : "text-color-dark hover:text-color-medium"
                }`}
              >
                Пользователи
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "stats" && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-color-lightest rounded-lg p-6">
                    <div className="text-3xl font-bold text-color-dark mb-1">
                      {stats.totalUsers}
                    </div>
                    <div className="text-color-medium text-sm">Всего пользователей</div>
                  </div>
                  <div className="bg-color-lightest rounded-lg p-6">
                    <div className="text-3xl font-bold text-color-dark mb-1">
                      {stats.totalAds}
                    </div>
                    <div className="text-color-medium text-sm">Всего объявлений</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-yellow-700 mb-1">
                      {stats.pendingAds}
                    </div>
                    <div className="text-yellow-700 text-sm">На модерации</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-700 mb-1">
                      {stats.activeAds}
                    </div>
                    <div className="text-green-700 text-sm">Активных</div>
                  </div>
                </div>
              )}

              {activeTab === "ads" && (
                <div>
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setAdsStatusFilter("all");
                        setAdsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        adsStatusFilter === "all"
                          ? "bg-color-medium text-white"
                          : "bg-color-lightest text-color-dark hover:bg-color-light"
                      }`}
                    >
                      Все
                    </button>
                    <button
                      onClick={() => {
                        setAdsStatusFilter("pending");
                        setAdsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        adsStatusFilter === "pending"
                          ? "bg-yellow-500 text-white"
                          : "bg-color-lightest text-color-dark hover:bg-color-light"
                      }`}
                    >
                      На модерации
                    </button>
                    <button
                      onClick={() => {
                        setAdsStatusFilter("active");
                        setAdsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        adsStatusFilter === "active"
                          ? "bg-green-500 text-white"
                          : "bg-color-lightest text-color-dark hover:bg-color-light"
                      }`}
                    >
                      Активные
                    </button>
                    <button
                      onClick={() => {
                        setAdsStatusFilter("rejected");
                        setAdsPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        adsStatusFilter === "rejected"
                          ? "bg-red-500 text-white"
                          : "bg-color-lightest text-color-dark hover:bg-color-light"
                      }`}
                    >
                      Отклоненные
                    </button>
                  </div>

                  <div className="space-y-4">
                    {ads.map((ad) => (
                      <div
                        key={ad.id}
                        className="bg-color-lightest rounded-lg p-4 border border-color-light"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Link
                                href={`/ads/${ad.id}`}
                                className="font-semibold text-color-dark hover:text-color-medium transition-colors"
                              >
                                {ad.title}
                              </Link>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                  ad.status
                                )}`}
                              >
                                {getStatusLabel(ad.status)}
                              </span>
                            </div>
                            <div className="text-sm text-color-medium">
                              {ad.category} • {ad.location} • {ad.price}
                            </div>
                            <div className="text-xs text-color-medium mt-1">
                              Автор: {ad.user.name} ({ad.user.email}) • {ad.views} просмотров
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {ad.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateAdStatus(ad.id, "active")}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                >
                                  Одобрить
                                </button>
                                <button
                                  onClick={() => updateAdStatus(ad.id, "rejected")}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                                >
                                  Отклонить
                                </button>
                              </>
                            )}
                            {ad.status === "rejected" && (
                              <button
                                onClick={() => updateAdStatus(ad.id, "active")}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                              >
                                Одобрить
                              </button>
                            )}
                            {ad.status === "active" && (
                              <button
                                onClick={() => updateAdStatus(ad.id, "inactive")}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                              >
                                Деактивировать
                              </button>
                            )}
                            <Link
                              href={`/ads/${ad.id}`}
                              className="px-4 py-2 bg-color-medium text-white rounded-lg text-sm font-medium hover:bg-color-dark transition-colors"
                            >
                              Просмотр
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-color-light">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-color-dark">
                          Имя
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-color-dark">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-color-dark">
                          Роль
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-color-dark">
                          Объявлений
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-color-dark">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-color-light">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-color-light flex items-center justify-center text-sm">
                                  👤
                                </div>
                              )}
                              <span className="font-medium text-color-dark">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-color-medium text-sm">{user.email}</td>
                          <td className="py-3 px-4">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="px-3 py-1 rounded-lg border border-color-light text-sm focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none"
                            >
                              <option value="user">Пользователь</option>
                              <option value="moderator">Модератор</option>
                              <option value="admin">Администратор</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-color-medium text-sm">
                            {user.adsCount}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/user/${user.id}`}
                              className="text-color-medium hover:text-color-dark text-sm font-medium"
                            >
                              Профиль
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

