import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    // Всегда используем origin из запроса для гарантии правильного redirect URI
    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback/google`;
    
    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          message: "Google OAuth не настроен. Отсутствует GOOGLE_CLIENT_ID",
        },
        { status: 500 }
      );
    }

    // Логируем redirect URI для отладки (только в development)
    if (process.env.NODE_ENV === "development") {
      console.log("Google OAuth redirect URI:", redirectUri);
      console.log("Origin:", origin);
    }

    // Получаем тип действия (login или register) из query параметров
    const action = request.nextUrl.searchParams.get("action") || "login";
    
    // Генерируем state для защиты от CSRF (включаем action)
    const state = Buffer.from(JSON.stringify({ action, timestamp: Date.now() })).toString("base64");
    
    // Параметры для Google OAuth
    const scope = "openid email profile";
    const responseType = "code";
    const accessType = "offline";
    const prompt = "consent";
    
    // Формируем URL для редиректа на Google
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope: scope,
      access_type: accessType,
      prompt: prompt,
      state: state,
    })}`;

    return NextResponse.json(
      {
        success: true,
        url: googleAuthUrl,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Google OAuth initiation error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при инициации Google OAuth",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

