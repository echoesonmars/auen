"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Пароли не совпадают" });
      setLoading(false);
      return;
    }
    if (!formData.agreeToTerms) {
      setErrors({ agreeToTerms: "Необходимо согласиться с условиями" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          agreeToTerms: formData.agreeToTerms,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      // Проверяем, что ответ является JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 500));
        setErrors({ 
          general: `Ошибка сервера (${response.status}). Проверьте подключение к базе данных. Детали в консоли.` 
        });
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await response.json();
        console.log("Response data:", result);
      } catch (jsonError: unknown) {
        console.error("JSON parse error:", jsonError);
        const text = await response.text();
        console.error("Response text:", text.substring(0, 500));
        setErrors({ 
          general: `Ошибка парсинга ответа сервера. Проверьте консоль для деталей.` 
        });
        setLoading(false);
        return;
      }

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ general: result.message || "Ошибка регистрации" });
        }
        setLoading(false);
        return;
      }

      // Сохраняем данные пользователя
      localStorage.setItem("userId", result.data.id);
      localStorage.setItem("userName", result.data.name);
      
      // Устанавливаем авторизацию
      login(result.data.id);
      
      // Перенаправляем на главную страницу
      router.push("/");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Register error:", err);
      setErrors({ general: err.message || "Ошибка при регистрации. Проверьте подключение к интернету." });
      setLoading(false);
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
              Зарегистрироваться
            </TextAnimate>
            <TextAnimate
              as="p"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.2}
              className="text-sm sm:text-base text-color-medium mb-6 sm:mb-8"
            >
              Создайте аккаунт, чтобы начать использовать платформу
            </TextAnimate>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <BlurFade inView={true} delay={0.3} direction="up">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    placeholder="Ваше имя"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.name ? "border-red-500" : "border-color-light"
                    } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.4} direction="up">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.email ? "border-red-500" : "border-color-light"
                    } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.5} direction="up">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }}
                    placeholder="+7 (777) 123-45-67"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.phone ? "border-red-500" : "border-color-light"
                    } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.6} direction="up">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    placeholder="Минимум 8 символов (заглавная, строчная буква, цифра)"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.password ? "border-red-500" : "border-color-light"
                    } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  <p className="text-xs text-color-medium mt-1">
                    Пароль должен содержать минимум 8 символов, заглавную и строчную буквы, а также цифру
                  </p>
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.7} direction="up">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                    }}
                    placeholder="Повторите пароль"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.confirmPassword ? "border-red-500" : "border-color-light"
                    } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </BlurFade>

              <BlurFade inView={true} delay={0.8} direction="up">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreeToTerms}
                    onChange={(e) => {
                      setFormData({ ...formData, agreeToTerms: e.target.checked });
                      if (errors.agreeToTerms) setErrors({ ...errors, agreeToTerms: "" });
                    }}
                    className="w-4 h-4 mt-1 rounded border-color-light text-color-medium focus:ring-color-medium"
                  />
                  <label className="text-sm text-color-dark cursor-pointer">
                    Я согласен с{" "}
                    <Link
                      href="/terms"
                      className="text-color-medium font-semibold hover:text-color-dark transition-colors"
                    >
                      условиями использования
                    </Link>{" "}
                    и{" "}
                    <Link
                      href="/privacy"
                      className="text-color-medium font-semibold hover:text-color-dark transition-colors"
                    >
                      политикой конфиденциальности
                    </Link>
                  </label>
                </div>
                {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
              </BlurFade>

              <BlurFade inView={true} delay={0.9} direction="up">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Регистрация..." : "Зарегистрироваться"}
                </button>
              </BlurFade>
            </form>

            <BlurFade inView={true} delay={1.0} direction="up">
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-color-light">
                <p className="text-center text-sm text-color-medium mb-4">
                  Уже есть аккаунт?{" "}
                  <Link
                    href="/login"
                    className="text-color-medium font-semibold hover:text-color-dark transition-colors"
                  >
                    Войти
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
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/auth/google?action=register");
                      const result = await response.json();
                      
                      if (result.success && result.url) {
                        window.location.href = result.url;
                      } else {
                        showToast(result.message || "Ошибка при подключении к Google", "error");
                      }
                    } catch (error) {
                      console.error("Google OAuth error:", error);
                      showToast("Ошибка при подключении к Google", "error");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-color-light hover:bg-color-lightest transition-all duration-200 text-sm font-medium text-color-dark"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Зарегистрироваться через Google
                </button>
              </div>
            </BlurFade>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
