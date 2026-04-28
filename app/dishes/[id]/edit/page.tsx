"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import DailyLogManager from "../DailyLogManager";
import { uploadPhoto } from "@/lib/upload";

type MealType = "breakfast" | "lunch" | "dinner";
interface InitialLog {
  id: string;
  date: string;
  mealType: MealType;
  note: string | null;
}

const ALL_TAGS = ["和食", "洋食", "中華", "イタリアン", "デザート", "その他"];

export default function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [names, setNames] = useState<string[]>([""]);
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [initialLogs, setInitialLogs] = useState<InitialLog[]>([]);

  useEffect(() => {
    fetch(`/api/dishes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setNames(d.name ? d.name.split("・") : [""]);
        setMemo(d.memo ?? "");
        setTags(JSON.parse(d.tags ?? "[]"));
        setPhoto(d.photo ?? null);
        const logs: InitialLog[] = (d.dailyLogs ?? []).map(
          (l: { id: string; date: string; mealType?: string; note: string | null }) => ({
            id: l.id,
            date: l.date,
            mealType: (l.mealType ?? "dinner") as MealType,
            note: l.note,
          })
        );
        setInitialLogs(logs);
        setLoaded(true);
      });
  }, [id]);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setPhoto(url);
    } catch {
      alert("写真のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function updateName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addName() {
    setNames((prev) => [...prev, ""]);
  }

  function removeName(index: number) {
    setNames((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validNames = names.map((n) => n.trim()).filter(Boolean);
    if (validNames.length === 0) return;
    setSaving(true);
    await fetch(`/api/dishes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: validNames.join("・"), memo, tags, photo }),
    });
    router.push(`/dishes/${id}`);
    router.refresh();
  }

  if (!loaded) {
    return (
      <div className="p-4 pt-10 text-center text-gray-400">読み込み中...</div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">料理を編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            写真
          </label>
          {photo ? (
            <div className="relative">
              <img
                src={photo}
                alt="preview"
                className="w-full max-h-80 object-contain rounded-xl bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors">
              <span className="text-3xl">📷</span>
              <span className="text-sm text-orange-400 mt-2">
                {uploading ? "アップロード中..." : "写真を変更"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="card p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            料理名 <span className="text-orange-500">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">（複数追加できます）</span>
          </label>
          <div className="space-y-2">
            {names.map((n, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={n}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={i === 0 ? "料理名" : "追加の料理名"}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                />
                {names.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeName(i)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 text-lg flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addName}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 mt-1"
            >
              <span className="text-lg">＋</span> 料理名を追加
            </button>
          </div>
        </div>

        <div className="card p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            タグ
          </label>
          <div className="flex gap-2 flex-wrap">
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  tags.includes(t)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            メモ
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={names.every((n) => !n.trim()) || saving}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "料理情報を保存"}
        </button>
      </form>

      {/* Daily logs - date & meal type editing */}
      <div className="mt-4">
        <DailyLogManager dishId={id} initialLogs={initialLogs} />
      </div>
    </div>
  );
}
