"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { RadiationReading } from "@/lib/redis";

function formatTime(timestamp: string) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getLineColor(data: RadiationReading[]) {
  if (data.length === 0) return "#34d399"; // emerald-400
  const latest = data[data.length - 1].value;
  if (latest > 1000) return "#ef4444";
  if (latest > 100) return "#f97316";
  if (latest > 50) return "#fbbf24";
  return "#34d399";
}

export default function RadiationChart({
  initialHistory,
}: {
  initialHistory: RadiationReading[];
}) {
  const [history, setHistory] = useState(initialHistory);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/radiation/history");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch {
      // keep showing last known data
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const color = getLineColor(history);

  if (history.length === 0) {
    return (
      <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-center text-sm text-zinc-600">
          No history yet — readings will appear here as they arrive.
        </p>
      </div>
    );
  }

  const chartData = history.map((r) => ({
    time: formatTime(r.timestamp),
    cpm: Math.round(r.value),
    fullTime: r.timestamp,
  }));

  const maxCpm = Math.max(...history.map((r) => r.value));
  const yMax = Math.max(100, Math.ceil(maxCpm * 1.2));

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 pt-6">
      <div className="flex items-center justify-between px-2 mb-4">
        <h2 className="text-sm font-medium text-zinc-400 tracking-wide uppercase">
          History
        </h2>
        <span className="text-xs text-zinc-600">
          {history.length} readings
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="cpmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "#52525b" }}
            tickLine={false}
            axisLine={{ stroke: "#27272a" }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 11, fill: "#52525b" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#e4e4e7" }}
            formatter={(value) => [`${value} CPM`, "Radiation"]}
          />
          {maxCpm > 50 && (
            <ReferenceLine y={50} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.4} />
          )}
          <Area
            type="monotone"
            dataKey="cpm"
            stroke={color}
            strokeWidth={2}
            fill="url(#cpmGradient)"
            dot={false}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
