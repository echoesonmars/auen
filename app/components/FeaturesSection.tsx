"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

export default function FeaturesSection() {
  const features = [
    {
      icon: "⚡",
      title: "Быстро",
      description: "Найдите и забронируйте оборудование за минуты",
    },
    {
      icon: "💰",
      title: "Выгодно",
      description: "Экономьте деньги, арендуя вместо покупки",
    },
    {
      icon: "🛡️",
      title: "Безопасно",
      description: "Проверенные владельцы и защищенные сделки",
    },
    {
      icon: "⭐",
      title: "Надежно",
      description: "Система отзывов и рейтингов для вашего спокойствия",
    },
  ];

  return (
    <section className="relative z-25 bg-color-medium w-full">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <TextAnimate
          as="h2"
          animation="slideUp"
          by="word"
          startOnView={true}
          delay={0.1}
          className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-6 md:mb-8 text-center"
        >
          Ключевые фичи
        </TextAnimate>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {features.map((feature, index) => (
            <BlurFade
              key={index}
              inView={true}
              delay={index * 0.1}
              direction="up"
              className="w-full"
            >
              <div className="bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center transition-all duration-200 group">
                <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-white text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/80 text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
