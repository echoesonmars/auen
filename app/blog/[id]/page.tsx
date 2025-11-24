"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Обрабатываем params как Promise или обычный объект
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  const router = useRouter();

  // В реальном приложении здесь был бы запрос к API
  const post: BlogPost | null = {
    id: id,
    title: "Как выбрать идеальную студию звукозаписи",
    content: `
      <p>Выбор студии звукозаписи - это важный шаг для любого музыканта. Правильный выбор может определить успех вашего проекта, в то время как неправильный может привести к разочарованию и лишним затратам.</p>
      
      <h2>1. Оборудование</h2>
      <p>Одним из первых факторов, на которые стоит обратить внимание, является оборудование студии. Современные студии должны иметь профессиональное оборудование, включая качественные микрофоны, предусилители, аудиоинтерфейсы и мониторы.</p>
      
      <h2>2. Акустика</h2>
      <p>Акустика помещения играет критическую роль в качестве записи. Хорошая студия должна иметь профессиональную акустическую обработку, которая позволяет получать чистый звук без лишних отражений и реверберации.</p>
      
      <h2>3. Стоимость</h2>
      <p>Стоимость аренды студии может значительно варьироваться. Важно найти баланс между качеством и доступностью. Не всегда самая дорогая студия - лучший выбор для вашего проекта.</p>
      
      <h2>4. Расположение</h2>
      <p>Удобное расположение студии может сэкономить вам время и нервы, особенно если вы планируете несколько сессий записи.</p>
      
      <h2>Заключение</h2>
      <p>Выбор студии - это индивидуальный процесс, который зависит от ваших потребностей, бюджета и предпочтений. Не торопитесь с решением и обязательно посетите студию лично перед окончательным выбором.</p>
    `,
    author: "Айдын Абдуллин",
    date: "15 января 2025",
    category: "guides",
    image: "🎙️",
    readTime: "5 мин",
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-color-dark mb-4">Статья не найдена</h1>
          <Link
            href="/blog"
            className="text-color-medium hover:text-color-dark transition-colors"
          >
            Вернуться к блогу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-color-lightest">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20">
        {/* Back Button */}
        <BlurFade inView={true} delay={0.1} direction="up">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-color-medium hover:text-color-dark transition-colors mb-6 sm:mb-8"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Назад к блогу
          </button>
        </BlurFade>

        {/* Article Header */}
        <BlurFade inView={true} delay={0.2} direction="up">
          <div className="mb-6 sm:mb-8">
            <div className="text-8xl mb-6">{post.image}</div>
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-color-lightest text-color-medium text-sm font-medium rounded-full">
                {post.category === "guides" ? "Гайды" : 
                 post.category === "tips" ? "Советы" :
                 post.category === "reviews" ? "Обзоры" :
                 post.category === "news" ? "Новости" : post.category}
              </span>
            </div>
            <TextAnimate
              as="h1"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-color-dark mb-6"
            >
              {post.title}
            </TextAnimate>
            <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-color-medium">
              <div className="flex items-center gap-2">
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{post.author}</span>
              </div>
              <span>•</span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime} чтения</span>
            </div>
          </div>
        </BlurFade>

        {/* Article Content */}
        <BlurFade inView={true} delay={0.3} direction="up">
          <article className="bg-white rounded-xl sm:rounded-2xl border border-color-light p-6 sm:p-8 md:p-12">
            <div
              className="prose prose-lg max-w-none text-color-dark"
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{
                lineHeight: "1.8",
              }}
            />
          </article>
        </BlurFade>

        {/* Related Articles */}
        <BlurFade inView={true} delay={0.4} direction="up">
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-color-light">
            <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-6 sm:mb-8">
              Читайте также
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Link
                href="/blog/2"
                className="bg-white rounded-xl border border-color-light p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="text-4xl mb-3">🎸</div>
                <h3 className="text-lg font-bold text-color-dark mb-2">
                  Топ-10 музыкальных инструментов для начинающих
                </h3>
                <p className="text-sm text-color-medium">7 мин чтения</p>
              </Link>
              <Link
                href="/blog/3"
                className="bg-white rounded-xl border border-color-light p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="text-4xl mb-3">🎧</div>
                <h3 className="text-lg font-bold text-color-dark mb-2">
                  Обзор новейшего DJ-оборудования 2025
                </h3>
                <p className="text-sm text-color-medium">10 мин чтения</p>
              </Link>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

