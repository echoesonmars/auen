"use client";

import Link from "next/link";
import Image from "next/image";
import { BlurFade } from "@/components/ui/blur-fade";

export default function Footer() {
  return (
    <footer className="bg-color-dark text-white pt-6 sm:pt-8 md:pt-10 pb-6 sm:pb-8 md:pb-10 relative z-10 rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2rem] lg:rounded-t-[3rem]">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          <BlurFade inView={true} delay={0.1} direction="up">
            <div>
              <Link href="/" className="flex items-center mb-4">
                <Image
                  src="/images/logo.svg"
                  alt="Logo"
                  width={120}
                  height={48}
                  className="h-auto w-24 sm:w-[120px] brightness-0 invert"
                />
              </Link>
              <p className="text-sm text-white/70 leading-relaxed">
                Платформа для аренды музыкального оборудования, студий и инструментов в Казахстане.
              </p>
            </div>
          </BlurFade>

          <BlurFade inView={true} delay={0.2} direction="up">
            <div>
              <h3 className="font-bold text-lg mb-4">Платформа</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/ads" className="text-white/70 hover:text-white transition-colors">
                    Все объявления
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="text-white/70 hover:text-white transition-colors">
                    Создать объявление
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-white/70 hover:text-white transition-colors">
                    Мой профиль
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="text-white/70 hover:text-white transition-colors">
                    Сообщения
                  </Link>
                </li>
              </ul>
            </div>
          </BlurFade>

          <BlurFade inView={true} delay={0.3} direction="up">
            <div>
              <h3 className="font-bold text-lg mb-4">Помощь</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="text-white/70 hover:text-white transition-colors">
                    Как это работает
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-white/70 hover:text-white transition-colors">
                    Частые вопросы
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="text-white/70 hover:text-white transition-colors">
                    Безопасность
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-white/70 hover:text-white transition-colors">
                    Поддержка
                  </Link>
                </li>
              </ul>
            </div>
          </BlurFade>

          <BlurFade inView={true} delay={0.4} direction="up">
            <div>
              <h3 className="font-bold text-lg mb-4">Правовая информация</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-white/70 hover:text-white transition-colors">
                    Условия использования
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link href="/rules" className="text-white/70 hover:text-white transition-colors">
                    Правила платформы
                  </Link>
                </li>
              </ul>
            </div>
          </BlurFade>
        </div>

        <BlurFade inView={true} delay={0.5} direction="up">
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/70">
            <p>© 2024 Auen. Все права защищены.</p>
          </div>
        </BlurFade>
      </div>
    </footer>
  );
}

