"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Ошибка входа");
        return;
      }

      // Сохраняем данные пользователя
      localStorage.setItem("userId", result.data.id);
      localStorage.setItem("userName", result.data.name);
      
      // Устанавливаем авторизацию
      login(result.data.id);
      
      // Перенаправляем на главную страницу
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      alert("Ошибка при входе");
    }
  };

  return (
    <div className="min-h-screen bg-color-lightest py-8 sm:py-12 md:py-20">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6">
        <BlurFade inView={true} delay={0.1} direction="up">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
            <TextAnimate
              as="h1"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.1}
              className="text-3xl sm:text-4xl font-bold text-color-dark mb-2"
            >
              Войти
            </TextAnimate>
            <TextAnimate
              as="p"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.2}
              className="text-sm sm:text-base text-color-medium mb-6 sm:mb-8"
            >
              Войдите в свой аккаунт, чтобы продолжить
            </TextAnimate>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <BlurFade inView={true} delay={0.3} direction="up">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium"
                  />
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.4} direction="up">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Введите пароль"
                    className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium"
                  />
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.5} direction="up">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        setFormData({ ...formData, rememberMe: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-color-light text-color-medium focus:ring-color-medium"
                    />
                    <span className="text-sm text-color-dark">Запомнить меня</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-color-medium hover:text-color-medium font-medium transition-colors"
                  >
                    Забыли пароль?
                  </Link>
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.6} direction="up">
                <button
                  type="submit"
                  className="w-full bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 text-base"
                >
                  Войти
                </button>
              </BlurFade>
            </form>

            <BlurFade inView={true} delay={0.7} direction="up">
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-color-light">
                <p className="text-center text-sm text-color-medium mb-4">
                  Нет аккаунта?{" "}
                  <Link
                    href="/register"
                    className="text-color-medium font-semibold hover:text-color-dark transition-colors"
                  >
                    Зарегистрироваться
                  </Link>
                </p>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-color-light"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-color-medium">или</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-color-light hover:bg-color-lightest transition-all duration-200 text-sm font-medium text-color-dark"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Войти через Google
                </button>
              </div>
            </BlurFade>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
