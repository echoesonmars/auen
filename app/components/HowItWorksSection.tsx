"use client";

import { useState, useEffect } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

const steps = [
  {
    icon: "🔍",
    title: "Найдите нужное",
    description: "Используйте поиск или выберите категорию, чтобы найти инструмент или студию",
  },
  {
    icon: "💬",
    title: "Свяжитесь с владельцем",
    description: "Напишите владельцу через встроенный мессенджер и обсудите детали",
  },
  {
    icon: "📅",
    title: "Забронируйте",
    description: "Договоритесь о времени и условиях аренды напрямую с владельцем",
  },
  {
    icon: "🎵",
    title: "Творите",
    description: "Получите доступ к инструменту или студии и создавайте свою музыку",
  },
];

export default function HowItWorksSection() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Показываем секцию после popular ads section
    const heroHeight = 700;
    const categoriesHeight = 200;
    const popularAdsHeight = 600;
    const threshold = heroHeight + categoriesHeight + popularAdsHeight * 0.3;
    setIsVisible(scrollY > threshold);
  }, [scrollY]);

  return (
    <section 
      className={`pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20 bg-white relative z-10 -mt-1 transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <TextAnimate
            as="h2"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-color-dark mb-4 text-center"
          >
            Как это работает
          </TextAnimate>
          <TextAnimate
            as="p"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.2}
            className="text-base sm:text-lg text-color-medium mb-12 text-center max-w-2xl mx-auto"
          >
            Простой и удобный способ арендовать музыкальное оборудование
          </TextAnimate>
        </BlurFade>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          {steps.map((step, index) => (
            <BlurFade
              key={index}
              inView={true}
              delay={0.3 + index * 0.1}
              direction="up"
            >
              <div className="text-center relative">
                <div className="text-5xl sm:text-6xl mb-4">{step.icon}</div>
                <h3 className="text-xl sm:text-2xl font-bold text-color-dark mb-3">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-color-medium leading-relaxed">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-color-light -z-10">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-color-medium rounded-full"></div>
                  </div>
                )}
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

