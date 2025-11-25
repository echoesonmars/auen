import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";

export const dynamic = 'force-dynamic';

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
    
    interface BookingItem {
      _id?: string | mongoose.Types.ObjectId;
      adId: {
        _id: string | mongoose.Types.ObjectId;
        title: string;
        images?: string[];
        price?: string;
        location?: string;
        userId?: { _id: string | mongoose.Types.ObjectId; name?: string; email?: string; phone?: string };
      };
      renterId?: string | mongoose.Types.ObjectId | { _id: string | mongoose.Types.ObjectId; name?: string; email?: string; phone?: string };
      startDate?: string | Date;
      endDate?: string | Date;
      startTime?: string | Date;
      endTime?: string | Date;
      period?: string;
      price?: number;
      status?: string;
      createdAt?: string | Date;
      type: "as-owner" | "as-renter";
    }
    
    interface AdBooking {
      _id?: string | mongoose.Types.ObjectId;
      userId?: string | mongoose.Types.ObjectId;
      renterId?: string | mongoose.Types.ObjectId;
      startDate?: string | Date;
      endDate?: string | Date;
      startTime?: string | Date;
      endTime?: string | Date;
      period?: string;
      price?: number;
      status?: string;
      createdAt?: string | Date;
    }
    
    let bookings: BookingItem[] = [];

    if (type === "as-owner" || type === "all") {
      // Бронирования для объявлений пользователя (как владелец)
      const adsAsOwner = await Ad.find({
        userId: userIdObj,
        bookings: { $exists: true, $ne: [] },
      })
        .select("_id title images price location bookings")
        .lean();

      adsAsOwner.forEach((ad) => {
        ad.bookings?.forEach((booking: AdBooking) => {
          bookings.push({
            _id: booking._id,
            adId: {
              _id: ad._id,
              title: ad.title,
              images: ad.images || [],
              price: ad.price,
              location: ad.location,
            },
            renterId: booking.renterId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            period: booking.period,
            price: booking.price,
            status: booking.status,
            createdAt: booking.createdAt || ad.createdAt,
            type: "as-owner",
          });
        });
      });
    }

    if (type === "as-renter" || type === "all") {
      // Бронирования пользователя (как арендатор)
      const adsAsRenter = await Ad.find({
        "bookings.renterId": userIdObj,
      })
        .select("_id title images price location bookings userId")
        .populate("userId", "name email phone")
        .lean();

      adsAsRenter.forEach((ad) => {
        ad.bookings?.forEach((booking: AdBooking) => {
          if (booking.renterId && booking.renterId.toString() === userId) {
            bookings.push({
              _id: booking._id,
              adId: {
                _id: ad._id,
                title: ad.title,
                images: ad.images || [],
                price: ad.price,
                location: ad.location,
                userId: ad.userId,
              },
              renterId: booking.renterId,
              startDate: booking.startDate,
              endDate: booking.endDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              period: booking.period,
              price: booking.price,
              status: booking.status,
              createdAt: booking.createdAt || ad.createdAt,
              type: "as-renter",
            });
          }
        });
      });
    }

    // Сортируем по дате создания (новые сначала)
    bookings.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Получаем информацию об арендаторах и владельцах
    const User = (await import("@/models/User")).default;
    const userIds = new Set<string>();
    bookings.forEach((booking) => {
      if (booking.renterId) {
        userIds.add(booking.renterId.toString());
      }
      if (booking.adId?.userId?._id) {
        userIds.add(booking.adId.userId._id.toString());
      }
    });

    const users = await User.find({
      _id: { $in: Array.from(userIds).map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select("name email phone")
      .lean();

    interface UserInfo {
      _id: string | mongoose.Types.ObjectId;
      name?: string;
      email?: string;
      phone?: string;
    }
    
    const usersMap = new Map(users.map((u: UserInfo) => [u._id.toString(), u]));

    // Добавляем информацию о пользователях
    bookings = bookings.map((booking) => {
      const renterIdStr = booking.renterId 
        ? (typeof booking.renterId === 'string' 
            ? booking.renterId 
            : (typeof booking.renterId === 'object' && 'toString' in booking.renterId 
                ? booking.renterId.toString() 
                : String(booking.renterId)))
        : '';
      const renter = renterIdStr ? usersMap.get(renterIdStr) : null;
      return {
        ...booking,
        renterId: renter || (renterIdStr ? { _id: renterIdStr, name: "Неизвестно", email: "" } : undefined),
      };
    });

    return NextResponse.json({
      success: true,
      data: bookings,
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

