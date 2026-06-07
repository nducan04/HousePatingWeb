"use client";
import React, { useRef } from "react";
import { X, Printer } from "lucide-react";
import { paintColors } from "@/lib/data/colors-data";

interface ChiTietRow {
  Sanpham?: { TenDongSon?: string; MaSanPham?: string; DonViTinh?: string } | null;
  MaMau?: string;
  TenMau?: string;
  TonKhoHT?: number;
  TonThucTe?: number;
  ChenhLech?: number;
  ThanhTienChenhLech?: number;
}

interface PhieuKiemKeData {
  _id: string;
  MaPhieu: string;
  TrangThai: string;
  TongChenhLech?: number;
  createdAt: string;
  NguoiKiem?: { MaNV?: string; HoTen?: string } | null;
  ChiTiet: ChiTietRow[];
}

interface Props {
  phieu: PhieuKiemKeData | null;
  onClose: () => void;
}

export default function PhieuKiemKeModal({ phieu, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  if (!phieu) return null;

  const ngayTao = new Date(phieu.createdAt);
  const ngay = ngayTao.getDate().toString().padStart(2, "0");
  const thang = (ngayTao.getMonth() + 1).toString().padStart(2, "0");
  const nam = ngayTao.getFullYear();

  const tongChenhLech = phieu.TongChenhLech ?? 0;
  const trangThaiLabel =
    phieu.TrangThai === "DA_DUYET"
      ? "ĐÃ DUYỆT"
      : phieu.TrangThai === "TU_CHOI"
      ? "TỪ CHỐI"
      : "CHỜ DUYỆT";

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Biên bản kiểm kê - ${phieu.MaPhieu}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Times New Roman',Times,serif;font-size:13px;color:#000;background:#fff}
        .wrap{max-width:820px;margin:20px auto;padding:24px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
        h1{font-size:20px;font-weight:bold;text-transform:uppercase;letter-spacing:2px}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th,td{border:1px solid #000;padding:6px 8px;font-size:12px}
        th{font-weight:bold;background:#f0f0f0;text-align:center}
        .text-right{text-align:right} .text-center{text-align:center}
        .red{color:red} .green{color:green}
        .sigs{display:flex;justify-content:space-between;margin-top:40px;text-align:center}
        .sig{flex:1;padding:0 8px}
        .sig .title{font-weight:bold;font-size:12px}
        .sig .sub{font-style:italic;font-size:11px;color:#555}
        .space{height:60px}
      </style></head><body>
      ${content.innerHTML}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
              Phiếu Kiểm Kê
            </span>
            <span className="text-slate-800 font-bold text-sm">{phieu.MaPhieu}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                phieu.TrangThai === "DA_DUYET"
                  ? "bg-green-100 text-green-700"
                  : phieu.TrangThai === "TU_CHOI"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {trangThaiLabel}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Printer size={15} /> In phiếu
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Scrollable phieu content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div ref={printRef}>
            <div className="wrap" style={{ fontFamily: "'Times New Roman', Times, serif", maxWidth: 820, margin: "0 auto" }}>
              {/* HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                  <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase" }}>
                    Công ty CP TM và DV VOSCO
                  </div>
                  <div>Địa chỉ: 215 Lạch Tray, Gia Viên, Hải Phòng</div>
                  <div>Điện thoại: (0225) 3.842.222</div>
                  <div>Website: www.vosco.vn</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 360 }}>
                  <h1 style={{ fontSize: 20, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
                    BIÊN BẢN KIỂM KÊ KHO
                  </h1>
                  <div style={{ fontSize: 13, marginTop: 8 }}>
                    Ngày <strong>{ngay}</strong> tháng <strong>{thang}</strong> năm <strong>{nam}</strong>
                  </div>
                  <div style={{ fontSize: 16, color: "#cc0000", fontWeight: "bold", marginTop: 4 }}>
                    Số: <span style={{ letterSpacing: 1 }}>{phieu.MaPhieu}</span>
                  </div>
                </div>
              </div>

              {/* INFO */}
              <div style={{ borderBottom: "1px dotted #555", paddingBottom: 4, marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: "bold" }}>Nhân viên kiểm kê: </span>
                {phieu.NguoiKiem
                  ? `${phieu.NguoiKiem.MaNV || ""} - ${phieu.NguoiKiem.HoTen || ""}`
                  : "Admin / Ban quản lý kho"}
                {"..".repeat(30)}
              </div>
              <div style={{ borderBottom: "1px dotted #555", paddingBottom: 4, marginBottom: 10, fontSize: 13 }}>
                <span style={{ fontWeight: "bold" }}>Kho kiểm kê: </span>
                Kho sơn tĩnh điện {"..".repeat(40)}
              </div>

              {/* TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0" }}>
                <thead>
                  <tr>
                    {["STT", "Mã hàng", "Tên sản phẩm / Mã màu", "ĐVT", "Tồn hệ thống", "Tồn thực tế", "Chênh lệch", "Thành tiền CL (VNĐ)"].map((h) => (
                      <th key={h} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: 12, fontWeight: "bold", backgroundColor: "#f0f0f0", textAlign: "center" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {phieu.ChiTiet.map((row, idx) => {
                    const chenh = row.ChenhLech ?? 0;
                    return (
                      <tr key={idx}>
                        <td style={td("center")}>{idx + 1}</td>
                        <td style={td("left")}>{row.Sanpham?.MaSanPham || "—"}</td>
                        <td style={td("left")}>
                          <div style={{ fontWeight: 600 }}>{row.Sanpham?.TenDongSon || "—"}</div>
                          {row.MaMau && (
                            <div style={{ fontSize: 11, color: "#666" }}>
                              Màu: {row.MaMau ? `${paintColors.find(c => c.code === row.MaMau)?.name || row.TenMau || "Không xác định"} (${row.MaMau})` : "—"}
                            </div>
                          )}
                        </td>
                        <td style={td("center")}>{row.Sanpham?.DonViTinh || "Thùng"}</td>
                        <td style={td("center")}>{row.TonKhoHT ?? 0}</td>
                        <td style={{ ...td("center"), fontWeight: "bold", backgroundColor: "#f5f5f5" }}>{row.TonThucTe ?? 0}</td>
                        <td style={{ ...td("center"), color: chenh < 0 ? "red" : chenh > 0 ? "green" : "#333" }}>
                          {chenh > 0 ? `+${chenh}` : chenh}
                        </td>
                        <td style={{ ...td("right"), color: (row.ThanhTienChenhLech ?? 0) < 0 ? "red" : "green" }}>
                          {(row.ThanhTienChenhLech ?? 0).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })}
                  {/* TỔNG */}
                  <tr>
                    <td colSpan={7} style={{ ...td("right"), fontWeight: "bold" }}>
                      TỔNG CHÊNH LỆCH BẰNG TIỀN (Lỗ/Lãi):
                    </td>
                    <td style={{ ...td("right"), fontWeight: "bold", color: tongChenhLech < 0 ? "red" : "green" }}>
                      {tongChenhLech.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* SIGNATURES */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, textAlign: "center" }}>
                {[
                  { title: "Người lập phiếu", sub: "(Ký, họ tên)" },
                  { title: "Thủ kho", sub: "(Ký, họ tên)" },
                  { title: "Kế toán", sub: "(Ký, họ tên)" },
                  { title: "Trưởng bộ phận kho", sub: "(Ký, họ tên)" },
                  { title: "Giám đốc", sub: "(Ký, họ tên)" },
                ].map((sig, i) => (
                  <div key={i} style={{ flex: 1, padding: "0 4px" }}>
                    <div style={{ fontWeight: "bold", fontSize: 12 }}>{sig.title}</div>
                    <div style={{ fontStyle: "italic", fontSize: 11, color: "#666" }}>{sig.sub}</div>
                    <div style={{ height: 64 }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function td(align: string): React.CSSProperties {
  return { border: "1px solid #000", padding: "5px 8px", fontSize: 12, textAlign: align as any, verticalAlign: "middle" };
}
