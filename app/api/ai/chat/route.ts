import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface AdSearchResult {
  _id: unknown;
  title: string;
  category: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  bookings?: Array<{
    startDate: Date;
    endDate: Date;
    status: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Сообщение обязательно",
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "OpenAI API ключ не настроен",
        },
        { status: 500 }
      );
    }

    // Анализируем запрос пользователя для поиска объявлений
    const searchKeywords = extractSearchKeywords(message);
    
    // Ищем объявления в базе данных
    let foundAds: AdSearchResult[] = [];
    if (searchKeywords.length > 0) {
      const searchQuery: Record<string, unknown> = {
        status: "active",
      };

      // Поиск по категории, названию и описанию
      if (searchKeywords.length > 0) {
        searchQuery.$or = [
          { category: { $regex: searchKeywords.join("|"), $options: "i" } },
          { title: { $regex: searchKeywords.join("|"), $options: "i" } },
          { description: { $regex: searchKeywords.join("|"), $options: "i" } },
        ];
      }

      const adsResult = await Ad.find(searchQuery)
        .limit(5)
        .select("title category description price location images bookings")
        .lean();
      foundAds = adsResult as unknown as AdSearchResult[];
    }

    // Формируем контекст для GPT
    const systemPrompt = `Ты - Auen AI, помощник на платформе аренды музыкального оборудования в Казахстане. 
Твоя задача - помогать пользователям находить нужное оборудование, отвечать на вопросы и предлагать решения.

Если пользователь ищет оборудование, найди подходящие варианты из базы данных и представь их в удобном формате.
Укажи название, категорию, цену, локацию и доступность.
Если есть информация о бронированиях, укажи свободные периоды.

Будь дружелюбным, профессиональным и полезным. Отвечай на русском языке.`;

    const userMessage = message;
    
    // Формируем сообщение с информацией о найденных объявлениях
    let adsContext = "";
    if (foundAds.length > 0) {
      adsContext = "\n\nНайденные объявления:\n";
      foundAds.forEach((ad, index) => {
        const bookings = ad.bookings || [];
        const bookedPeriods = bookings
          .filter((b: { status: string }) => b.status === "confirmed" || b.status === "pending")
          .map((b: { startDate: Date; endDate: Date }) => {
            const start = new Date(b.startDate).toLocaleDateString("ru-RU");
            const end = new Date(b.endDate).toLocaleDateString("ru-RU");
            return `${start} - ${end}`;
          })
          .join(", ");

        adsContext += `${index + 1}. ${ad.title} (${ad.category})\n`;
        adsContext += `   Цена: ${ad.price}\n`;
        adsContext += `   Локация: ${ad.location}\n`;
        if (bookedPeriods) {
          adsContext += `   Занято: ${bookedPeriods}\n`;
        }
        const adId = typeof ad._id === 'object' && ad._id !== null && 'toString' in ad._id
          ? (ad._id as { toString: () => string }).toString()
          : String(ad._id);
        adsContext += `   ID: ${adId}\n\n`;
      });
    }

    // Вызываем OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage + adsContext },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка при обращении к AI",
          error: process.env.NODE_ENV === "development" ? JSON.stringify(errorData) : undefined,
        },
        { status: 500 }
      );
    }

    const aiData = await openaiResponse.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || "Извините, не удалось обработать запрос.";

    return NextResponse.json(
      {
        success: true,
        data: {
          message: aiResponse,
          ads: foundAds.map(ad => {
            let adId: string;
            if (typeof ad._id === 'object' && ad._id !== null) {
              if ('toString' in ad._id && typeof (ad._id as { toString: () => string }).toString === 'function') {
                adId = (ad._id as { toString: () => string }).toString();
              } else if ('_id' in ad._id) {
                adId = String((ad._id as { _id: unknown })._id);
              } else {
                adId = String(ad._id);
              }
            } else {
              adId = String(ad._id);
            }
            return {
              id: adId,
              title: ad.title,
              category: ad.category,
              description: ad.description,
              price: ad.price,
              location: ad.location,
              images: ad.images || [],
              bookings: ad.bookings || [],
            };
          }),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("AI chat error:", err);
    console.error("Error stack:", err.stack);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обработке запроса",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Функция для извлечения ключевых слов из запроса пользователя
function extractSearchKeywords(message: string): string[] {
  const keywords: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Категории оборудования
  const categories = [
    "гитара", "guitar", "бас", "bass", "электрогитара",
    "барабан", "drum", "ударные", "установка",
    "клавишные", "piano", "синтезатор", "keyboard",
    "микрофон", "microphone", "mic", "мик",
    "dj", "диджей", "микшер", "mixer", "вертушка", "turntable",
    "студия", "studio", "звукозапись", "recording",
    "акустика", "acoustic", "колонка", "speaker", "монитор",
    "инструмент", "instrument", "оборудование", "equipment",
  ];

  // Поиск по категориям
  categories.forEach(category => {
    if (lowerMessage.includes(category)) {
      keywords.push(category);
    }
  });

  // Если не найдено ключевых слов, используем общие слова из запроса
  if (keywords.length === 0) {
    const words = message.split(/\s+/).filter(word => word.length > 3);
    keywords.push(...words.slice(0, 3));
  }

  return keywords;
}

