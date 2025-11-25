"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useToast } from "@/components/ui/toast";
import RichTextEditor from "../components/RichTextEditor";

export default function CreatePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Проверка авторизации при загрузке страницы
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const authToken = localStorage.getItem("auth_token");
    
    if (!userId || !authToken) {
      router.push("/login");
    }
  }, [router]);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    price: "",
    priceAmount: "",
    pricePeriod: "час",
    location: "",
    images: [] as File[],
    imagePreviews: [] as string[],
  });

  const categories = [
    "Инструменты",
    "Студии",
    "DJ оборудование",
    "Клавишные",
    "Микрофоны",
    "Аудио",
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        setErrors({ general: "Необходима авторизация. Пожалуйста, войдите в систему." });
        setIsSubmitting(false);
        return;
      }

      // Валидация на клиенте перед отправкой
      const clientErrors: Record<string, string> = {};
      
      if (formData.title.trim().length < 10) {
        clientErrors.title = "Название должно содержать минимум 10 символов";
      }
      if (formData.title.trim().length > 100) {
        clientErrors.title = "Название не должно превышать 100 символов";
      }
      if (!formData.category) {
        clientErrors.category = "Выберите категорию";
      }
      // Извлекаем текст из HTML для валидации длины
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = formData.description;
      const textContent = (tempDiv.textContent || tempDiv.innerText || "").trim();
      
      if (textContent.length < 50) {
        clientErrors.description = "Описание должно содержать минимум 50 символов";
      }
      if (textContent.length > 2000) {
        clientErrors.description = "Описание не должно превышать 2000 символов";
      }
      if (!formData.priceAmount || isNaN(Number(formData.priceAmount))) {
        clientErrors.price = "Введите корректную цену";
      }
      if (!formData.pricePeriod) {
        clientErrors.price = "Выберите период";
      }
      if (formData.location.trim().length < 2) {
        clientErrors.location = "Укажите локацию (минимум 2 символа)";
      }
      if (formData.location.trim().length > 50) {
        clientErrors.location = "Локация не должна превышать 50 символов";
      }

      if (Object.keys(clientErrors).length > 0) {
        setErrors(clientErrors);
        setIsSubmitting(false);
        return;
      }

      // Формируем цену в нужном формате
      const price = `${formData.priceAmount} ₸/${formData.pricePeriod}`;

      // Загружаем изображения, если они есть
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        try {
          const imageFormData = new FormData();
          formData.images.forEach((file) => {
            imageFormData.append("images", file);
          });

          console.log("Uploading images...", formData.images.length, "files");
          
          const imageResponse = await fetch("/api/ads/images", {
            method: "POST",
            body: imageFormData,
          });

          if (!imageResponse.ok) {
            await imageResponse.text(); // Читаем ответ для очистки потока
            setErrors({ general: `Ошибка загрузки изображений (${imageResponse.status})` });
            setIsSubmitting(false);
            return;
          }

          const imageResult = await imageResponse.json();

          if (imageResult.success && imageResult.data && imageResult.data.images) {
            imageUrls = imageResult.data.images;
          } else {
            const errorMessage = imageResult.message || "Ошибка при загрузке изображений";
            setErrors({ general: errorMessage });
            setIsSubmitting(false);
            return;
          }
        } catch (imageError) {
          const errorMessage = imageError instanceof Error ? imageError.message : "Ошибка при загрузке изображений";
          setErrors({ general: `Ошибка при загрузке изображений: ${errorMessage}` });
          setIsSubmitting(false);
          return;
        }
      }

      // Подготовка данных для отправки
      const formDataToSend = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description, // HTML описание отправляем как есть
        price: price,
        location: formData.location.trim(),
        images: imageUrls,
        userId,
      };

      console.log("Sending ad data:", formDataToSend);

      const response = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataToSend),
      });

      // Проверяем, что ответ является JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 500));
        setErrors({ general: `Ошибка сервера (${response.status}). Проверьте консоль для деталей.` });
        setIsSubmitting(false);
        return;
      }

      // Обработка ошибки авторизации
      if (response.status === 401) {
        setErrors({ general: "Сессия истекла. Пожалуйста, войдите в систему снова." });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        setIsSubmitting(false);
        return;
      }

      let result;
      try {
        result = await response.json();
        console.log("Response status:", response.status);
        console.log("Response data:", result);
      } catch (jsonError: unknown) {
        console.error("JSON parse error:", jsonError);
        const text = await response.text();
        console.error("Response text:", text.substring(0, 500));
        setErrors({ general: `Ошибка парсинга ответа сервера (${response.status}). Проверьте консоль для деталей.` });
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        // Проверка на ошибку авторизации в ответе
        if (response.status === 401 || result.message?.includes("авторизац")) {
          setErrors({ general: "Сессия истекла. Пожалуйста, войдите в систему снова." });
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          setIsSubmitting(false);
          return;
        }
        
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ general: result.message || result.error || "Ошибка при создании объявления" });
        }
        setIsSubmitting(false);
        return;
      }

      // Успешно создано
      showToast("Объявление успешно создано!", "success");
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1000);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error creating ad:", err);
      setErrors({ general: err.message || "Ошибка при создании объявления. Проверьте подключение к интернету." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    try {
      const files = Array.from(e.target.files);
      const totalFiles = formData.images.length + files.length;
      const filesToAdd = totalFiles > 10 
        ? files.slice(0, 10 - formData.images.length) 
        : files;
      
      if (filesToAdd.length === 0) {
        showToast("Можно загрузить максимум 10 фотографий", "warning");
        e.target.value = "";
        return;
      }

      // Проверяем типы файлов
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      const invalidFiles = filesToAdd.filter(file => !validTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        showToast("Некоторые файлы имеют неподдерживаемый формат. Поддерживаются: JPEG, PNG, WebP", "warning");
      }

      const validFiles = filesToAdd.filter(file => validTypes.includes(file.type));
      
      if (validFiles.length === 0) {
        e.target.value = "";
        return;
      }

      // Сохраняем существующие превью и файлы
      const existingPreviews = [...formData.imagePreviews];
      const existingFiles = [...formData.images];
      
      // Создаем превью для новых файлов
      const previewPromises = validFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error(`Ошибка чтения файла: ${file.name}`));
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject(new Error(`Не удалось загрузить файл: ${file.name}`));
            }
          };
          reader.readAsDataURL(file);
        });
      });

      // Ждем загрузки всех превью
      Promise.all(previewPromises)
        .then((newPreviews) => {
          setFormData({ 
            ...formData, 
            images: [...existingFiles, ...validFiles], 
            imagePreviews: [...existingPreviews, ...newPreviews] 
          });
        })
        .catch((error) => {
          console.error("Error loading image previews:", error);
          showToast("Ошибка при загрузке превью изображений. Попробуйте снова.", "error");
        });
    } catch (error) {
      console.error("Error handling image change:", error);
      showToast("Ошибка при выборе файлов. Попробуйте снова.", "error");
    } finally {
      // Сбрасываем input, чтобы можно было загрузить те же файлы снова
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = formData.imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages, imagePreviews: newPreviews });
  };

  return (
    <div className="min-h-screen bg-color-lightest py-8 sm:py-12 md:py-20">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <TextAnimate
            as="h1"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-color-dark mb-2"
          >
            Создать объявление
          </TextAnimate>
          <TextAnimate
            as="p"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.2}
            className="text-base sm:text-lg text-color-medium mb-8 sm:mb-12"
          >
            Заполните форму, чтобы разместить ваше объявление
          </TextAnimate>
        </BlurFade>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <BlurFade inView={true} delay={0.3} direction="up">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-color-dark mb-6">
                Основная информация
              </h2>
              
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Название объявления *
                  </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (errors.title) setErrors({ ...errors, title: "" });
                      }}
                      placeholder="Например: Электрогитара Fender Stratocaster"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.title ? "border-red-500" : "border-color-light"
                      } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                    />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Минимум 10 символов, максимум 100 символов
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Категория *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark bg-white"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Цена *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.priceAmount}
                          onChange={(e) => {
                            setFormData({ ...formData, priceAmount: e.target.value });
                            if (errors.price) setErrors({ ...errors, price: "" });
                          }}
                          placeholder="5000"
                          className={`w-full px-4 py-3 pr-10 rounded-lg border ${
                            errors.price ? "border-red-500" : "border-color-light"
                          } focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-color-dark font-medium">
                          ₸
                        </span>
                      </div>
                      <select
                        required
                        value={formData.pricePeriod}
                        onChange={(e) => {
                          setFormData({ ...formData, pricePeriod: e.target.value });
                          if (errors.price) setErrors({ ...errors, price: "" });
                        }}
                        className="px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark bg-white"
                      >
                        <option value="час">час</option>
                        <option value="день">день</option>
                        <option value="неделя">неделя</option>
                        <option value="месяц">месяц</option>
                      </select>
                    </div>
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Укажите цену и выберите период аренды
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Локация *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Алматы"
                    className="w-full px-4 py-3 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark placeholder:text-color-medium"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Укажите город или район
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Описание *
                  </label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => {
                      setFormData({ ...formData, description: value });
                      if (errors.description) setErrors({ ...errors, description: "" });
                    }}
                    placeholder="Опишите ваш товар или услугу подробно..."
                    minLength={50}
                    maxLength={2000}
                    error={errors.description}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Используйте панель инструментов для форматирования текста
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-color-dark mb-2">
                    Фотографии {formData.images.length > 0 && `(${formData.images.length}/10)`}
                  </label>
                  
                  {/* Превью загруженных фотографий */}
                  {formData.imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                      {formData.imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-color-light"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Кнопка загрузки */}
                  {formData.images.length < 10 && (
                    <div className="border-2 border-dashed border-color-light rounded-lg p-6 text-center hover:border-color-medium transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                        disabled={formData.images.length >= 10}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <svg
                          className="w-12 h-12 text-color-medium"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span className="text-sm text-color-medium">
                          Нажмите для загрузки или перетащите файлы
                        </span>
                        <span className="text-xs text-gray-500 mt-2">
                          Можно загрузить до 10 фотографий
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BlurFade>

          {errors.general && (
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.general}
              </div>
            </BlurFade>
          )}

          <BlurFade inView={true} delay={0.4} direction="up">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Создание..." : "Опубликовать объявление"}
                </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-medium border border-color-light text-color-dark hover:bg-color-lightest transition-all duration-200 text-base"
              >
                Сохранить черновик
              </button>
            </div>
          </BlurFade>
        </form>
      </div>
    </div>
  );
}

