"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [language, setLanguage] = useState<"ru" | "kz">("ru");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleProtectedLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      router.push("/login");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "ru" ? "kz" : "ru");
  };

  return (
    <nav
      className={`w-full bg-white border-b border-color-light sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "shadow-[0_10px_40px_rgba(63,114,175,0.3)]"
          : "shadow-none"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={120}
              height={48}
              priority
              className="h-auto w-20 sm:w-24 md:w-[120px]"
            />
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-color-dark hover:bg-color-lightest transition-colors text-sm font-medium"
            >
              <span className={language === "ru" ? "font-semibold" : "opacity-50"}>
                RU
              </span>
              <span className="text-color-light">|</span>
              <span className={language === "kz" ? "font-semibold" : "opacity-50"}>
                KZ
              </span>
            </button>

            {/* Chat */}
            <Link
              href="/chat"
              onClick={(e) => handleProtectedLink(e, "/chat")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-color-dark hover:bg-color-lightest transition-colors text-sm font-medium relative"
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="hidden lg:inline">Сообщения</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              onClick={(e) => handleProtectedLink(e, "/profile")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-color-dark hover:bg-color-lightest transition-colors text-sm font-medium"
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="hidden lg:inline">Профиль</span>
            </Link>

            {/* Create ad button */}
            <Link
              href="/create"
              onClick={(e) => handleProtectedLink(e, "/create")}
              className="bg-color-medium text-white px-4 lg:px-5 py-2 rounded-lg font-medium hover:bg-color-dark transition-colors text-sm shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <span className="hidden lg:inline">Создать объявление</span>
              <span className="lg:hidden">Создать</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-color-dark hover:bg-color-lightest transition-colors"
            aria-label="Toggle menu"
          >
            <motion.div
              animate={isMobileMenuOpen ? "open" : "closed"}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? (
                <motion.svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </motion.svg>
              ) : (
                <motion.svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </motion.svg>
              )}
            </motion.div>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-color-light overflow-hidden"
            >
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="py-4 space-y-3"
              >
                {/* Language switcher */}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-color-dark hover:bg-color-lightest transition-colors text-sm font-medium w-full"
                >
                  <span className={language === "ru" ? "font-semibold" : "opacity-50"}>
                    RU
                  </span>
                  <span className="text-color-light">|</span>
                  <span className={language === "kz" ? "font-semibold" : "opacity-50"}>
                    KZ
                  </span>
                </motion.button>

                {/* Chat */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  <Link
                    href="/chat"
                    onClick={(e) => handleProtectedLink(e, "/chat")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-color-dark hover:bg-color-lightest transition-colors text-sm font-medium w-full relative"
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
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Сообщения
                    <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Link>
                </motion.div>

                {/* Profile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                >
                  <Link
                    href="/profile"
                    onClick={(e) => handleProtectedLink(e, "/profile")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-color-dark hover:bg-color-lightest transition-colors text-sm font-medium w-full"
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Профиль
                  </Link>
                </motion.div>

                {/* Create ad button */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.2 }}
                >
                  <Link
                    href="/create"
                    onClick={(e) => handleProtectedLink(e, "/create")}
                    className="block bg-color-medium text-white px-3 py-2 rounded-lg font-medium hover:bg-color-dark transition-colors text-sm shadow-md hover:shadow-lg w-full text-center"
                  >
                    Создать объявление
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

