"use client";

import { useState } from "react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useMetadata } from "@/app/hooks/useMetadata";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useMetadata(
    "Блог | Auen",
    "Полезные статьи, советы и новости из мира музыки. Узнайте, как выбрать музыкальное оборудование, настроить студию и многое другое."
  );

  const categories = [
    { id: "all", name: "Все статьи" },
    { id: "tips", name: "Советы" },
    { id: "reviews", name: "Обзоры" },
    { id: "news", name: "Новости" },
    { id: "guides", name: "Гайды" },
  ];

  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "Как выбрать идеальную студию звукозаписи",
      excerpt: "Руководство по выбору студии, подходящей именно вам. Рассматриваем важные аспекты: оборудование, акустика, стоимость и расположение.",
      author: "Айдын Абдуллин",
      date: "15 января 2025",
      category: "guides",
      image: "🎙️",
      readTime: "5 мин",
    },
    {
      id: "2",
      title: "Топ-10 музыкальных инструментов для начинающих",
      excerpt: "Разбираем лучшие инструменты для тех, кто только начинает свой путь в музыке. От гитары до синтезатора - что выбрать?",
      author: "Марат Касымов",
      date: "12 января 2025",
      category: "tips",
      image: "🎸",
      readTime: "7 мин",
    },
    {
      id: "3",
      title: "Обзор новейшего DJ-оборудования 2025",
      excerpt: "Что нового в мире DJ-техники? Разбираем последние модели контроллеров, микшеров и другого профессионального оборудования.",
      author: "Диана Смагулова",
      date: "10 января 2025",
      category: "reviews",
      image: "🎧",
      readTime: "10 мин",
    },
    {
      id: "4",
      title: "Акустика в домашней студии: секреты профессионалов",
      excerpt: "Как правильно организовать акустику в домашней студии звукозаписи без больших затрат. Практические советы от опытных звукорежиссеров.",
      author: "Ерлан Жумабеков",
      date: "8 января 2025",
      category: "tips",
      image: "🔊",
      readTime: "8 мин",
    },
    {
      id: "5",
      title: "Музыкальная индустрия Казахстана: тенденции 2025",
      excerpt: "Анализ текущего состояния музыкальной индустрии в Казахстане. Какие направления развиваются, что ждет музыкантов в ближайшем будущем?",
      author: "Алма Ахметова",
      date: "5 января 2025",
      category: "news",
      image: "📰",
      readTime: "12 мин",
    },
    {
      id: "6",
      title: "Как записать первый сингл: пошаговый гайд",
      excerpt: "Подробное руководство для музыкантов, которые хотят записать свой первый сингл. От подготовки до релиза - все этапы разобраны детально.",
      author: "Нурлан Токтаров",
      date: "3 января 2025",
      category: "guides",
      image: "🎵",
      readTime: "15 мин",
    },
  ];

  const filteredPosts =
    selectedCategory === "all"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-color-lightest">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20">
        <BlurFade inView={true} delay={0.1} direction="up">
          <TextAnimate
            as="h1"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-color-dark mb-4"
          >
            Блог
          </TextAnimate>
          <TextAnimate
            as="p"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.2}
            className="text-lg sm:text-xl text-color-medium mb-8 sm:mb-12"
          >
            Полезные статьи, советы и новости из мира музыки
          </TextAnimate>
        </BlurFade>

        {/* Categories */}
        <BlurFade inView={true} delay={0.3} direction="up">
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-color-medium text-white shadow-lg"
                    : "bg-white text-color-dark border border-color-light hover:border-color-medium hover:shadow-md"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </BlurFade>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPosts.map((post, index) => (
            <BlurFade key={post.id} inView={true} delay={0.1 * (index % 3)} direction="up">
              <Link href={`/blog/${post.id}`}>
                <article className="bg-white rounded-xl sm:rounded-2xl border border-color-light overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full flex flex-col">
                  <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="text-6xl mb-4 flex-shrink-0">{post.image}</div>
                    
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-color-lightest text-color-medium text-xs font-medium rounded-full">
                        {categories.find((c) => c.id === post.category)?.name || post.category}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-color-dark mb-3 line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-color-medium text-sm sm:text-base mb-4 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between text-xs sm:text-sm text-color-medium pt-4 border-t border-color-light mt-auto">
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </BlurFade>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <BlurFade inView={true} delay={0.3} direction="up">
            <div className="text-center py-12 sm:py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-color-dark mb-2">
                Пока нет статей в этой категории
              </h3>
              <p className="text-color-medium">
                Попробуйте выбрать другую категорию
              </p>
            </div>
          </BlurFade>
        )}
      </div>
    </div>
  );
}

