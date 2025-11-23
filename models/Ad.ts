import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAd extends Document {
  title: string;
  category: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  userId: mongoose.Types.ObjectId;
  views: number;
  status: "active" | "inactive" | "sold";
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Название обязательно"],
      trim: true,
      minlength: [10, "Название должно содержать минимум 10 символов"],
      maxlength: [100, "Название не должно превышать 100 символов"],
    },
    category: {
      type: String,
      required: [true, "Категория обязательна"],
      enum: {
        values: [
          "Инструменты",
          "Студии",
          "DJ оборудование",
          "Клавишные",
          "Микрофоны",
          "Аудио",
        ],
        message: "Некорректная категория",
      },
    },
    description: {
      type: String,
      required: [true, "Описание обязательно"],
      trim: true,
      minlength: [50, "Описание должно содержать минимум 50 символов"],
      maxlength: [2000, "Описание не должно превышать 2000 символов"],
    },
    price: {
      type: String,
      required: [true, "Цена обязательна"],
      validate: {
        validator: function (v: string) {
          return /^\d+(\s*₸)?\s*\/\s*(час|день|неделя|месяц)$/i.test(v);
        },
        message: "Формат: 5000 ₸/час или 5000 ₸/день",
      },
    },
    location: {
      type: String,
      required: [true, "Локация обязательна"],
      trim: true,
      minlength: [2, "Укажите локацию"],
      maxlength: [50, "Локация не должна превышать 50 символов"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: "Максимум 10 фотографий",
      },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Пользователь обязателен"],
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Количество просмотров не может быть отрицательным"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "sold"],
        message: "Некорректный статус",
      },
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для оптимизации запросов
AdSchema.index({ userId: 1, createdAt: -1 });
AdSchema.index({ category: 1, status: 1 });
AdSchema.index({ location: 1 });
AdSchema.index({ createdAt: -1 });
AdSchema.index({ views: -1 });

// Виртуальное поле для популярности
AdSchema.virtual("popularity").get(function () {
  const daysSinceCreation =
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return this.views / (daysSinceCreation + 1);
});

const Ad: Model<IAd> = mongoose.models.Ad || mongoose.model<IAd>("Ad", AdSchema);

export default Ad;

