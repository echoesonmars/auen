import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  adId: mongoose.Types.ObjectId;
  renterId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  startTime?: Date;
  endTime?: Date;
  periodType: "hour" | "day" | "week" | "month";
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  deliveryMethod?: "pickup" | "courier";
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    adId: {
      type: Schema.Types.ObjectId,
      ref: "Ad",
      required: [true, "ID объявления обязателен"],
      index: true,
    },
    renterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID арендатора обязателен"],
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID владельца обязателен"],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "Дата начала обязательна"],
    },
    endDate: {
      type: Date,
      required: [true, "Дата окончания обязательна"],
      validate: {
        validator: function (this: IBooking, value: Date) {
          return value > this.startDate;
        },
        message: "Дата окончания должна быть позже даты начала",
      },
    },
    startTime: {
      type: Date,
      required: false,
    },
    endTime: {
      type: Date,
      required: false,
      validate: {
        validator: function (this: IBooking, value: Date) {
          if (!this.startTime) return true;
          return value > this.startTime;
        },
        message: "Время окончания должно быть позже времени начала",
      },
    },
    periodType: {
      type: String,
      enum: {
        values: ["hour", "day", "week", "month"],
        message: "Некорректный тип периода",
      },
      required: [true, "Тип периода обязателен"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Общая стоимость обязательна"],
      min: [0, "Стоимость не может быть отрицательной"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled", "completed"],
        message: "Некорректный статус бронирования",
      },
      default: "pending",
      index: true,
    },
    deliveryMethod: {
      type: String,
      enum: {
        values: ["pickup", "courier"],
        message: "Некорректный способ доставки",
      },
      default: "pickup",
    },
  },
  { timestamps: true }
);

// Индексы для быстрого поиска
BookingSchema.index({ adId: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ renterId: 1, status: 1 });
BookingSchema.index({ ownerId: 1, status: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

