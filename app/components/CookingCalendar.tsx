"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MealType = "breakfast" | "lunch" | "dinner";

interface LogEntry {
  date: string;
  dishId: string;
  dishName: string;
  photo: string | null;
  mealType: MealType;
  tags: string[];
}

interface EatingOutEntry {
  id: string;
  date: string;
  place: string;
  photo: string | null;
  cost: number;
  mealType: MealType;
}

type SlotEntry =
  | { kind: "home"; data: LogEntry }
  | { kind: "out"; data: EatingOutEntry }
  | undefined;

interface Props {
  logs: LogEntry[];
  eatingOutLogs?: EatingOutEntry[];
}

type Range = "week" | "month";

const MEALS: { type: MealType; icon: string; label: string }[] = [
  { type: "breakfast", icon: "🌅", label: "朝" },
  { type: "lunch", icon: "🌞", label: "昼" },
  { type: "dinner", icon: "🌙", label: "夜" },
];

const HOME_COLOR = "#fb923c"; // orange-400
const OUT_COLOR = "#6b7280"; // gray-500

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CookingCalendar({
  logs,
  eatingOutLogs = [],
}: Props) {
  const [range, setRange] = useState<Range>("week");

  const { days, byDateMeal, homeCount, outCount, totalSlots, percentage } =
    useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalDays = range === "week" ? 7 : 30;
      const days: string[] = [];
      for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(toDateString(d));
      }

      const byDateMeal: Record<string, Record<MealType, SlotEntry>> = {};
      days.forEach((d) => {
        byDateMeal[d] = {
          breakfast: undefined,
          lunch: undefined,
          dinner: undefined,
        };
      });

      // 自炊優先で配置
      logs.forEach((log) => {
        if (byDateMeal[log.date] && !byDateMeal[log.date][log.mealType]) {
          byDateMeal[log.date][log.mealType] = { kind: "home", data: log };
        }
      });
      eatingOutLogs.forEach((log) => {
        if (byDateMeal[log.date] && !byDateMeal[log.date][log.mealType]) {
          byDateMeal[log.date][log.mealType] = { kind: "out", data: log };
        }
      });

      const totalSlots = totalDays * 3;
      let homeCount = 0;
      let outCount = 0;
      days.forEach((d) => {
        MEALS.forEach((m) => {
          const entry = byDateMeal[d][m.type];
          if (entry?.kind === "home") homeCount++;
          else if (entry?.kind === "out") outCount++;
        });
      });
      const percentage = Math.round(
        ((homeCount + outCount) / totalSlots) * 100
      );

      return { days, byDateMeal, homeCount, outCount, totalSlots, percentage };
    }, [logs, eatingOutLogs, range]);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-700">📅 食事カレンダー（3食）</h2>
        <div className="flex bg-gray-100 rounded-full p-0.5 text-xs">
          <button
            onClick={() => setRange("week")}
            className={`px-3 py-1 rounded-full transition-colors ${
              range === "week"
                ? "bg-white text-orange-500 shadow-sm font-semibold"
                : "text-gray-500"
            }`}
          >
            1週間
          </button>
          <button
            onClick={() => setRange("month")}
            className={`px-3 py-1 rounded-full transition-colors ${
              range === "month"
                ? "bg-white text-orange-500 shadow-sm font-semibold"
                : "text-gray-500"
            }`}
          >
            1ヶ月
          </button>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">
            記録率{" "}
            <span className="font-bold text-orange-500 text-lg">
              {percentage}%
            </span>
          </p>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>
              <span
                className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                style={{ background: HOME_COLOR }}
              />
              自炊 <span className="font-bold text-gray-700">{homeCount}</span>
            </span>
            <span>
              <span
                className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                style={{ background: OUT_COLOR }}
              />
              外食 <span className="font-bold text-gray-700">{outCount}</span>
            </span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="h-full transition-all"
            style={{
              width: `${(homeCount / totalSlots) * 100}%`,
              background: HOME_COLOR,
            }}
          />
          <div
            className="h-full transition-all"
            style={{
              width: `${(outCount / totalSlots) * 100}%`,
              background: OUT_COLOR,
            }}
          />
        </div>
      </div>

      {range === "week" ? (
        <WeekGrid days={days} byDateMeal={byDateMeal} />
      ) : (
        <MonthGrid days={days} byDateMeal={byDateMeal} />
      )}
    </section>
  );
}

function SlotCell({ entry, meal }: { entry: SlotEntry; meal: { type: MealType; icon: string; label: string } }) {
  if (!entry) {
    return (
      <div
        title={`${meal.label}: 未記録`}
        className="aspect-square rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center"
      >
        <span className="text-[10px] opacity-30">{meal.icon}</span>
      </div>
    );
  }

  if (entry.kind === "home") {
    const data = entry.data;
    return (
      <Link
        href={`/dishes/${data.dishId}`}
        title={`${meal.label}・自炊: ${data.dishName}`}
        className="aspect-square rounded-md overflow-hidden relative border-2"
        style={{ borderColor: HOME_COLOR }}
      >
        {data.photo ? (
          <img
            src={data.photo}
            alt={data.dishName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-base"
            style={{ background: HOME_COLOR + "20" }}
          >
            🍽️
          </div>
        )}
        <div
          className="absolute top-0 left-0 text-[8px] px-0.5 rounded-br text-white font-bold"
          style={{ background: HOME_COLOR }}
        >
          {meal.icon}
        </div>
      </Link>
    );
  }

  // 外食
  const data = entry.data;
  return (
    <div
      title={`${meal.label}・外食: ${data.place} ¥${data.cost}`}
      className="aspect-square rounded-md overflow-hidden relative border-2"
      style={{ borderColor: OUT_COLOR }}
    >
      {data.photo ? (
        <img
          src={data.photo}
          alt={data.place}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-base"
          style={{ background: OUT_COLOR + "20" }}
        >
          🍽️
        </div>
      )}
      <div
        className="absolute top-0 left-0 text-[8px] px-0.5 rounded-br text-white font-bold"
        style={{ background: OUT_COLOR }}
      >
        外
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  byDateMeal,
}: {
  days: string[];
  byDateMeal: Record<string, Record<MealType, SlotEntry>>;
}) {
  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];
  const today = toDateString(new Date());

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((date) => {
        const d = new Date(date + "T00:00:00");
        const dayLabel = dayLabels[d.getDay()];
        const dayNum = d.getDate();
        const isToday = date === today;
        const slots = byDateMeal[date];

        return (
          <div key={date} className="flex flex-col gap-1">
            <div
              className={`text-center py-1 rounded-lg ${isToday ? "bg-orange-100" : ""}`}
            >
              <p
                className={`text-[10px] leading-none ${
                  d.getDay() === 0
                    ? "text-red-400"
                    : d.getDay() === 6
                      ? "text-blue-400"
                      : "text-gray-400"
                }`}
              >
                {dayLabel}
              </p>
              <p
                className={`text-xs font-bold mt-0.5 ${
                  isToday ? "text-orange-600" : "text-gray-700"
                }`}
              >
                {dayNum}
              </p>
            </div>

            {MEALS.map((meal) => (
              <SlotCell key={meal.type} entry={slots[meal.type]} meal={meal} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({
  days,
  byDateMeal,
}: {
  days: string[];
  byDateMeal: Record<string, Record<MealType, SlotEntry>>;
}) {
  const today = toDateString(new Date());

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((date) => {
        const d = new Date(date + "T00:00:00");
        const dayNum = d.getDate();
        const isToday = date === today;
        const isSunday = d.getDay() === 0;
        const isSaturday = d.getDay() === 6;
        const slots = byDateMeal[date];
        const slotEntries = MEALS.map((m) => ({
          meal: m,
          entry: slots[m.type],
        }));
        const filledCount = slotEntries.filter((s) => s.entry).length;
        const firstWithPhoto = slotEntries.find((s) => {
          const e = s.entry;
          if (!e) return false;
          return !!e.data.photo;
        });
        const linkTo = (() => {
          const homeFirst = slotEntries.find((s) => s.entry?.kind === "home");
          if (homeFirst?.entry?.kind === "home")
            return `/dishes/${homeFirst.entry.data.dishId}`;
          return null;
        })();

        const inner = (
          <div
            className={`aspect-[3/4] rounded-lg relative overflow-hidden border ${
              filledCount === 0
                ? "bg-gray-50 border-gray-100"
                : "bg-white border-orange-100"
            } ${isToday ? "ring-2 ring-orange-400" : ""}`}
          >
            {firstWithPhoto?.entry?.data.photo && (
              <>
                <img
                  src={firstWithPhoto.entry.data.photo}
                  alt=""
                  className="absolute inset-x-0 top-0 h-3/5 w-full object-cover opacity-80"
                />
                <div className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-t from-white/40 to-transparent" />
              </>
            )}

            <p
              className={`absolute top-0.5 left-1 text-[9px] font-bold ${
                filledCount > 0
                  ? "text-gray-700 drop-shadow-sm"
                  : isSunday
                    ? "text-red-300"
                    : isSaturday
                      ? "text-blue-300"
                      : "text-gray-300"
              }`}
            >
              {dayNum}
            </p>

            <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5">
              {slotEntries.map((s) => {
                let bg = "#e5e7eb";
                if (s.entry?.kind === "home") bg = HOME_COLOR;
                else if (s.entry?.kind === "out") bg = OUT_COLOR;
                return (
                  <div
                    key={s.meal.type}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: bg }}
                  />
                );
              })}
            </div>
          </div>
        );

        return linkTo ? (
          <Link key={date} href={linkTo}>
            {inner}
          </Link>
        ) : (
          <div key={date}>{inner}</div>
        );
      })}
    </div>
  );
}
