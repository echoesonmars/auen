import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import Booking from "@/models/Booking";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const bookingId = resolvedParams.id;
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

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID бронирования",
        },
        { status: 400 }
      );
    }

    // Находим бронирование в отдельной коллекции
    const booking = await Booking.findById(bookingId)
      .populate("renterId", "name email phone")
      .populate("ownerId", "name email phone")
      .lean();

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Бронирование не найдено",
        },
        { status: 404 }
      );
    }

    // Получаем объявление
    const ad = await Ad.findById(booking.adId)
      .populate("userId", "name email phone")
      .lean();

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    const isOwner = ad.userId && (typeof ad.userId === 'object' && '_id' in ad.userId ? ad.userId._id.toString() : String(ad.userId)) === userId;
    const isRenter = booking.renterId && (typeof booking.renterId === 'object' && '_id' in booking.renterId ? booking.renterId._id.toString() : String(booking.renterId)) === userId;

    if (!isOwner && !isRenter) {
      return NextResponse.json(
        {
          success: false,
          message: "Нет доступа к этому бронированию",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: booking._id,
        adId: {
          _id: ad._id,
          title: ad.title,
          images: ad.images || [],
          price: ad.price,
          location: ad.location,
          latitude: ad.latitude,
          longitude: ad.longitude,
          address: ad.address,
          userId: ad.userId,
        },
        renterId: booking.renterId || { _id: "", name: "Неизвестно", email: "" },
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        period: booking.periodType,
        price: booking.totalPrice || 0,
        status: booking.status || "pending",
        deliveryMethod: booking.deliveryMethod || "pickup",
        createdAt: booking.createdAt,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Get booking error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при загрузке бронирования",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const bookingId = resolvedParams.id;
    const body = await request.json();
    const { userId, status } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходима авторизация",
        },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID бронирования",
        },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный статус",
        },
        { status: 400 }
      );
    }

    // Находим бронирование в отдельной коллекции
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Бронирование не найдено",
        },
        { status: 404 }
      );
    }

    // Получаем объявление для проверки прав
    const ad = await Ad.findById(booking.adId);

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    const isOwner = ad.userId.toString() === userId;
    const isRenter = booking.renterId.toString() === userId;

    if (!isOwner && !isRenter) {
      return NextResponse.json(
        {
          success: false,
          message: "Нет доступа к этому бронированию",
        },
        { status: 403 }
      );
    }

    // Владелец может одобрить/отклонить, арендатор может отменить
    if (status === 'cancelled' && !isRenter) {
      return NextResponse.json(
        {
          success: false,
          message: "Только арендатор может отменить бронирование",
        },
        { status: 403 }
      );
    }

    if ((status === 'approved' || status === 'rejected') && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          message: "Только владелец может одобрить или отклонить бронирование",
        },
        { status: 403 }
      );
    }

    // Маппинг статусов
    let bookingStatus: "pending" | "confirmed" | "cancelled" | "completed" = "pending";
    if (status === 'approved') {
      bookingStatus = "confirmed";
    } else if (status === 'cancelled') {
      bookingStatus = "cancelled";
    } else if (status === 'rejected') {
      bookingStatus = "cancelled";
    }

    // Обновляем статус бронирования
    booking.status = bookingStatus;
    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Статус бронирования обновлен",
      data: {
        _id: booking._id,
        status: booking.status,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update booking error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при обновлении бронирования",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

