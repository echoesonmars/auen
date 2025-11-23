"use client";

import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-color-lightest flex items-center justify-center py-8 sm:py-12 md:py-20 px-4 sm:px-6">
      <div className="w-full max-w-2xl mx-auto text-center">
        <BlurFade inView={true} delay={0.1} direction="up">
          <div className="mb-8 sm:mb-12">
            <TextAnimate
              as="h1"
              animation="slideUp"
              by="character"
              startOnView={true}
              delay={0.1}
              className="text-8xl sm:text-9xl md:text-[12rem] font-bold text-color-medium mb-4 sm:mb-6"
            >
              404
            </TextAnimate>
            <TextAnimate
              as="h2"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.3}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-color-dark mb-4 sm:mb-6"
            >
              Страница не найдена
            </TextAnimate>
            <TextAnimate
              as="p"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.5}
              className="text-base sm:text-lg text-color-medium mb-8 sm:mb-12 max-w-md mx-auto"
            >
              К сожалению, страница, которую вы ищете, не существует или была перемещена.
            </TextAnimate>
          </div>
        </BlurFade>

        <BlurFade inView={true} delay={0.7} direction="up">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="bg-color-medium text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 text-base sm:text-lg w-full sm:w-auto"
            >
              Вернуться на главную
            </Link>
            <Link
              href="/create"
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-medium border border-color-light text-color-dark hover:bg-color-lightest transition-all duration-200 text-base sm:text-lg w-full sm:w-auto"
            >
              Создать объявление
            </Link>
          </div>
        </BlurFade>

        <BlurFade inView={true} delay={0.9} direction="up">
          <div className="mt-12 sm:mt-16">
            <div className="inline-flex items-center gap-2 text-color-medium text-sm sm:text-base">
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Или воспользуйтесь поиском на главной странице</span>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

