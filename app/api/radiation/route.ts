import { NextRequest, NextResponse } from "next/server";
import { redis, RADIATION_KEY, RADIATION_HISTORY_KEY, HISTORY_MAX_LENGTH, type RadiationReading } from "@/lib/redis";

export async function GET() {
  try {
    const reading = await redis.get<RadiationReading>(RADIATION_KEY);
    return NextResponse.json(reading ?? { value: null, timestamp: null }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RADIATION_API_KEY;
  const auth = request.headers.get("authorization");

  if (!apiKey || auth !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const value = body.value;
  if (typeof value !== "number" || !isFinite(value) || value < 0) {
    return NextResponse.json(
      { error: "value must be a non-negative finite number" },
      { status: 400 }
    );
  }

  const reading: RadiationReading = {
    value,
    timestamp: new Date().toISOString(),
  };

  try {
    await Promise.all([
      redis.set(RADIATION_KEY, reading),
      redis.lpush(RADIATION_HISTORY_KEY, reading),
      redis.ltrim(RADIATION_HISTORY_KEY, 0, HISTORY_MAX_LENGTH - 1),
    ]);
    return NextResponse.json(reading);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
