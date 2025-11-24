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
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Некорректный email адрес",
      },
      index: true,
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
  return bcrypt.compare(candidatePassword, this.password);
};

// Индексы для оптимизации запросов
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
