import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export const RADIATION_KEY = "radiation:current";
export const RADIATION_HISTORY_KEY = "radiation:history";
export const HISTORY_MAX_LENGTH = 360; // 30 minutes at 5s intervals

export interface RadiationReading {
  value: number; // counts per minute (CPM)
  timestamp: string;
}
