"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { useToast } from "@/components/ui/toast";

export default function CreateBlogPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "tips" as "tips" | "reviews" | "news" | "guides",
    image: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    if (!userId) {
      showToast("Необходима авторизация", "warning");
      router.push("/login?redirect=/blog/create");
      return;
    }

    if (!formData.title || !formData.excerpt || !formData.content) {
      showToast("Заполните все обязательные поля", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          authorId: userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Статья успешно создана!", "success");
        router.push(`/blog/${result.data._id}`);
      } else {
        showToast(result.message || "Ошибка при создании статьи", "error");
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      showToast("Ошибка при создании статьи", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-color-lightest py-8 sm:py-12 md:py-20">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <h1 className="text-3xl sm:text-4xl font-bold text-color-dark mb-8">
            Написать статью
          </h1>
        </BlurFade>

        <BlurFade inView={true} delay={0.2} direction="up">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-color-light p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-color-dark mb-2">
                Заголовок *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Введите заголовок статьи"
                className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                required
                minLength={10}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-color-dark mb-2">
                Краткое описание *
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Краткое описание статьи (будет отображаться в списке)"
                className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark resize-none"
                rows={3}
                required
                minLength={50}
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-color-dark mb-2">
                Содержание *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Текст статьи"
                className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark resize-none"
                rows={15}
                required
                minLength={200}
                maxLength={50000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-color-dark mb-2">
                Категория *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof formData.category })}
                className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark"
                required
              >
                <option value="tips">Советы</option>
                <option value="reviews">Обзоры</option>
                <option value="news">Новости</option>
                <option value="guides">Гайды</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-color-dark mb-2">
                Эмодзи/Иконка (опционально)
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="🎙️"
                className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark text-2xl"
                maxLength={2}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-color-medium text-white py-3 rounded-lg font-semibold hover:bg-color-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isSubmitting ? "Создание..." : "Создать статью"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 rounded-lg border border-color-light text-color-dark hover:bg-color-lightest transition-all"
              >
                Отмена
              </button>
            </div>
          </form>
        </BlurFade>
      </div>
    </div>
  );
}

