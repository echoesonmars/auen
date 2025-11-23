"use client";

import { useState } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
    location: "",
    images: [] as File[],
  });

  const categories = [
    "Инструменты",
    "Студии",
    "DJ оборудование",
    "Клавишные",
    "Микрофоны",
    "Аудио",
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        setErrors({ general: "Необходима авторизация. Пожалуйста, войдите в систему." });
        setIsSubmitting(false);
        return;
      }

      // Валидация на клиенте перед отправкой
      const clientErrors: Record<string, string> = {};
      
      if (formData.title.trim().length < 10) {
        clientErrors.title = "Название должно содержать минимум 10 символов";
      }
      if (formData.title.trim().length > 100) {
        clientErrors.title = "Название не должно превышать 100 символов";
      }
      if (!formData.category) {
        clientErrors.category = "Выберите категорию";
      }
      if (formData.description.trim().length < 50) {
        clientErrors.description = "Описание должно содержать минимум 50 символов";
      }
      if (formData.description.trim().length > 2000) {
        clientErrors.description = "Описание не должно превышать 2000 символов";
      }
      if (!/^\d+(\s*₸)?\s*\/\s*(час|день|неделя|месяц)$/i.test(formData.price.trim())) {
        clientErrors.price = "Формат: 5000 ₸/час или 5000 ₸/день";
      }
      if (formData.location.trim().length < 2) {
        clientErrors.location = "Укажите локацию (минимум 2 символа)";
      }
      if (formData.location.trim().length > 50) {
        clientErrors.location = "Локация не должна превышать 50 символов";
      }

      if (Object.keys(clientErrors).length > 0) {
        setErrors(clientErrors);
        setIsSubmitting(false);
        return;
      }

      // Подготовка данных для отправки
      const formDataToSend = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: formData.price.trim(),
        location: formData.location.trim(),
        images: [], // Пока оставляем пустым, так как загрузка файлов требует отдельного endpoint
        userId,
      };

      console.log("Sending ad data:", formDataToSend);

      const response = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataToSend),
      });

      // Проверяем, что ответ является JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 500));
        setErrors({ general: `Ошибка сервера (${response.status}). Проверьте консоль для деталей.` });
        setIsSubmitting(false);
        return;
      }

      let result;
      try {
        result = await response.json();
        console.log("Response status:", response.status);
        console.log("Response data:", result);
      } catch (jsonError: any) {
        console.error("JSON parse error:", jsonError);
        const text = await response.text();
        console.error("Response text:", text.substring(0, 500));
        setErrors({ general: `Ошибка парсинга ответа сервера (${response.status}). Проверьте консоль для деталей.` });
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ general: result.message || result.error || "Ошибка при создании объявления" });
        }
        setIsSubmitting(false);
        return;
      }

      // Успешно создано
      alert("Объявление успешно создано!");
      window.location.href = "/profile";
    } catch (error: any) {
      console.error("Error creating ad:", error);
      setErrors({ general: error.message || "Ошибка при создании объявления. Проверьте подключение к интернету." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, images: Array.from(e.target.files) });
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
            Создать объявление
          </TextAnimate>
          <TextAnimate
            as="p"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.2}
            className="text-base sm:text-lg text-color-medium mb-8 sm:mb-12"
          >
            Заполните форму, чтобы разместить ваше объявление
          </TextAnimate>
        </BlurFade>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <BlurFade inView={true} delay={0.3} direction="up">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-color-dark mb-6">
                Основная информация
              </h2>
              
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Название объявления *
                  </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (errors.title) setErrors({ ...errors, title: "" });
                      }}
                      placeholder="Например: Электрогитара Fender Stratocaster"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.title ? "border-red-500" : "border-color-light"
                      } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                    />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                  <p className="text-xs text-color-medium mt-1">
                    Минимум 10 символов, максимум 100 символов
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Категория *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark bg-white"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Цена за час/день *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        if (errors.price) setErrors({ ...errors, price: "" });
                      }}
                      placeholder="5000 ₸/час или 5000 ₸/день"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.price ? "border-red-500" : "border-color-light"
                      } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                    )}
                    <p className="text-xs text-color-medium mt-1">
                      Формат: 5000 ₸/час, 5000 ₸/день, 5000 ₸/неделя или 5000 ₸/месяц
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Локация *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Алматы"
                    className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Описание *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) setErrors({ ...errors, description: "" });
                    }}
                    placeholder="Опишите ваш товар или услугу подробно..."
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.description ? "border-red-500" : "border-color-light"
                    } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium resize-none`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-color-medium mt-1">
                    Минимум 50 символов, максимум 2000 символов. Сейчас: {formData.description.length} символов
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Фотографии
                  </label>
                  <div className="border-2 border-dashed border-color-light rounded-lg p-6 text-center hover:border-color-medium transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <svg
                        className="w-12 h-12 text-color-medium"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="text-sm text-color-medium">
                        Нажмите для загрузки или перетащите файлы
                      </span>
                      {formData.images.length > 0 && (
                        <span className="text-xs text-color-dark mt-2">
                          Выбрано файлов: {formData.images.length}
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>

          {errors.general && (
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.general}
              </div>
            </BlurFade>
          )}

          <BlurFade inView={true} delay={0.4} direction="up">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Создание..." : "Опубликовать объявление"}
                </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-medium border border-color-light text-color-dark hover:bg-color-lightest transition-all duration-200 text-base"
              >
                Сохранить черновик
              </button>
            </div>
          </BlurFade>
        </form>
      </div>
    </div>
  );
}

