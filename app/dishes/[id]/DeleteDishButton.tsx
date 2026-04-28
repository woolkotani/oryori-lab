"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDishButton({ dishId }: { dishId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/dishes/${dishId}`, { method: "DELETE" });
    router.push("/dishes");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-2 flex-1">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl text-sm"
        >
          キャンセル
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 bg-red-500 text-white py-3 rounded-xl text-sm font-semibold"
        >
          削除する
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex-1 border border-red-200 text-red-400 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
    >
      削除
    </button>
  );
}
