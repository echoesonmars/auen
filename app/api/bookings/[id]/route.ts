import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";

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

    // Находим объявление с бронированием
    const ad = await Ad.findOne({
      "bookings._id": bookingId,
    })
      .populate("userId", "name email phone")
      .lean();

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Бронирование не найдено",
        },
        { status: 404 }
      );
    }

    // Находим конкретное бронирование
    const bookings = ad.bookings || [];
    const booking = (bookings as unknown as Array<{ _id?: { toString: () => string }; renterId?: { toString: () => string } | mongoose.Types.ObjectId; [key: string]: unknown }>).find(
      (b) => b._id && b._id.toString() === bookingId
    );

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Бронирование не найдено",
        },
        { status: 404 }
      );
    }

    // Получаем информацию об арендаторе
    const renterId = booking.renterId ? (typeof booking.renterId === 'object' && 'toString' in booking.renterId ? booking.renterId.toString() : String(booking.renterId)) : '';
    const User = (await import("@/models/User")).default;
    const renter = await User.findById(renterId).select("name email phone").lean();

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
          userId: ad.userId,
        },
        renterId: renter || { _id: renterId, name: "Неизвестно", email: "" },
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        period: booking.period,
        price: booking.price,
        status: booking.status,
        createdAt: booking.createdAt || ad.createdAt,
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

    // Находим объявление с бронированием
    const ad = await Ad.findOne({
      "bookings._id": bookingId,
    });

    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Бронирование не найдено",
        },
        { status: 404 }
      );
    }

    // Находим конкретное бронирование
    const bookings = ad.bookings || [];
    const booking = (bookings as unknown as Array<{ _id?: { toString: () => string }; renterId?: { toString: () => string } | mongoose.Types.ObjectId; status?: string; [key: string]: unknown }>).find(
      (b) => b._id && b._id.toString() === bookingId
    );

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Бронирование не найдено",
        },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    const isOwner = ad.userId.toString() === userId;
    const renterIdStr = booking.renterId ? (typeof booking.renterId === 'object' && 'toString' in booking.renterId ? booking.renterId.toString() : String(booking.renterId)) : '';
    const isRenter = renterIdStr === userId;

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

    // Обновляем статус бронирования
    booking.status = status;
    await ad.save();

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

