import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  adId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID пользователя обязателен"],
      index: true,
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Некорректный формат ID пользователя",
      },
    },
    adId: {
      type: Schema.Types.ObjectId,
      ref: "Ad",
      required: [true, "ID объявления обязателен"],
      index: true,
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Некорректный формат ID объявления",
      },
    },
    rating: {
      type: Number,
      required: [true, "Рейтинг обязателен"],
      min: [1, "Рейтинг не может быть меньше 1"],
      max: [5, "Рейтинг не может быть больше 5"],
      validate: {
        validator: function (v: number) {
          return Number.isInteger(v) && v >= 1 && v <= 5;
        },
        message: "Рейтинг должен быть целым числом от 1 до 5",
      },
    },
    comment: {
      type: String,
      required: [true, "Комментарий обязателен"],
      trim: true,
      minlength: [10, "Отзыв должен содержать минимум 10 символов"],
      maxlength: [500, "Отзыв не должен превышать 500 символов"],
      validate: {
        validator: function (v: string) {
          const trimmed = v.trim();
          return trimmed.length >= 10 && trimmed.length <= 500;
        },
        message: "Отзыв должен содержать от 10 до 500 символов (без пробелов в начале и конце)",
      },
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ userId: 1, adId: 1 }, { unique: true });
ReviewSchema.index({ adId: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;

