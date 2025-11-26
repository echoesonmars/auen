"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  category: string;
  image?: string;
  readTime: number;
  views: number;
  createdAt: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlog();
  }, [id]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${id}`, {
        cache: 'no-store'
      });
      const result = await response.json();

      if (result.success) {
        setPost(result.data);
      } else {
        setError(result.message || "Статья не найдена");
      }
    } catch (error) {
      console.error("Error loading blog:", error);
      setError("Ошибка при загрузке статьи");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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

  if (error || !post) {
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
            <div className="text-8xl mb-6">{post.image || "📝"}</div>
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
                <span>{post.authorId?.name || "Неизвестно"}</span>
              </div>
              <span>•</span>
              <span>{formatDate(post.createdAt)}</span>
              <span>•</span>
              <span>{post.readTime} мин чтения</span>
              <span>•</span>
              <span>{post.views} просмотров</span>
            </div>
          </div>
        </BlurFade>

        {/* Article Content */}
        <BlurFade inView={true} delay={0.3} direction="up">
          <article className="bg-white rounded-xl sm:rounded-2xl border border-color-light p-6 sm:p-8 md:p-12">
            <div
              className="prose prose-lg max-w-none text-color-dark whitespace-pre-wrap"
              style={{
                lineHeight: "1.8",
              }}
            >
              {post.content}
            </div>
          </article>
        </BlurFade>
      </div>
    </div>
  );
}

