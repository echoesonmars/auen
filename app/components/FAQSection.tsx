"use client";

import { useState } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Как быстро я могу арендовать оборудование?",
      answer: "После выбора оборудования и связи с владельцем, аренда может быть оформлена в течение нескольких часов. Всё зависит от доступности оборудования и скорости ответа владельца.",
    },
    {
      question: "Какие гарантии безопасности предоставляет платформа?",
      answer: "Мы проверяем всех пользователей, ведем систему рейтингов и отзывов. Все сделки защищены нашей платформой, а в случае проблем наша служба поддержки всегда готова помочь.",
    },
    {
      question: "Что делать, если оборудование повреждено?",
      answer: "Немедленно свяжитесь с владельцем и нашей службой поддержки. Мы поможем объективно оценить ситуацию и найти справедливое решение для обеих сторон.",
    },
    {
      question: "Можно ли продлить срок аренды?",
      answer: "Да, конечно! Просто свяжитесь с владельцем через встроенный мессенджер и договоритесь о продлении. Если оборудование доступно, владелец обычно идет навстречу.",
    },
    {
      question: "Как оставить отзыв о владельце?",
      answer: "После завершения аренды вы автоматически получите возможность оставить отзыв. Это помогает другим пользователям сделать правильный выбор.",
    },
    {
      question: "Какие способы оплаты доступны?",
      answer: "Оплата происходит напрямую между арендатором и владельцем. Мы рекомендуем использовать безопасные способы оплаты и всегда сохранять чеки и скриншоты переговоров.",
    },
  ];

  return (
    <section className="relative z-20 bg-color-lightest w-full rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2rem] lg:rounded-t-[3rem]">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-6 sm:pb-8 md:pb-10">
        <TextAnimate
          as="h2"
          animation="slideUp"
          by="word"
          startOnView={true}
          delay={0.1}
          className="text-color-dark text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-6 md:mb-8 text-center"
        >
          Часто задаваемые вопросы
        </TextAnimate>
        
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <BlurFade
              key={index}
              inView={true}
              delay={index * 0.1}
              direction="up"
            >
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light overflow-hidden transition-all duration-200 hover:shadow-xl">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-4 sm:px-5 md:px-6 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-color-lightest transition-colors"
                >
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-color-dark pr-4 sm:pr-6 flex-1">
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-color-medium flex items-center justify-center transition-all duration-200 ${openIndex === index ? 'rotate-180 bg-color-dark' : ''}`}>
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                    <p className="text-xs sm:text-sm md:text-base text-color-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

