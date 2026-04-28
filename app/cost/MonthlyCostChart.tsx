"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: {
    label: string;
    homeCost: number;
    eatOutCost: number;
    saved: number;
  }[];
}

export default function MonthlyCostChart({ data }: Props) {
  if (data.every((d) => d.homeCost === 0 && d.eatOutCost === 0)) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-300">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `¥${v}`} />
        <Tooltip
          formatter={(value, name) => [
            `¥${Number(value).toLocaleString()}`,
            name === "homeCost" ? "料理費" : name === "eatOutCost" ? "外食換算" : "節約",
          ]}
        />
        <Legend
          formatter={(value) =>
            value === "homeCost" ? "料理費" : value === "eatOutCost" ? "外食換算" : "節約"
          }
        />
        <Bar dataKey="homeCost" fill="#f97316" radius={[4, 4, 0, 0]} />
        <Bar dataKey="eatOutCost" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
