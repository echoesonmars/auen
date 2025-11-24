import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    
    // Обработка ошибки от Google
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed&details=${error}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${origin}/login?error=no_code`
      );
    }

    // Расшифровываем state
    let stateData: { action?: string; timestamp?: number } = {};
    try {
      if (state) {
        stateData = JSON.parse(Buffer.from(state, "base64").toString());
      }
    } catch (e) {
      console.error("Error parsing state:", e);
    }

    const action = stateData.action || "login";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Используем тот же способ формирования redirect URI, что и в /api/auth/google
    const redirectUri = `${origin}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      console.error("Google OAuth credentials not configured");
      return NextResponse.redirect(
        `${origin}/login?error=config_error`
      );
    }

    // Логируем redirect URI для отладки (только в development)
    if (process.env.NODE_ENV === "development") {
      console.log("Google OAuth callback redirect URI:", redirectUri);
      console.log("Origin:", origin);
      console.log("Received code:", code ? "present" : "missing");
    }

    // Обмениваем код на токен
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange error:", errorData);
      console.error("Redirect URI used:", redirectUri);
      return NextResponse.redirect(
        `${origin}/login?error=token_exchange_failed&details=${encodeURIComponent(errorData)}`
      );
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    // Получаем информацию о пользователе из Google
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    );

    if (!userInfoResponse.ok) {
      console.error("Failed to fetch user info from Google");
      return NextResponse.redirect(
        `${origin}/login?error=user_info_failed`
      );
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    // Проверяем, что email подтвержден
    if (!googleUser.verified_email) {
      return NextResponse.redirect(
        `${origin}/login?error=email_not_verified`
      );
    }

    // Ищем пользователя по googleId или email
    let user = await User.findOne({
      $or: [{ googleId: googleUser.id }, { email: googleUser.email }],
    });

    if (user) {
      // Обновляем googleId, если его не было
      if (!user.googleId) {
        user.googleId = googleUser.id;
        await user.save();
      }
    } else {
      // Создаем нового пользователя
      if (action === "register") {
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.id,
          // phone не указываем, так как он опционален для Google OAuth пользователей
        });
      } else {
        // При логине пользователя не существует - автоматически создаем
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.id,
        });
      }
    }

    // Перенаправляем на главную с токеном в URL (для обработки на клиенте)
    // В продакшене лучше использовать HTTP-only cookies
    const userId = user._id.toString();
    const redirectUrl = new URL(`${origin}/auth/callback`);
    redirectUrl.searchParams.set("userId", userId);
    redirectUrl.searchParams.set("name", user.name);
    redirectUrl.searchParams.set("email", user.email);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Google OAuth callback error:", err);

    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      `${origin}/login?error=callback_error`
    );
  }
}

