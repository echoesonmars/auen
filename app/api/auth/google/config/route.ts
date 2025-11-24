import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback/google`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

    return NextResponse.json(
      {
        success: true,
        config: {
          redirectUri,
          origin,
          clientIdConfigured: !!clientId,
          clientSecretConfigured: hasClientSecret,
        },
        instructions: {
          googleCloudConsole: "https://console.cloud.google.com/apis/credentials",
          redirectUriToAdd: redirectUri,
          steps: [
            "1. Перейдите в Google Cloud Console: https://console.cloud.google.com/apis/credentials",
            "2. Выберите ваш проект",
            "3. Откройте ваш OAuth 2.0 Client ID",
            "4. В разделе 'Authorized redirect URIs' добавьте:",
            `   ${redirectUri}`,
            "5. Сохраните изменения",
            "6. Подождите 1-2 минуты для применения изменений",
          ],
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при получении конфигурации",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

