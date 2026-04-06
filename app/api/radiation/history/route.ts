import { NextResponse } from "next/server";
import { redis, RADIATION_HISTORY_KEY, type RadiationReading } from "@/lib/redis";

export async function GET() {
  try {
    const history = await redis.lrange<RadiationReading>(RADIATION_HISTORY_KEY, 0, -1);
    // History is stored newest-first; reverse for chronological order
    return NextResponse.json(history.reverse(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
