import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserReview extends Document {
  reviewerId: mongoose.Types.ObjectId; // Тот, кто оставляет отзыв
  reviewedUserId: mongoose.Types.ObjectId; // Тот, на кого оставляют отзыв
  rating: number;
  comment: string;
  createdAt: Date;
}

const UserReviewSchema: Schema = new Schema(
  {
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Рейтинг не может быть меньше 1"],
      max: [5, "Рейтинг не может быть больше 5"],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Отзыв должен содержать минимум 10 символов"],
      maxlength: [500, "Отзыв не должен превышать 500 символов"],
    },
  },
  { timestamps: true }
);

// Один пользователь может оставить только один отзыв на другого пользователя
UserReviewSchema.index({ reviewerId: 1, reviewedUserId: 1 }, { unique: true });
UserReviewSchema.index({ reviewedUserId: 1, createdAt: -1 });

const UserReview: Model<IUserReview> =
  mongoose.models.UserReview || mongoose.model<IUserReview>("UserReview", UserReviewSchema);

export default UserReview;

