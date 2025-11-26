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
  address?: string;
  latitude?: number;
  longitude?: number;
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
    const searchParams = extractSearchParams(message);
    
    // Ищем объявления в базе данных
    let foundAds: AdSearchResult[] = [];
    
    // Определяем, нужно ли искать объявления (если есть ключевые слова поиска)
    const shouldSearch = searchParams.keywords.length > 0 || 
                        searchParams.location || 
                        searchParams.category ||
                        message.toLowerCase().includes("найди") ||
                        message.toLowerCase().includes("ищу") ||
                        message.toLowerCase().includes("покажи") ||
                        message.toLowerCase().includes("есть") ||
                        message.toLowerCase().includes("нужен");
    
    if (shouldSearch) {
      const searchQuery: Record<string, unknown> = {
        status: "active",
      };

      // Поиск по категории, названию и описанию
      if (searchParams.keywords.length > 0) {
        searchQuery.$or = [
          { category: { $regex: searchParams.keywords.join("|"), $options: "i" } },
          { title: { $regex: searchParams.keywords.join("|"), $options: "i" } },
          { description: { $regex: searchParams.keywords.join("|"), $options: "i" } },
        ];
      }

      // Поиск по локации
      if (searchParams.location) {
        searchQuery.location = { $regex: searchParams.location, $options: "i" };
      }

      // Поиск по категории (если указана явно)
      if (searchParams.category) {
        searchQuery.category = { $regex: searchParams.category, $options: "i" };
      }

      // Поиск по цене (если указан диапазон) - упрощенная версия
      // Цена хранится как строка "5000 ₸/день", поэтому поиск по цене сложен
      // Пока оставляем без фильтра по цене, можно добавить позже

      const adsResult = await Ad.find(searchQuery)
        .limit(10) // Увеличиваем лимит для лучшего выбора
        .select("title category description price location images latitude longitude address")
        .sort({ createdAt: -1 }) // Сначала новые
        .lean();
      
      // Получаем бронирования для найденных объявлений (если нужно)
      // Бронирования хранятся в отдельной коллекции Booking
      foundAds = adsResult as unknown as AdSearchResult[];
    }

    // Формируем контекст для GPT
    const systemPrompt = `Ты - Auen AI, умный помощник на платформе аренды музыкального оборудования в Казахстане. 
Твоя задача - помогать пользователям находить нужное оборудование, отвечать на вопросы и предлагать решения.

ВАЖНО: У тебя есть доступ к базе данных объявлений. Когда пользователь ищет оборудование, ты должен:
1. Найти подходящие варианты из предоставленных данных
2. Представить их в удобном и структурированном формате
3. Указать для каждого объявления:
   - Название и категорию
   - Цену
   - Локацию (город)
   - ID объявления (для перехода по ссылке)
   - Если есть изображения, упомяни это
4. Если найдено несколько вариантов, предложи лучшие
5. Если ничего не найдено, предложи альтернативы или уточни запрос

Формат ответа для найденных объявлений:
"Нашел для вас несколько вариантов:

1. [Название] ([Категория])
   💰 Цена: [цена]
   📍 Локация: [город]
   🔗 Ссылка: /ads/[id]

2. ..."

ВАЖНО: Всегда используй относительные пути вида /ads/[id], НЕ используй полные URL с доменом. Относительные пути работают на любом домене.

Будь дружелюбным, профессиональным и полезным. Отвечай на русском языке. Если пользователь задает общие вопросы (не про поиск), отвечай как обычный помощник.`;

    const userMessage = message;
    
    // Формируем сообщение с информацией о найденных объявлениях
    let adsContext = "";
    if (foundAds.length > 0) {
      adsContext = "\n\n=== НАЙДЕННЫЕ ОБЪЯВЛЕНИЯ ИЗ БАЗЫ ДАННЫХ ===\n";
      adsContext += `Найдено ${foundAds.length} объявлений. Используй эту информацию для ответа пользователю.\n\n`;
      
      foundAds.forEach((ad, index) => {
        const adId = typeof ad._id === 'object' && ad._id !== null && 'toString' in ad._id
          ? (ad._id as { toString: () => string }).toString()
          : String(ad._id);

        adsContext += `ОБЪЯВЛЕНИЕ ${index + 1}:\n`;
        adsContext += `Название: ${ad.title}\n`;
        adsContext += `Категория: ${ad.category}\n`;
        adsContext += `Описание: ${ad.description?.substring(0, 200)}${ad.description && ad.description.length > 200 ? '...' : ''}\n`;
        adsContext += `Цена: ${ad.price}\n`;
        adsContext += `Локация: ${ad.location}\n`;
        if (ad.images && ad.images.length > 0) {
          adsContext += `Изображений: ${ad.images.length}\n`;
        }
        if (ad.address) {
          adsContext += `Адрес: ${ad.address}\n`;
        }
        adsContext += `ID объявления: ${adId}\n`;
        // Используем относительный путь, который будет работать на любом домене
        adsContext += `Ссылка на объявление: /ads/${adId}\n\n`;
      });
      
      adsContext += "=== КОНЕЦ ДАННЫХ ===\n";
      adsContext += "ВАЖНО: Представь эти объявления пользователю в удобном формате. Для каждого объявления укажи ссылку в формате /ads/[id] (относительный путь, БЕЗ домена).";
    } else if (shouldSearch) {
      adsContext = "\n\n=== РЕЗУЛЬТАТЫ ПОИСКА ===\n";
      adsContext += "По запросу пользователя ничего не найдено в базе данных.\n";
      adsContext += "Предложи пользователю уточнить запрос или попробовать другие ключевые слова.";
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
          { 
            role: "user", 
            content: userMessage + (adsContext ? `\n\n${adsContext}` : "")
          },
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
              address: ad.address || null,
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

// Интерфейс для параметров поиска
interface SearchParams {
  keywords: string[];
  location?: string;
  category?: string;
  maxPrice?: number;
}

// Функция для извлечения параметров поиска из запроса пользователя
function extractSearchParams(message: string): SearchParams {
  const params: SearchParams = {
    keywords: [],
  };
  const lowerMessage = message.toLowerCase();

  // Категории оборудования (соответствие с категориями в БД)
  const categoryMap: Record<string, string> = {
    "гитара": "Инструменты",
    "guitar": "Инструменты",
    "бас": "Инструменты",
    "bass": "Инструменты",
    "электрогитара": "Инструменты",
    "барабан": "Инструменты",
    "drum": "Инструменты",
    "ударные": "Инструменты",
    "установка": "Инструменты",
    "клавишные": "Клавишные",
    "piano": "Клавишные",
    "синтезатор": "Клавишные",
    "keyboard": "Клавишные",
    "микрофон": "Микрофоны",
    "microphone": "Микрофоны",
    "mic": "Микрофоны",
    "мик": "Микрофоны",
    "dj": "DJ оборудование",
    "диджей": "DJ оборудование",
    "микшер": "DJ оборудование",
    "mixer": "DJ оборудование",
    "вертушка": "DJ оборудование",
    "turntable": "DJ оборудование",
    "студия": "Студии",
    "studio": "Студии",
    "звукозапись": "Студии",
    "recording": "Студии",
    "акустика": "Аудио",
    "acoustic": "Аудио",
    "колонка": "Аудио",
    "speaker": "Аудио",
    "монитор": "Аудио",
    "инструмент": "Инструменты",
    "instrument": "Инструменты",
    "оборудование": "",
    "equipment": "",
  };

  // Поиск категорий
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (lowerMessage.includes(keyword)) {
      if (category) {
        params.category = category;
      }
      params.keywords.push(keyword);
    }
  }

  // Поиск локации (города Казахстана)
  const cities = [
    "алматы", "астана", "шымкент", "караганда", "актобе", "тараз",
    "павлодар", "усть-каменогорск", "семей", "атырау", "костанай",
    "кызылорда", "петропавловск", "актау", "туркестан", "орал"
  ];
  
  for (const city of cities) {
    if (lowerMessage.includes(city)) {
      params.location = city;
      break;
    }
  }

  // Поиск цены (максимальная цена)
  const priceMatch = message.match(/(?:до|макс|максимум|не более)\s*(\d+)/i);
  if (priceMatch) {
    params.maxPrice = parseInt(priceMatch[1]);
  }

  // Если не найдено ключевых слов, используем значимые слова из запроса
  if (params.keywords.length === 0) {
    // Убираем стоп-слова
    const stopWords = ["найди", "ищу", "покажи", "есть", "нужен", "нужно", "хочу", "хотел", "бы", "в", "на", "для", "с", "по", "от", "до", "и", "или", "а", "но", "что", "как", "где", "когда"];
    const words = message
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word.toLowerCase()));
    params.keywords.push(...words.slice(0, 5));
  }

  return params;
}

