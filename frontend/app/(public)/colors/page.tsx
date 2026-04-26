"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Palette, Sparkles, X } from "lucide-react";
import { paintColors } from "@/lib/data/colors-data";

export default function ColorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof paintColors)[0] | null
  >(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredColors = paintColors.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.hex.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = [
    "all",
    ...Array.from(new Set(paintColors.map((c) => c.category))),
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-10 mb-8 border border-blue-100 text-center">
        <Palette size={48} className="text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          Bảng Mã Màu Sơn Tĩnh Điện
        </h2>
        <p className="text-slate-500 text-lg mb-6">
          AkzoNobel Interpon — Tiêu chuẩn chất lượng hàng đầu thế giới
        </p>
        <div className="relative max-w-md mx-auto">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            placeholder="Tìm theo mã màu, tên hoặc HEX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${categoryFilter === cat ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat === "all" ? "Tất cả" : cat}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-400">
          {filteredColors.length} màu
        </span>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredColors.map((color) => (
          <div
            key={color.code}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300"
            onClick={() =>
              setSelectedColor(
                selectedColor?.code === color.code ? null : color,
              )
            }
          >
            <div className="h-28 w-full" style={{ background: color.hex }} />
            <div className="p-3">
              <div className="text-xs font-bold text-blue-600 tracking-wider">
                {color.code}
              </div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {color.name}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {color.hex} · {color.gloss}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredColors.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p>Không tìm thấy màu phù hợp. Thử nhập mã màu khác.</p>
        </div>
      )}

      {/* Color Detail Modal */}
      {selectedColor && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedColor(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {selectedColor.name}
              </h3>
              <button
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedColor(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Color Preview */}
            <div className="px-5 pt-5">
              <div
                className="h-40 rounded-xl mb-6"
                style={{
                  background: selectedColor.hex,
                  boxShadow: `0 10px 40px ${selectedColor.hex}60`,
                }}
              />
            </div>

            {/* Details */}
            <div className="px-5 pb-5">
              <div className="bg-slate-50 rounded-xl p-5 space-y-0">
                {[
                  { label: "Mã Màu", value: selectedColor.code },
                  { label: "HEX", value: selectedColor.hex, mono: true },
                  { label: "Danh mục", value: selectedColor.category },
                  { label: "Độ bóng", value: selectedColor.gloss },
                  { label: "Bề mặt", value: selectedColor.surface },
                  { label: "Ứng dụng", value: selectedColor.application },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0"
                  >
                    <span className="text-sm text-slate-500 font-medium">
                      {row.label}
                    </span>
                    <span
                      className={`text-sm text-slate-800 font-semibold ${row.mono ? "font-mono" : ""}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}

                {/* 3 trường B2C */}
                {[
                  { label: "Độ phủ lý thuyết", value: selectedColor.coverage },
                  {
                    label: "Quy cách đóng gói",
                    value: selectedColor.packaging,
                  },
                  { label: "Quy trình pha chế", value: selectedColor.mixing },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0"
                  >
                    <span className="text-sm text-blue-600 font-bold">
                      {row.label}
                    </span>
                    <span className="text-sm text-slate-800 font-semibold">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Link
                  href="/rd-tracking/new"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all no-underline"
                >
                  <Sparkles size={16} /> Yêu cầu mẫu thử
                </Link>
                <button
                  className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer border-none"
                  onClick={() => setSelectedColor(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
