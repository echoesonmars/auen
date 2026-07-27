import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Lightweight health/readiness probe. Reports app status and DB connectivity.
// Useful for uptime monitors, load balancers and deploy smoke-tests.
export async function GET() {
  const startedAt = Date.now();

  let dbOk = false;
  let dbError: string | undefined;
  try {
    await connectDB();
    dbOk = mongoose.connection.readyState === 1; // 1 = connected
  } catch (error: unknown) {
    dbOk = false;
    dbError =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "database unavailable";
  }

  const status = dbOk ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      checks: {
        database: dbOk ? "up" : "down",
        ...(dbError ? { databaseError: dbError } : {}),
      },
      version: process.env.NEXT_PUBLIC_VERCEL_URL ? "vercel" : "local",
    },
    { status: dbOk ? 200 : 503 }
  );
}
