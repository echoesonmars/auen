"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";

export default function CategoriesSection() {
  const categories = [
    { icon: "🎸", name: "Инструменты" },
    { icon: "🎙️", name: "Студии" },
    { icon: "🎧", name: "DJ оборудование" },
    { icon: "🎹", name: "Клавишные" },
    { icon: "🎤", name: "Микрофоны" },
    { icon: "🔊", name: "Аудио" },
  ];

  return (
    <section className="relative z-30 bg-color-medium w-full rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2rem] lg:rounded-t-[3rem]">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-6 sm:pb-8">
        <TextAnimate
          as="h2"
          animation="slideUp"
          by="word"
          startOnView={true}
          delay={0.1}
          className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-6 md:mb-8 text-center"
        >
          Популярные категории
        </TextAnimate>
        
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {categories.map((category, index) => (
            <BlurFade
              key={index}
              inView={true}
              delay={index * 0.05}
              direction="up"
              className="w-full"
            >
              <button className="group w-full aspect-square bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200">
                <div className="text-2xl sm:text-3xl md:text-4xl transform transition-transform duration-200 group-hover:scale-110">
                  {category.icon}
                </div>
                <span className="text-white text-[9px] sm:text-[10px] md:text-xs font-medium text-center leading-tight line-clamp-2">
                  {category.name}
                </span>
              </button>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
