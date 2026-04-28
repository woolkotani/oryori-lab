"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { NutritionDay } from "@/lib/types";

interface Props {
  data: NutritionDay[];
  type?: "calories" | "macro";
}

export default function NutritionWeekChart({ data, type = "calories" }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("ja-JP", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    }),
  }));

  const hasData = data.some(
    (d) => d.calories > 0 || d.protein > 0 || d.fat > 0 || d.carbs > 0
  );

  if (!hasData) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
        データがありません
      </div>
    );
  }

  if (type === "macro") {
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={formatted}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit="g" />
          <Tooltip
            formatter={(v, name) => [
              `${Math.round(Number(v))}g`,
              name === "protein"
                ? "タンパク質"
                : name === "fat"
                  ? "脂質"
                  : "炭水化物",
            ]}
          />
          <Legend
            formatter={(v) =>
              v === "protein" ? "タンパク質" : v === "fat" ? "脂質" : "炭水化物"
            }
          />
          <Bar dataKey="protein" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
          <Bar dataKey="fat" stackId="a" fill="#fbbf24" />
          <Bar dataKey="carbs" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart
        data={formatted}
        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="calorieGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} unit="kcal" />
        <Tooltip formatter={(v) => [`${Math.round(Number(v))}kcal`, "カロリー"]} />
        <Area
          type="monotone"
          dataKey="calories"
          stroke="#f97316"
          fill="url(#calorieGrad)"
          strokeWidth={2}
          dot={{ fill: "#f97316", r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
