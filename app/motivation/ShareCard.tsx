"use client";

import { useRef } from "react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  streak: number;
  saved: number;
  totalLogs: number;
  monthLogs: number;
  month: number;
}

export default function ShareCard({
  streak,
  saved,
  totalLogs,
  monthLogs,
  month,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleDownload() {
    const { default: html2canvas } = await import("html2canvas");
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: null,
    });
    const link = document.createElement("a");
    link.download = `oryori-lab_${month}月まとめ.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div>
      {/* Card preview */}
      <div
        ref={cardRef}
        className="rounded-2xl p-6 text-white"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm">🍳 オリョウリラボ</p>
            <p className="text-2xl font-black mt-0.5">{month}月のまとめ</p>
          </div>
          <span className="text-5xl">👨‍🍳</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-orange-100 text-xs">連続記録</p>
            <p className="text-3xl font-black">{streak}日</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-orange-100 text-xs">今月の節約</p>
            <p className="text-2xl font-black">{formatCurrency(saved)}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-orange-100 text-xs">今月の記録</p>
            <p className="text-3xl font-black">{monthLogs}回</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-orange-100 text-xs">総記録数</p>
            <p className="text-3xl font-black">{totalLogs}回</p>
          </div>
        </div>

        <p className="text-orange-100 text-xs text-center mt-4">
          自炊でヘルシー & 節約生活！
        </p>
      </div>

      <button
        onClick={handleDownload}
        className="mt-3 w-full border border-orange-300 text-orange-500 py-3 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors"
      >
        📥 画像として保存
      </button>
    </div>
  );
}
