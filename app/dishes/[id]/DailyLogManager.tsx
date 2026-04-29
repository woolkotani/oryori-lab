"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MealType = "breakfast" | "lunch" | "dinner";

interface DailyLog {
  id: string;
  date: string;
  mealType: MealType;
  note: string | null;
}

const MEAL_OPTIONS: { value: MealType; icon: string; label: string }[] = [
  { value: "breakfast", icon: "🌅", label: "朝" },
  { value: "lunch", icon: "🌞", label: "昼" },
  { value: "dinner", icon: "🌙", label: "夜" },
];

function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  return "dinner";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}（${["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}）`;
}

function toDateInputValue(dateStr: string): string {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateStringToISO(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

interface Props {
  dishId: string;
  initialLogs: DailyLog[];
}

export default function DailyLogManager({ dishId, initialLogs }: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState<DailyLog[]>(initialLogs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editDate, setEditDate] = useState("");
  const [editMeal, setEditMeal] = useState<MealType>("dinner");

  function startEdit(log: DailyLog) {
    setEditingId(log.id);
    setAdding(false);
    setEditDate(toDateInputValue(log.date));
    setEditMeal(log.mealType);
  }

  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setEditDate(toDateInputValue(new Date().toISOString()));
    setEditMeal(defaultMealType());
  }

  function cancel() {
    setEditingId(null);
    setAdding(false);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/daily-logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStringToISO(editDate),
        mealType: editMeal,
      }),
    });
    const updated = await res.json();
    setLogs((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, date: updated.date, mealType: updated.mealType } : l))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    );
    cancel();
    router.refresh();
  }

  async function saveAdd() {
    const res = await fetch("/api/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStringToISO(editDate),
        dishId,
        mealType: editMeal,
        note: "",
      }),
    });
    const created = await res.json();
    setLogs((prev) =>
      [
        { id: created.id, date: created.date, mealType: created.mealType, note: created.note },
        ...prev,
      ].sort((a, b) => +new Date(b.date) - +new Date(a.date))
    );
    cancel();
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/daily-logs/${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-700">📅 食べた記録</h2>
        <button
          onClick={adding ? cancel : startAdd}
          className="text-sm bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors"
        >
          {adding ? "閉じる" : "＋ 記録を追加"}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-orange-50 rounded-xl p-3 mb-3 space-y-2">
          <p className="text-xs text-gray-500">新しい記録を追加</p>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
          <div className="grid grid-cols-3 gap-1">
            {MEAL_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setEditMeal(m.value)}
                className={`py-2 rounded-lg text-sm transition-colors ${
                  editMeal === m.value
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <button
            onClick={saveAdd}
            className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-600"
          >
            記録する
          </button>
        </div>
      )}

      {/* Logs list */}
      {logs.length === 0 && !adding ? (
        <p className="text-sm text-gray-400 text-center py-3">
          まだ記録がありません
        </p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const meal = MEAL_OPTIONS.find((m) => m.value === log.mealType);
            const isEditing = editingId === log.id;

            if (isEditing) {
              return (
                <div
                  key={log.id}
                  className="bg-orange-50 rounded-xl p-3 space-y-2"
                >
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  />
                  <div className="grid grid-cols-3 gap-1">
                    {MEAL_OPTIONS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setEditMeal(m.value)}
                        className={`py-2 rounded-lg text-sm transition-colors ${
                          editMeal === m.value
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={cancel}
                      className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => saveEdit(log.id)}
                      className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-semibold"
                    >
                      保存
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 border border-gray-100"
              >
                <span className="text-xl">{meal?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">
                    {formatDate(log.date)}
                  </p>
                  <p className="text-xs text-gray-400">{meal?.label}食</p>
                </div>
                <button
                  onClick={() => startEdit(log)}
                  className="text-xs text-orange-500 px-2 py-1 hover:bg-orange-50 rounded"
                >
                  編集
                </button>
                <button
                  onClick={() => remove(log.id)}
                  className="text-xs text-gray-300 hover:text-red-400 px-2 py-1"
                >
                  削除
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
