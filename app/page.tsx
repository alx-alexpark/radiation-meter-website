import { redis, RADIATION_KEY, RADIATION_HISTORY_KEY, type RadiationReading } from "@/lib/redis";
import RadiationDisplay from "@/app/components/RadiationDisplay";
import RadiationChart from "@/app/components/RadiationChart";

export const dynamic = "force-dynamic";

export default async function Home() {
  let reading: RadiationReading | null = null;
  let history: RadiationReading[] = [];

  try {
    const [r, h] = await Promise.all([
      redis.get<RadiationReading>(RADIATION_KEY),
      redis.lrange<RadiationReading>(RADIATION_HISTORY_KEY, 0, -1),
    ]);
    reading = r;
    history = h.reverse(); // chronological order
  } catch {
    // Redis unavailable — client components will poll for data
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 px-4 py-12 gap-12">
      <div className="flex flex-col items-center gap-4">
        <p className="text-lg text-zinc-400">The current radiation level at Alex&apos;s house is</p>
        <RadiationDisplay initialReading={reading} />
      </div>
      <div className="w-full max-w-2xl">
        <RadiationChart initialHistory={history} />
      </div>
    </div>
  );
}
