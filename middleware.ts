import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Матчеры для защищенных маршрутов
const protectedRoutes = ["/admin", "/profile", "/create", "/chat"];
const adminRoutes = ["/admin"];
const apiAdminRoutes = ["/api/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверка защищенных маршрутов (требуют авторизации)
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Проверка админских маршрутов
  const isAdminRoute =
    adminRoutes.some((route) => pathname.startsWith(route)) ||
    apiAdminRoutes.some((route) => pathname.startsWith(route));

  // Получаем токен из cookies (если используется) или из headers
  const authToken = request.cookies.get("auth_token")?.value;
  
  // Также проверяем наличие userId в cookies (если используется server-side auth)
  const userId = request.cookies.get("userId")?.value;

  // Для API роутов - пропускаем, они сами обрабатывают авторизацию
  // (проверка ролей требует обращения к БД, что делается в API route)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Для статических файлов и публичных маршрутов - пропускаем
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/locations") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next();
  }

  // Для /ads/[id] - пропускаем (публичные страницы объявлений)
  if (pathname.match(/^\/ads\/[^/]+$/)) {
    return NextResponse.next();
  }

  // Для /user/[id] - пропускаем (публичные профили пользователей)
  if (pathname.match(/^\/user\/[^/]+$/)) {
    return NextResponse.next();
  }

  // Для админских страниц проверяем базовую авторизацию
  // Детальная проверка роли будет на самой странице
  if (isAdminRoute && !authToken && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Для защищенных маршрутов проверяем авторизацию
  if (isProtectedRoute && !authToken && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Конфигурация матчера для маршрутов
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - API routes that handle their own auth
     */
    "/((?!_next/static|_next/image|favicon.ico|images|uploads|.*\\..*).*)",
  ],
};

