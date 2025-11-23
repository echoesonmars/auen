import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
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
      required: [true, "Телефон обязателен"],
      validate: {
        validator: function (v: string) {
          return /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: "Некорректный номер телефона",
      },
    },
    password: {
      type: String,
      required: [true, "Пароль обязателен"],
      minlength: [8, "Пароль должен содержать минимум 8 символов"],
      select: false, // Не возвращать пароль по умолчанию
    },
  },
  {
    timestamps: true,
  }
);

// Хеширование пароля перед сохранением
// В Mongoose 9.x можно использовать async функции без next callback
UserSchema.pre("save", async function () {
  // Проверяем, был ли изменен пароль
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Метод для сравнения паролей
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Индексы для оптимизации запросов
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
