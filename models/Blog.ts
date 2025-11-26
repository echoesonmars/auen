import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlog extends Document {
  title: string;
  excerpt: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  category: "tips" | "reviews" | "news" | "guides";
  image?: string;
  readTime: number; // в минутах
  views: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Заголовок обязателен"],
      trim: true,
      minlength: [10, "Заголовок должен содержать минимум 10 символов"],
      maxlength: [200, "Заголовок не должен превышать 200 символов"],
    },
    excerpt: {
      type: String,
      required: [true, "Краткое описание обязательно"],
      trim: true,
      minlength: [50, "Краткое описание должно содержать минимум 50 символов"],
      maxlength: [500, "Краткое описание не должно превышать 500 символов"],
    },
    content: {
      type: String,
      required: [true, "Содержание обязательно"],
      minlength: [200, "Содержание должно содержать минимум 200 символов"],
      maxlength: [50000, "Содержание не должно превышать 50000 символов"],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Автор обязателен"],
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: ["tips", "reviews", "news", "guides"],
        message: "Некорректная категория",
      },
      required: [true, "Категория обязательна"],
    },
    image: {
      type: String,
      default: null,
    },
    readTime: {
      type: Number,
      default: 5,
      min: [1, "Время чтения должно быть минимум 1 минута"],
      max: [120, "Время чтения не должно превышать 120 минут"],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Количество просмотров не может быть отрицательным"],
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published"],
        message: "Некорректный статус",
      },
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для оптимизации запросов
BlogSchema.index({ authorId: 1, createdAt: -1 });
BlogSchema.index({ category: 1, status: 1 });
BlogSchema.index({ status: 1, createdAt: -1 });
BlogSchema.index({ views: -1 });

const Blog: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;

