import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Ad from "@/models/Ad";
import { createBookingSchema } from "@/lib/validations";

export const dynamic = 'force-dynamic';

interface PopulatedAd {
  _id: mongoose.Types.ObjectId;
  title: string;
  images?: string[];
  price?: string;
  location?: string;
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
}

interface PopulatedBooking {
  _id: mongoose.Types.ObjectId;
  adId: PopulatedAd | mongoose.Types.ObjectId;
  renterId: PopulatedUser | mongoose.Types.ObjectId;
  ownerId: PopulatedUser | mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  startTime?: Date;
  endTime?: Date;
  periodType: string;
  totalPrice: number;
  status: string;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get("userId");
    const type = request.nextUrl.searchParams.get("type") || "all"; // all, as-owner, as-renter

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID пользователя",
        },
        { status: 400 }
      );
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    let query: Record<string, unknown> = {};
    
    if (type === "as-owner") {
      query = { ownerId: userIdObj };
    } else if (type === "as-renter") {
      query = { renterId: userIdObj };
    } else {
      // all - бронирования где пользователь либо владелец, либо арендатор
      query = {
        $or: [
          { ownerId: userIdObj },
          { renterId: userIdObj },
        ],
      };
    }

    const bookings = await Booking.find(query)
      .populate("adId", "title images price location")
      .populate("renterId", "name email phone")
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Форматируем данные для фронтенда
    const formattedBookings = bookings.map((booking: PopulatedBooking) => {
      const isOwner = booking.ownerId && 
        (typeof booking.ownerId === 'object' && '_id' in booking.ownerId 
          ? booking.ownerId._id.toString() === userId 
          : String(booking.ownerId) === userId);
      
      const adIdObj: PopulatedAd | null = typeof booking.adId === 'object' && '_id' in booking.adId && 'title' in booking.adId
        ? booking.adId as PopulatedAd
        : null;
      const renterIdObj: PopulatedUser | null = typeof booking.renterId === 'object' && '_id' in booking.renterId && 'name' in booking.renterId
        ? booking.renterId as PopulatedUser
        : null;
      
      return {
        _id: booking._id,
        adId: {
          _id: adIdObj ? adIdObj._id : (typeof booking.adId === 'object' && '_id' in booking.adId ? booking.adId._id : booking.adId),
          title: adIdObj?.title || '',
          images: adIdObj?.images || [],
          price: adIdObj?.price || '',
          location: adIdObj?.location || '',
        },
        renterId: renterIdObj
          ? {
              _id: renterIdObj._id,
              name: renterIdObj.name || 'Неизвестно',
              email: renterIdObj.email || '',
            }
          : null,
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        period: booking.periodType,
        price: booking.totalPrice || 0,
        status: booking.status || 'pending',
        type: isOwner ? 'as-owner' : 'as-renter',
        createdAt: booking.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedBookings,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get bookings error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при загрузке бронирований",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID пользователя",
        },
        { status: 400 }
      );
    }

    // Валидация данных
    const validationResult = createBookingSchema.safeParse({
      ...body,
      renterId: userId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка валидации",
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Проверяем существование объявления
    const ad = await Ad.findById(data.adId);
    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь не бронирует свое объявление
    if (ad.userId.toString() === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя забронировать свое объявление",
        },
        { status: 400 }
      );
    }

    // Проверяем конфликты бронирований
    const conflictingBookings = await Booking.find({
      adId: data.adId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          startDate: { $lte: new Date(data.endDate) },
          endDate: { $gte: new Date(data.startDate) },
        },
      ],
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Выбранные даты уже заняты",
        },
        { status: 400 }
      );
    }

    // Создаем бронирование
    const booking = await Booking.create({
      adId: data.adId,
      renterId: userId,
      ownerId: ad.userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      periodType: data.periodType,
      totalPrice: data.totalPrice,
      status: data.status || "pending",
    });

    await booking.populate("adId", "title images price location");
    await booking.populate("renterId", "name email phone");
    await booking.populate("ownerId", "name email phone");

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create booking error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании бронирования",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
