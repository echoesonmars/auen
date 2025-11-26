import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking {
  renterId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  startTime?: Date;
  endTime?: Date;
  period: "hour" | "day" | "week" | "month";
  price: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: Date;
}

export interface IAd extends Document {
  title: string;
  category: string;
  description: string;
  price: string;
  location: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  images: string[];
  userId: mongoose.Types.ObjectId;
  views: number;
  status: "active" | "inactive" | "sold" | "pending" | "rejected";
  bookings?: IBooking[];
  featured?: boolean; // Для рекламной галереи на главной
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
      minlength: [1, "Выберите город"],
      maxlength: [50, "Локация не должна превышать 50 символов"],
    },
    latitude: {
      type: Number,
      required: false,
      min: [-90, "Широта должна быть от -90 до 90"],
      max: [90, "Широта должна быть от -90 до 90"],
    },
    longitude: {
      type: Number,
      required: false,
      min: [-180, "Долгота должна быть от -180 до 180"],
      max: [180, "Долгота должна быть от -180 до 180"],
    },
    address: {
      type: String,
      required: false,
      trim: true,
      maxlength: [200, "Адрес не должен превышать 200 символов"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[] | null) {
          if (v === null) return true;
          return v.length >= 0 && v.length <= 10;
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
        values: ["active", "inactive", "sold", "pending", "rejected"],
        message: "Некорректный статус",
      },
      default: "pending", // Новые объявления требуют модерации
      index: true,
    },
    bookings: {
      type: [
        {
          renterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          startDate: {
            type: Date,
            required: true,
          },
          endDate: {
            type: Date,
            required: true,
          },
          startTime: Date,
          endTime: Date,
          period: {
            type: String,
            enum: ["hour", "day", "week", "month"],
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          status: {
            type: String,
            enum: ["pending", "approved", "rejected", "cancelled"],
            default: "pending",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
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
AdSchema.index({ latitude: 1, longitude: 1 });
AdSchema.index({ createdAt: -1 });
AdSchema.index({ views: -1 });

// Виртуальное поле для популярности
AdSchema.virtual("popularity").get(function (this: { createdAt: Date; views: number }) {
  const daysSinceCreation =
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return this.views / (daysSinceCreation + 1);
});

const Ad: Model<IAd> = mongoose.models.Ad || mongoose.model<IAd>("Ad", AdSchema);

export default Ad;

