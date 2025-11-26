"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useMetadata } from "@/app/hooks/useMetadata";

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
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

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    loadBlogs();
  }, [selectedCategory]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory === "all" ? "" : `&category=${selectedCategory}`;
      const response = await fetch(`/api/blog?status=published${categoryParam}`, {
        cache: 'no-store'
      });
      const result = await response.json();

      if (result.success) {
        setBlogPosts(result.data || []);
      }
    } catch (error) {
      console.error("Error loading blogs:", error);
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

  const filteredPosts = blogPosts;

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

        {/* Create Blog Button */}
        <BlurFade inView={true} delay={0.25} direction="up">
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => {
                const userId = localStorage.getItem("userId");
                if (!userId) {
                  router.push("/login?redirect=/blog/create");
                } else {
                  router.push("/blog/create");
                }
              }}
              className="px-6 py-3 bg-color-medium text-white rounded-lg font-semibold hover:bg-color-dark transition-all duration-200 shadow-md hover:shadow-lg"
            >
              + Написать статью
            </button>
          </div>
        </BlurFade>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex justify-center items-center space-x-2">
              <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPosts.map((post, index) => (
              <BlurFade key={post._id} inView={true} delay={0.1 * (index % 3)} direction="up">
                <Link href={`/blog/${post._id}`}>
                  <article className="bg-white rounded-xl sm:rounded-2xl border border-color-light overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full flex flex-col">
                    <div className="p-6 sm:p-8 flex-1 flex flex-col">
                      <div className="text-6xl mb-4 flex-shrink-0">{post.image || "📝"}</div>
                      
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
                          <span>{post.authorId?.name || "Неизвестно"}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{formatDate(post.createdAt)}</span>
                          <span>•</span>
                          <span>{post.readTime} мин</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </BlurFade>
            ))}
          </div>
        )}

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

