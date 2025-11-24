"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Проверяем наличие токена в localStorage при загрузке
    const token = localStorage.getItem("auth_token");
    setIsAuthenticated(!!token);
  }, []);

  const login = (userId: string) => {
    localStorage.setItem("auth_token", "authenticated");
    localStorage.setItem("userId", userId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    const userId = localStorage.getItem("userId");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("userId");
    // Очищаем данные чата с AI для текущего пользователя
    if (userId) {
      localStorage.removeItem(`auen-ai-messages-${userId}`);
    }
    setIsAuthenticated(false);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

