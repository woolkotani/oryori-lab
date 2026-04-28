"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { uploadPhoto } from "@/lib/upload";

interface EatingOutLog {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner";
  place: string;
  cost: number;
  photo: string | null;
  note: string | null;
}

const MEAL_OPTIONS = [
  { value: "breakfast", label: "朝", icon: "🌅" },
  { value: "lunch", label: "昼", icon: "🌞" },
  { value: "dinner", label: "夜", icon: "🌙" },
] as const;

const QUICK_PLACES = ["コンビニ", "ファミレス", "ラーメン", "牛丼", "カフェ", "居酒屋"];

function defaultMealType(): "breakfast" | "lunch" | "dinner" {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  return "dinner";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface FormState {
  id?: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner";
  place: string;
  cost: string;
  photo: string | null;
  note: string;
}

function emptyForm(): FormState {
  return {
    date: new Date().toISOString().split("T")[0],
    mealType: defaultMealType(),
    place: "",
    cost: "",
    photo: null,
    note: "",
  };
}

export default function EatingOutSection() {
  const [logs, setLogs] = useState<EatingOutLog[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await fetch("/api/eating-out");
    const data = await res.json();
    setLogs(data);
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setEditing({ ...editing, photo: url });
    } catch {
      alert("写真のアップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editing.place.trim()) return;
    setSaving(true);

    const payload = {
      date: new Date(editing.date).toISOString(),
      mealType: editing.mealType,
      place: editing.place.trim(),
      cost: Number(editing.cost) || 0,
      photo: editing.photo,
      note: editing.note,
    };

    if (editing.id) {
      await fetch(`/api/eating-out/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/eating-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setEditing(null);
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/eating-out/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(log: EatingOutLog) {
    setEditing({
      id: log.id,
      date: new Date(log.date).toISOString().split("T")[0],
      mealType: log.mealType,
      place: log.place,
      cost: String(log.cost),
      photo: log.photo,
      note: log.note ?? "",
    });
  }

  // Stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLogs = logs.filter((l) => new Date(l.date) >= monthStart);
  const monthCount = monthLogs.length;
  const monthCost = monthLogs.reduce((s, l) => s + l.cost, 0);

  const recent = logs.slice(0, 5);

  return (
    <section className="mt-8 mb-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-700">🍽️ 外食の記録</h2>
            <p className="text-xs text-gray-400 mt-0.5">自炊以外も記録しよう</p>
          </div>
          <button
            onClick={() => setEditing(editing ? null : emptyForm())}
            className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-900 transition-colors"
          >
            {editing ? "閉じる" : "＋ 記録"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-400">今月の外食</p>
            <p className="text-lg font-bold text-gray-700">{monthCount}回</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-400">今月の外食費</p>
            <p className="text-lg font-bold text-gray-700">
              {formatCurrency(monthCost)}
            </p>
          </div>
        </div>

        {/* Form */}
        {editing && (
          <form
            onSubmit={submit}
            className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2"
          >
            <p className="text-xs text-gray-500 mb-1">
              {editing.id ? "外食を編集" : "新しい外食を記録"}
            </p>

            {/* Photo upload */}
            {editing.photo ? (
              <div className="relative">
                <img
                  src={editing.photo}
                  alt="preview"
                  className="w-full max-h-72 object-contain rounded-xl bg-white"
                />
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, photo: null })}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 bg-white rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <span className="text-2xl">📷 / 🖼</span>
                <span className="text-xs text-gray-500 mt-1">
                  {uploading ? "アップロード中..." : "写真を撮影 または 画像を選択（任意）"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                  className="hidden"
                />
              </label>
            )}

            {/* Meal type */}
            <div className="grid grid-cols-3 gap-1">
              {MEAL_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setEditing({ ...editing, mealType: m.value })}
                  className={`py-1.5 rounded-lg text-sm transition-colors ${
                    editing.mealType === m.value
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* Date */}
            <input
              type="date"
              value={editing.date}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />

            {/* Place + Google Maps search */}
            <div className="flex gap-2">
              <input
                type="text"
                value={editing.place}
                onChange={(e) =>
                  setEditing({ ...editing, place: e.target.value })
                }
                placeholder="店名・場所（例：すき家 渋谷店）"
                required
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editing.place || "飲食店")}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Google Maps で検索"
                className="shrink-0 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                🗺
              </a>
            </div>
            <p className="text-xs text-gray-400">
              🗺 ボタンで Google Maps で店名を検索 →
              正式名称をコピーして貼り付けると正確に記録できます
            </p>
            <div className="flex gap-1 flex-wrap">
              {QUICK_PLACES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setEditing({ ...editing, place: p })}
                  className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full hover:bg-gray-100"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Cost */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">¥</span>
              <input
                type="number"
                value={editing.cost}
                onChange={(e) => setEditing({ ...editing, cost: e.target.value })}
                placeholder="金額"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
              />
            </div>

            {/* Note */}
            <input
              type="text"
              value={editing.note}
              onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              placeholder="メモ（任意）"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />

            <button
              type="submit"
              disabled={!editing.place.trim() || saving}
              className="w-full bg-gray-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
            >
              {saving ? "保存中..." : editing.id ? "更新する" : "記録する"}
            </button>
          </form>
        )}

        {/* Recent list */}
        {loaded && recent.length === 0 && !editing && (
          <div className="text-center text-gray-400 text-sm py-3">
            まだ外食の記録がありません
          </div>
        )}

        {recent.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">最近の外食</p>
            <div className="space-y-2">
              {recent.map((log) => {
                const meal = MEAL_OPTIONS.find((m) => m.value === log.mealType);
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {log.photo ? (
                      <img
                        src={log.photo}
                        alt={log.place}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">
                        {meal?.icon ?? "🍽️"}
                      </div>
                    )}
                    <button
                      onClick={() => startEdit(log)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm text-gray-800 font-semibold truncate">
                        {log.place}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(log.date)} {meal?.label}
                        {log.note && ` ・ ${log.note}`}
                      </p>
                    </button>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm text-gray-700 font-bold">
                        {formatCurrency(log.cost)}
                      </span>
                      <div className="flex gap-1">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(log.place)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Google Maps で開く"
                          className="text-blue-400 hover:text-blue-600 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🗺
                        </a>
                        <button
                          onClick={() => remove(log.id)}
                          className="text-gray-300 hover:text-red-400 text-xs"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              ※ タップで編集できます
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
