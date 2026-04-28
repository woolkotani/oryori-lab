import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function parseJsonField<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getStreakFromDates(dates: string[]): {
  current: number;
  longest: number;
} {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...new Set(dates)].sort();
  let longest = 1;
  let current = 1;
  let runCurrent = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      runCurrent++;
      longest = Math.max(longest, runCurrent);
    } else {
      runCurrent = 1;
    }
  }

  // Check if streak is still active (last date is today or yesterday)
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  const lastDate = sorted[sorted.length - 1];

  if (lastDate === today || lastDate === yesterday) {
    current = runCurrent;
  } else {
    current = 0;
  }

  return { current, longest };
}

export const EATING_OUT_COST =
  Number(process.env.EATING_OUT_AVERAGE_COST) || 1000;
