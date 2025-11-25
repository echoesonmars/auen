import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: "user" | "admin" | "moderator";
  isBlocked: boolean;
  bio?: string;
  website?: string;
  instagram?: string;
  telegram?: string;
  vk?: string;
  youtube?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Имя обязательно"],
      trim: true,
      minlength: [2, "Имя должно содержать минимум 2 символа"],
      maxlength: [50, "Имя не должно превышать 50 символов"],
      validate: {
        validator: function (v: string) {
          return /^[а-яА-ЯёЁa-zA-Z\s]+$/.test(v);
        },
        message: "Имя может содержать только буквы",
      },
    },
    email: {
      type: String,
      required: [true, "Email обязателен"],
      unique: true, // unique автоматически создает индекс
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Некорректный email адрес",
      },
    },
    phone: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: "Некорректный номер телефона",
      },
    },
    password: {
      type: String,
      minlength: [8, "Пароль должен содержать минимум 8 символов"],
      select: false, // Не возвращать пароль по умолчанию
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Разрешает множественные null значения
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    bio: {
      type: String,
      maxlength: [500, "Описание не должно превышать 500 символов"],
      trim: true,
    },
    website: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Некорректный URL сайта",
      },
    },
    instagram: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[a-zA-Z0-9._]+$/.test(v);
        },
        message: "Некорректный username Instagram",
      },
    },
    telegram: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[a-zA-Z0-9_]+$/.test(v);
        },
        message: "Некорректный username Telegram",
      },
    },
    vk: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[a-zA-Z0-9._]+$/.test(v);
        },
        message: "Некорректный username VK",
      },
    },
    youtube: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[a-zA-Z0-9._-]+$/.test(v);
        },
        message: "Некорректный username YouTube",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Хеширование пароля перед сохранением
// В Mongoose 9.x можно использовать async функции без next callback
UserSchema.pre("save", async function () {
  // Проверяем, был ли изменен пароль и существует ли он
  if (!this.isModified("password") || !this.password) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
  } catch (error: unknown) {
    throw error;
  }
});

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // Если пароля нет (например, для Google OAuth пользователей), возвращаем false
  if (!this.password) {
    return false;
  }
  
  // Проверяем, что candidatePassword является строкой
  if (typeof candidatePassword !== "string" || candidatePassword.length === 0) {
    return false;
  }
  
  // Проверяем, что this.password является строкой
  if (typeof this.password !== "string") {
    console.error("Password is not a string:", typeof this.password);
    return false;
  }
  
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    // В случае ошибки (например, поврежденный хеш) возвращаем false
    console.error("Error comparing password:", error);
    return false;
  }
};

// Индексы для оптимизации запросов
// email и googleId уже имеют индексы (email: index: true, googleId: unique: true)
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
