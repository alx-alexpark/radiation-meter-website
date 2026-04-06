"use client";

import { useState, useEffect, useCallback } from "react";
import type { RadiationReading } from "@/lib/redis";

function getStatus(cpm: number) {
  if (cpm > 1000) return { label: "Danger", color: "text-red-500", dot: "bg-red-500", pulse: true };
  if (cpm > 100) return { label: "High", color: "text-orange-500", dot: "bg-orange-500", pulse: false };
  if (cpm > 50) return { label: "Elevated", color: "text-amber-400", dot: "bg-amber-400", pulse: false };
  return { label: "Normal", color: "text-emerald-400", dot: "bg-emerald-400", pulse: false };
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function RadiationDisplay({
  initialReading,
}: {
  initialReading: RadiationReading | null;
}) {
  const [reading, setReading] = useState(initialReading);
  const [error, setError] = useState(false);
  const [, setTick] = useState(0);

  const fetchReading = useCallback(async () => {
    try {
      const res = await fetch("/api/radiation");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.value !== null) {
        setReading(data);
        setError(false);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    const poll = setInterval(fetchReading, 5000);
    const tick = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [fetchReading]);

  if (!reading) {
    return (
      <div className="flex flex-col items-center gap-4 text-zinc-500">
        <p className="text-lg">Waiting for first sensor reading...</p>
      </div>
    );
  }

  const status = getStatus(reading.value);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-6xl font-bold text-zinc-100 tabular-nums tracking-tight">
          {Math.round(reading.value)}
        </p>
        <p className="text-sm text-zinc-500 tracking-widest uppercase">
          CPM
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-3 w-3 rounded-full ${status.dot} ${status.pulse ? "animate-pulse" : ""}`}
        />
        <span className={`text-lg font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <p className="text-sm text-zinc-600">
        Updated {timeAgo(reading.timestamp)}
      </p>

      {error && (
        <p className="text-sm text-orange-400">
          Connection lost — showing last known reading
        </p>
      )}
    </div>
  );
}
