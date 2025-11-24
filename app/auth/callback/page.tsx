"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");

    if (userId) {
      // Сохраняем данные пользователя
      localStorage.setItem("userId", userId);
      if (name) localStorage.setItem("userName", name);
      if (email) localStorage.setItem("userEmail", email);
      
      // Устанавливаем авторизацию
      login(userId);
      
      // Перенаправляем на главную страницу
      router.push("/");
    } else {
      // Если нет userId, значит произошла ошибка
      router.push("/login?error=auth_failed");
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen bg-color-lightest flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-medium mx-auto mb-4"></div>
        <p className="text-color-medium">Завершение входа...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-medium mx-auto mb-4"></div>
          <p className="text-color-medium">Загрузка...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

