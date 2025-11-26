"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  inactiveAds: number;
  rejectedAds: number;
  soldAds: number;
  totalChats: number;
  analytics?: {
    adsByCategory: Array<{ category: string; count: number }>;
    adsByLocation: Array<{ location: string; count: number }>;
    usersByRole: Array<{ role: string; count: number }>;
    adsLast7Days: Array<{ date: string; count: number }>;
    usersLast7Days: Array<{ date: string; count: number }>;
  };
}

interface Ad {
  id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  status: string;
  views: number;
  featured?: boolean;
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
  isBlocked?: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState<"stats" | "ads" | "users" | "reviews">("stats");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Array<{
    id: string;
    userId: { id: string; name: string; email: string; avatar: string | null };
    adId: { id: string; title: string };
    rating: number;
    comment: string;
    createdAt: string;
  }>>([]);
  const [adsPage, setAdsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [adsStatusFilter, setAdsStatusFilter] = useState<string>("all");
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>("all");
  const [adsSearch, setAdsSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showAdDetails, setShowAdDetails] = useState<string | null>(null);
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);
  const [adDetails, setAdDetails] = useState<{
    title: string;
    category: string;
    price: string;
    location: string;
    status: string;
    views: number;
    images?: string[];
    description: string;
    userId?: { name?: string };
  } | null>(null);
  const [userDetails, setUserDetails] = useState<{
    user?: { name?: string; email?: string; phone?: string; avatar?: string; createdAt?: string };
    ads?: Array<{ _id: string; title: string; price: string; location: string }>;
  } | null>(null);

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "stats") {
        loadStats();
      } else if (activeTab === "ads") {
        loadAds();
      } else if (activeTab === "users") {
        loadUsers();
      } else if (activeTab === "reviews") {
        loadReviews();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, adsPage, adsStatusFilter, adsSearch, usersPage, usersRoleFilter, usersSearch, reviewsPage, reviewsSearch]);

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
      const searchParam = adsSearch ? `&search=${encodeURIComponent(adsSearch)}` : "";
      const response = await fetch(
        `/api/admin/ads?userId=${userId}&page=${adsPage}&limit=20${statusParam}${searchParam}`
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

      const roleParam = usersRoleFilter !== "all" ? `&role=${usersRoleFilter}` : "";
      const searchParam = usersSearch ? `&search=${encodeURIComponent(usersSearch)}` : "";
      const response = await fetch(
        `/api/admin/users?userId=${userId}&page=${usersPage}&limit=20${roleParam}${searchParam}`
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
        showToast("Статус объявления обновлен", "success");
      } else {
        showToast(result.message || "Ошибка при обновлении статуса", "error");
      }
    } catch (error) {
      console.error("Error updating ad status:", error);
      showToast("Ошибка при обновлении статуса", "error");
    }
  };

  const toggleFeatured = async (adId: string, currentFeatured: boolean) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetch(`/api/admin/ads/${adId}?userId=${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured: !currentFeatured }),
      });

      const result = await response.json();

      if (result.success) {
        loadAds();
        showToast(
          !currentFeatured
            ? "Объявление добавлено в рекламную галерею"
            : "Объявление удалено из рекламной галереи",
          "success"
        );
      } else {
        showToast(result.message || "Ошибка при обновлении", "error");
      }
    } catch (error) {
      console.error("Error toggling featured:", error);
      showToast("Ошибка при обновлении", "error");
    }
  };

  const loadReviews = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const searchParam = reviewsSearch ? `&search=${encodeURIComponent(reviewsSearch)}` : "";
      const response = await fetch(
        `/api/admin/reviews?userId=${userId}&page=${reviewsPage}&limit=20${searchParam}`
      );
      const result = await response.json();

      if (result.success) {
        setReviews(result.data);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
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
        showToast("Роль пользователя обновлена", "success");
      } else {
        showToast(result.message || "Ошибка при обновлении роли", "error");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast("Ошибка при обновлении роли", "error");
    }
  };

  const blockUser = async (userIdToUpdate: string, isBlocked: boolean) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const response = await fetch(`/api/admin/users/${userIdToUpdate}?userId=${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBlocked }),
      });

      const result = await response.json();

      if (result.success) {
        loadUsers();
        showToast(isBlocked ? "Пользователь заблокирован" : "Пользователь разблокирован", "success");
      } else {
        showToast(result.message || "Ошибка при блокировке пользователя", "error");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      showToast("Ошибка при блокировке пользователя", "error");
    }
  };

  const deleteUser = async (userIdToDelete: string) => {
    showConfirm(
      "Вы уверены, что хотите удалить этого пользователя? Все его объявления также будут удалены.",
      () => {
        (async () => {
          try {
            const userId = localStorage.getItem("userId");
            if (!userId) return;

            const response = await fetch(`/api/admin/users/${userIdToDelete}?userId=${userId}`, {
              method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
              loadUsers();
              loadStats();
              showToast("Пользователь удален", "success");
            } else {
              showToast(result.message || "Ошибка при удалении пользователя", "error");
            }
          } catch (error) {
            console.error("Error deleting user:", error);
            showToast("Ошибка при удалении пользователя", "error");
          }
        })();
      }
    );
  };

  const deleteAd = async (adId: string) => {
    showConfirm(
      "Вы уверены, что хотите удалить это объявление?",
      () => {
        (async () => {
          try {
            const userId = localStorage.getItem("userId");
            if (!userId) return;

            const response = await fetch(`/api/admin/ads/${adId}?userId=${userId}`, {
              method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
              loadAds();
              loadStats();
              showToast("Объявление удалено", "success");
            } else {
              showToast(result.message || "Ошибка при удалении объявления", "error");
            }
          } catch (error) {
            console.error("Error deleting ad:", error);
            showToast("Ошибка при удалении объявления", "error");
          }
        })();
      }
    );
  };

  const deleteReview = async (reviewId: string) => {
    showConfirm(
      "Вы уверены, что хотите удалить этот отзыв?",
      () => {
        (async () => {
          try {
            const userId = localStorage.getItem("userId");
            if (!userId) return;

            const response = await fetch(`/api/admin/reviews/${reviewId}?userId=${userId}`, {
              method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
              loadReviews();
              showToast("Отзыв удален", "success");
            } else {
              showToast(result.message || "Ошибка при удалении отзыва", "error");
            }
          } catch (error) {
            console.error("Error deleting review:", error);
            showToast("Ошибка при удалении отзыва", "error");
          }
        })();
      }
    );
  };

  const bulkAdsAction = async (action: string, status?: string) => {
    if (selectedAds.size === 0) {
      showToast("Выберите хотя бы одно объявление", "warning");
      return;
    }

    const actionName = action === "approve" ? "одобрить" : action === "reject" ? "отклонить" : "удалить";
    showConfirm(
      `Вы уверены, что хотите ${actionName} ${selectedAds.size} объявлений?`,
      async () => {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) return;

          const response = await fetch(`/api/admin/ads/bulk?userId=${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              adIds: Array.from(selectedAds),
              status,
            }),
          });

          const result = await response.json();

          if (result.success) {
            setSelectedAds(new Set());
            loadAds();
            loadStats();
            showToast(result.message || "Действие выполнено успешно", "success");
          } else {
            showToast(result.message || "Ошибка при выполнении действия", "error");
          }
        } catch (error) {
          console.error("Error bulk action:", error);
          showToast("Ошибка при выполнении действия", "error");
        }
      }
    );
  };

  const bulkUsersAction = async (action: string) => {
    if (selectedUsers.size === 0) {
      showToast("Выберите хотя бы одного пользователя", "warning");
      return;
    }

    const actionName = action === "block" ? "заблокировать" : action === "unblock" ? "разблокировать" : "удалить";
    showConfirm(
      `Вы уверены, что хотите ${actionName} ${selectedUsers.size} пользователей?`,
      async () => {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) return;

          const response = await fetch(`/api/admin/users/bulk?userId=${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              userIds: Array.from(selectedUsers),
            }),
          });

          const result = await response.json();

          if (result.success) {
            setSelectedUsers(new Set());
            loadUsers();
            loadStats();
            showToast(result.message || "Действие выполнено успешно", "success");
          } else {
            showToast(result.message || "Ошибка при выполнении действия", "error");
          }
        } catch (error) {
          console.error("Error bulk action:", error);
          showToast("Ошибка при выполнении действия", "error");
        }
      }
    );
  };

  const loadAdDetails = async (adId: string) => {
    try {
      const response = await fetch(`/api/ads/${adId}`);
      const result = await response.json();
      if (result.success) {
        setAdDetails(result.data);
        setShowAdDetails(adId);
      }
    } catch (error) {
      console.error("Error loading ad details:", error);
    }
  };

  const loadUserDetails = async (userIdToLoad: string) => {
    try {
      const response = await fetch(`/api/user/${userIdToLoad}`);
      const result = await response.json();
      if (result.success) {
        setUserDetails(result.data);
        setShowUserDetails(userIdToLoad);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
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
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
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
            <div className="flex items-center justify-between mb-4">
              <div>
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
              <button
                onClick={async () => {
                  const userId = localStorage.getItem("userId");
                  if (!userId) return;
                  try {
                    const response = await fetch(`/api/admin/export?userId=${userId}&type=all`);
                    const result = await response.json();
                    if (result.success) {
                      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `auen-export-${new Date().toISOString().split("T")[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  } catch (error) {
                    console.error("Export error:", error);
                    showToast("Ошибка при экспорте данных", "error");
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Экспорт данных
              </button>
            </div>
          </div>
        </BlurFade>

        {/* Tabs */}
        <BlurFade inView={true} delay={0.2} direction="up">
          <div className="bg-white rounded-xl shadow-lg border border-color-light mb-6">
            <div className="flex border-b border-color-light overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === "stats"
                    ? "text-color-medium border-b-2 border-color-medium"
                    : "text-color-dark hover:text-color-medium"
                }`}
              >
                Статистика
              </button>
              <button
                onClick={() => setActiveTab("ads")}
                className={`px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
                className={`px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === "users"
                    ? "text-color-medium border-b-2 border-color-medium"
                    : "text-color-dark hover:text-color-medium"
                }`}
              >
                Пользователи
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-3 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === "reviews"
                    ? "text-color-medium border-b-2 border-color-medium"
                    : "text-color-dark hover:text-color-medium"
                }`}
              >
                Отзывы
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "stats" && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                    {stats.inactiveAds !== undefined && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="text-3xl font-bold text-gray-700 mb-1">
                          {stats.inactiveAds}
                        </div>
                        <div className="text-gray-700 text-sm">Неактивных</div>
                      </div>
                    )}
                    {stats.rejectedAds !== undefined && (
                      <div className="bg-red-50 rounded-lg p-6">
                        <div className="text-3xl font-bold text-red-700 mb-1">
                          {stats.rejectedAds}
                        </div>
                        <div className="text-red-700 text-sm">Отклоненных</div>
                      </div>
                    )}
                    {stats.soldAds !== undefined && (
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="text-3xl font-bold text-blue-700 mb-1">
                          {stats.soldAds}
                        </div>
                        <div className="text-blue-700 text-sm">Продано</div>
                      </div>
                    )}
                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="text-3xl font-bold text-purple-700 mb-1">
                        {stats.totalChats}
                      </div>
                      <div className="text-purple-700 text-sm">Чатов</div>
                    </div>
                  </div>

                  {stats.analytics && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-color-lightest rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-color-dark mb-4">Объявления по категориям</h3>
                        <div className="space-y-2">
                          {stats.analytics.adsByCategory.slice(0, 5).map((item) => (
                            <div key={item.category} className="flex items-center justify-between">
                              <span className="text-color-dark">{item.category}</span>
                              <span className="font-semibold text-color-medium">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-color-lightest rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-color-dark mb-4">Пользователи по ролям</h3>
                        <div className="space-y-2">
                          {stats.analytics.usersByRole.map((item) => (
                            <div key={item.role} className="flex items-center justify-between">
                              <span className="text-color-dark">
                                {item.role === "admin" ? "Администраторы" : item.role === "moderator" ? "Модераторы" : "Пользователи"}
                              </span>
                              <span className="font-semibold text-color-medium">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ads" && (
                <div>
                  {selectedAds.size > 0 && (
                    <div className="mb-4 p-4 bg-color-lightest rounded-lg border border-color-medium flex items-center justify-between">
                      <span className="font-medium text-color-dark">
                        Выбрано: {selectedAds.size} объявлений
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => bulkAdsAction("approve", "active")}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Одобрить все
                        </button>
                        <button
                          onClick={() => bulkAdsAction("reject")}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          Отклонить все
                        </button>
                        <button
                          onClick={() => bulkAdsAction("delete")}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Удалить все
                        </button>
                        <button
                          onClick={() => setSelectedAds(new Set())}
                          className="px-4 py-2 bg-color-light text-color-dark rounded-lg text-sm font-medium hover:bg-color-lightest transition-colors"
                        >
                          Снять выделение
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Поиск по названию, категории, локации..."
                      value={adsSearch}
                      onChange={(e) => {
                        setAdsSearch(e.target.value);
                        setAdsPage(1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          loadAds();
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none mb-3"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setAdsStatusFilter("all");
                          setAdsPage(1);
                          loadAds();
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
                          loadAds();
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
                          loadAds();
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
                          loadAds();
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
                  </div>

                  {ads.length === 0 ? (
                    <div className="text-center py-12 text-color-medium">
                      Объявления не найдены
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ads.map((ad) => (
                        <div
                          key={ad.id}
                          className="bg-color-lightest rounded-lg p-4 border border-color-light"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedAds.has(ad.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedAds);
                                  if (e.target.checked) {
                                    newSelected.add(ad.id);
                                  } else {
                                    newSelected.delete(ad.id);
                                  }
                                  setSelectedAds(newSelected);
                                }}
                                className="mt-1 w-4 h-4 text-color-medium rounded focus:ring-color-medium"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <button
                                    onClick={() => loadAdDetails(ad.id)}
                                    className="font-semibold text-color-dark hover:text-color-medium transition-colors text-left"
                                  >
                                    {ad.title}
                                  </button>
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
                                <>
                                  <button
                                    onClick={() => updateAdStatus(ad.id, "inactive")}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                                  >
                                    Деактивировать
                                  </button>
                                  <button
                                    onClick={() => toggleFeatured(ad.id, ad.featured || false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      ad.featured
                                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                    }`}
                                  >
                                    {ad.featured ? "⭐ В галерее" : "⭐ В галерею"}
                                  </button>
                                </>
                              )}
                              {ad.status === "inactive" && (
                                <button
                                  onClick={() => updateAdStatus(ad.id, "active")}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                >
                                  Активировать
                                </button>
                              )}
                              <Link
                                href={`/ads/${ad.id}`}
                                className="px-4 py-2 bg-color-medium text-white rounded-lg text-sm font-medium hover:bg-color-dark transition-colors"
                              >
                                Просмотр
                              </Link>
                              <button
                                onClick={() => deleteAd(ad.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "users" && (
                <div>
                  {selectedUsers.size > 0 && (
                    <div className="mb-4 p-4 bg-color-lightest rounded-lg border border-color-medium flex items-center justify-between">
                      <span className="font-medium text-color-dark">
                        Выбрано: {selectedUsers.size} пользователей
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => bulkUsersAction("block")}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                          Заблокировать всех
                        </button>
                        <button
                          onClick={() => bulkUsersAction("unblock")}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Разблокировать всех
                        </button>
                        <button
                          onClick={() => bulkUsersAction("delete")}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Удалить всех
                        </button>
                        <button
                          onClick={() => setSelectedUsers(new Set())}
                          className="px-4 py-2 bg-color-light text-color-dark rounded-lg text-sm font-medium hover:bg-color-lightest transition-colors"
                        >
                          Снять выделение
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Поиск по имени, email, телефону..."
                      value={usersSearch}
                      onChange={(e) => {
                        setUsersSearch(e.target.value);
                        setUsersPage(1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          loadUsers();
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none mb-3"
                    />
                    <div className="flex gap-2 flex-wrap mb-4">
                      <button
                        onClick={() => {
                          setUsersRoleFilter("all");
                          setUsersPage(1);
                          loadUsers();
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          usersRoleFilter === "all"
                            ? "bg-color-medium text-white"
                            : "bg-color-lightest text-color-dark hover:bg-color-light"
                        }`}
                      >
                        Все роли
                      </button>
                      <button
                        onClick={() => {
                          setUsersRoleFilter("user");
                          setUsersPage(1);
                          loadUsers();
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          usersRoleFilter === "user"
                            ? "bg-color-medium text-white"
                            : "bg-color-lightest text-color-dark hover:bg-color-light"
                        }`}
                      >
                        Пользователи
                      </button>
                      <button
                        onClick={() => {
                          setUsersRoleFilter("moderator");
                          setUsersPage(1);
                          loadUsers();
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          usersRoleFilter === "moderator"
                            ? "bg-color-medium text-white"
                            : "bg-color-lightest text-color-dark hover:bg-color-light"
                        }`}
                      >
                        Модераторы
                      </button>
                      <button
                        onClick={() => {
                          setUsersRoleFilter("admin");
                          setUsersPage(1);
                          loadUsers();
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          usersRoleFilter === "admin"
                            ? "bg-color-medium text-white"
                            : "bg-color-lightest text-color-dark hover:bg-color-light"
                        }`}
                      >
                        Администраторы
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                      <tr className="border-b border-color-light">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-color-dark w-12">
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === users.length && users.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(new Set(users.map((u) => u.id)));
                              } else {
                                setSelectedUsers(new Set());
                              }
                            }}
                            className="w-4 h-4 text-color-medium rounded focus:ring-color-medium"
                          />
                        </th>
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
                          Статус
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
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedUsers);
                                if (e.target.checked) {
                                  newSelected.add(user.id);
                                } else {
                                  newSelected.delete(user.id);
                                }
                                setSelectedUsers(newSelected);
                              }}
                              className="w-4 h-4 text-color-medium rounded focus:ring-color-medium"
                            />
                          </td>
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
                              <button
                                onClick={() => loadUserDetails(user.id)}
                                className="font-medium text-color-dark hover:text-color-medium transition-colors text-left"
                              >
                                {user.name}
                              </button>
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
                          <td className="py-3 px-4">
                            {user.isBlocked ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Заблокирован
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                Активен
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-color-medium text-sm">
                            {user.adsCount}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 flex-wrap">
                              <Link
                                href={`/user/${user.id}`}
                                className="text-color-medium hover:text-color-dark text-sm font-medium"
                              >
                                Профиль
                              </Link>
                              {user.role !== "admin" && (
                                <>
                                  {user.isBlocked ? (
                                    <button
                                      onClick={() => blockUser(user.id, false)}
                                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                                    >
                                      Разблокировать
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => blockUser(user.id, true)}
                                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                                    >
                                      Заблокировать
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                  >
                                    Удалить
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="text-center py-12 text-color-medium">
                      Пользователи не найдены
                    </div>
                  )}
                </div>
              </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Поиск по тексту отзыва..."
                      value={reviewsSearch}
                      onChange={(e) => {
                        setReviewsSearch(e.target.value);
                        setReviewsPage(1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          loadReviews();
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none"
                    />
                  </div>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-color-lightest rounded-lg p-4 border border-color-light"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-color-light flex items-center justify-center">
                                {review.userId.avatar ? (
                                  <img
                                    src={review.userId.avatar}
                                    alt={review.userId.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  "👤"
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-color-dark">{review.userId.name}</p>
                                <Link
                                  href={`/ads/${review.adId.id}`}
                                  className="text-sm text-color-medium hover:text-color-dark"
                                >
                                  {review.adId.title}
                                </Link>
                              </div>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-lg">
                                  {star <= review.rating ? "⭐" : "☆"}
                                </span>
                              ))}
                            </div>
                            <p className="text-color-dark">{review.comment}</p>
                            <p className="text-xs text-color-medium mt-2">
                              {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-center py-8 text-color-medium">
                        Отзывы не найдены
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* Modal для детального просмотра объявления */}
        {showAdDetails && adDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-color-light p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-color-dark">Детали объявления</h2>
                <button
                  onClick={() => {
                    setShowAdDetails(null);
                    setAdDetails(null);
                  }}
                  className="text-color-medium hover:text-color-dark transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-color-dark mb-2">{adDetails.title}</h3>
                  <div className="text-sm text-color-medium space-y-1">
                    <p><strong>Категория:</strong> {adDetails.category}</p>
                    <p><strong>Цена:</strong> {adDetails.price}</p>
                    <p><strong>Локация:</strong> {adDetails.location}</p>
                    <p><strong>Статус:</strong> <span className={getStatusColor(adDetails.status)}>{getStatusLabel(adDetails.status)}</span></p>
                    <p><strong>Просмотров:</strong> {adDetails.views || 0}</p>
                    <p><strong>Автор:</strong> {adDetails.userId?.name || "Неизвестно"}</p>
                  </div>
                </div>
                {adDetails.images && adDetails.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-color-dark mb-2">Фотографии:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {adDetails.images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt={`${adDetails.title} ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-color-dark mb-2">Описание:</h4>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: adDetails.description }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal для детального просмотра пользователя */}
        {showUserDetails && userDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-color-light p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-color-dark">Детали пользователя</h2>
                <button
                  onClick={() => {
                    setShowUserDetails(null);
                    setUserDetails(null);
                  }}
                  className="text-color-medium hover:text-color-dark transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-color-light flex items-center justify-center text-4xl">
                    {userDetails.user?.avatar ? (
                      <img src={userDetails.user.avatar} alt={userDetails.user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-color-dark">{userDetails.user?.name}</h3>
                    <p className="text-color-medium">{userDetails.user?.email}</p>
                  </div>
                </div>
                <div className="text-sm text-color-medium space-y-2">
                  {userDetails.user?.phone && <p><strong>Телефон:</strong> {userDetails.user.phone}</p>}
                  <p><strong>Объявлений:</strong> {userDetails.ads?.length || 0}</p>
                  {userDetails.user?.createdAt && (
                    <p><strong>Регистрация:</strong> {new Date(userDetails.user.createdAt).toLocaleDateString("ru-RU")}</p>
                  )}
                </div>
                {userDetails.ads && userDetails.ads.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-color-dark mb-2">Объявления пользователя:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userDetails.ads.map((ad) => (
                        <Link
                          key={ad._id}
                          href={`/ads/${ad._id}`}
                          className="block p-3 bg-color-lightest rounded-lg hover:bg-color-light transition-colors"
                        >
                          <p className="font-medium text-color-dark">{ad.title}</p>
                          <p className="text-sm text-color-medium">{ad.price} • {ad.location}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

