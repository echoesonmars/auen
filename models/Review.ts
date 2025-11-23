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
      required: true,
      index: true,
    },
    adId: {
      type: Schema.Types.ObjectId,
      ref: "Ad",
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

ReviewSchema.index({ userId: 1, adId: 1 }, { unique: true });
ReviewSchema.index({ adId: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;

