import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocation extends Document {
  name: string;
  type: "city" | "category";
  icon?: string;
  adsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Название обязательно"],
      trim: true,
      minlength: [2, "Название должно содержать минимум 2 символа"],
      maxlength: [100, "Название не должно превышать 100 символов"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["city", "category"],
        message: "Некорректный тип локации",
      },
      required: [true, "Тип обязателен"],
      index: true,
    },
    icon: {
      type: String,
      default: null,
    },
    adsCount: {
      type: Number,
      default: 0,
      min: [0, "Количество объявлений не может быть отрицательным"],
    },
  },
  {
    timestamps: true,
  }
);

// Уникальный индекс для комбинации name и type
LocationSchema.index({ name: 1, type: 1 }, { unique: true });
LocationSchema.index({ type: 1, adsCount: -1 });

const Location: Model<ILocation> =
  mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema);

export default Location;

