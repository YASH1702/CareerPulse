import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";

  try {
    // Quick ping to Neon PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "error";
    console.error("[Health Check DB Error]", err);
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    responseTimeMs,
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
}