"use client";
import React, { useRef } from "react";
import { X, Printer } from "lucide-react";

interface ChiTietItem {
  MaItem?: string;
  TenItem?: string;
  MaMau?: string;
  TenMau?: string;
  SoLuong?: number;
  DonGia?: number;
  ThanhTien?: number;
}

interface PhieuData {
  _id: string;
  MaPhieu: string;
  LoaiPhieu: "NHAP" | "XUAT";
  LoaiHang: "SAN_PHAM" | "NGUYEN_VAT_LIEU";
  TrangThai: string;
  MoTa?: string;
  GhiChu?: string;
  TongTien: number;
  TenNguoiLap?: string;
  TenNguoiDuyet?: string;
  NgayDuyet?: string;
  createdAt: string;
  ChiTiet: ChiTietItem[];
  NhaCungCapID?: { TenNCC?: string } | null;
}

interface Props {
  phieu: PhieuData | null;
  onClose: () => void;
}

export default function PhieuDetailModal({ phieu, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!phieu) return null;

  const isNhap = phieu.LoaiPhieu === "NHAP";
  const tieuDe = isNhap ? "PHIẾU NHẬP KHO" : "PHIẾU XUẤT KHO";

  const ngayTao = new Date(phieu.createdAt);
  const ngay = ngayTao.getDate().toString().padStart(2, "0");
  const thang = (ngayTao.getMonth() + 1).toString().padStart(2, "0");
  const nam = ngayTao.getFullYear();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${tieuDe} - ${phieu.MaPhieu}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #000; background: #fff; }
            .phieu-wrapper { max-width: 800px; margin: 20px auto; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
            .company-info { font-size: 12px; line-height: 1.6; }
            .company-name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
            .tieu-de { text-align: center; }
            .tieu-de h1 { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
            .tieu-de .date-row { font-size: 13px; margin-top: 8px; }
            .tieu-de .so { font-size: 18px; color: #cc0000; font-weight: bold; margin-top: 4px; }
            .info-row { margin: 12px 0; font-size: 13px; line-height: 2; border-bottom: 1px dotted #555; }
            .info-label { font-weight: bold; }
            .double-row { display: flex; gap: 24px; }
            .double-row .info-row { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 12px; }
            th { font-weight: bold; background: #f5f5f5; }
            td.text-left { text-align: left; }
            td.text-right { text-align: right; }
            .tong-row td { font-weight: bold; background: #fafafa; }
            .signatures { display: flex; justify-content: space-between; margin-top: 32px; text-align: center; }
            .sig-item { flex: 1; padding: 0 8px; font-size: 12px; }
            .sig-item .title { font-weight: bold; }
            .sig-item .sub { font-style: italic; color: #555; }
            .sig-item .space { height: 56px; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  // Filter empty rows
  const chiTietHienThi = phieu.ChiTiet.filter(
    (it) => it.MaItem || it.TenItem
  );

  return (
    <>
      {/* Overlay */}
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
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isNhap
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {isNhap ? "Phiếu Nhập" : "Phiếu Xuất"}
              </span>
              <span className="text-slate-800 font-bold text-sm">
                {phieu.MaPhieu}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Printer size={15} />
                In phiếu
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 p-6">
            {/* ════ PHIẾU CONTENT (dùng cho cả xem và in) ════ */}
            <div ref={printRef}>
              <div className="phieu-wrapper" style={{ fontFamily: "'Times New Roman', Times, serif", maxWidth: 780, margin: "0 auto" }}>

                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  {/* Company info - left */}
                  <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                    <div style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase" }}>
                      Công ty CP TM và DV VOSCO
                    </div>
                    <div>Địa chỉ: 215 Lạch Tray, Gia Viên, Hải Phòng</div>
                    <div>Điện thoại: (0225) 3.842.222</div>
                    <div>Website: www.vosco.vn</div>
                  </div>

                  {/* Title - right */}
                  <div style={{ textAlign: "center", minWidth: 340 }}>
                    <h1 style={{ fontSize: 22, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
                      {tieuDe}
                    </h1>
                    <div style={{ fontSize: 13, marginTop: 8 }}>
                      Ngày <strong>{ngay}</strong> tháng <strong>{thang}</strong> năm <strong>{nam}</strong>
                    </div>
                    <div style={{ fontSize: 17, color: "#cc0000", fontWeight: "bold", marginTop: 4 }}>
                      Số: <span style={{ letterSpacing: 1 }}>{phieu.MaPhieu}</span>
                    </div>
                  </div>
                </div>

                {/* INFO ROWS */}
                <div style={{ borderBottom: "1px dotted #555", paddingBottom: 4, marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: "bold" }}>Nhà cung cấp: </span>
                  {phieu.NhaCungCapID
                    ? (phieu.NhaCungCapID as any).TenNCC || "—"
                    : isNhap
                    ? "(Xem thông tin nhà cung cấp)"
                    : "Nội bộ"}
                  {".".repeat(60)}
                </div>
                <div style={{ display: "flex", gap: 24, marginBottom: 10 }}>
                  <div style={{ flex: 1, borderBottom: "1px dotted #555", paddingBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: "bold" }}>
                      {isNhap ? "Nhập tại kho" : "Xuất từ kho"}:
                    </span>{" "}
                    Kho sơn tĩnh điện {"..".repeat(10)}
                  </div>
                  <div style={{ flex: 1, borderBottom: "1px dotted #555", paddingBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: "bold" }}>
                      {isNhap ? "Người nhận" : "Người xuất"}:
                    </span>{" "}
                    {phieu.TenNguoiLap || ""} {"..".repeat(10)}
                  </div>
                </div>

                {/* BẢNG CHI TIẾT */}
                <table style={{ width: "100%", borderCollapse: "collapse", margin: "4px 0" }}>
                  <thead>
                    <tr>
                      <th style={thStyle({ width: 40 })}>STT</th>
                      <th style={thStyle({ width: 200 })}>TÊN HÀNG / MÃ MÀU</th>
                      <th style={thStyle({ width: 80 })}>ĐVT</th>
                      <th style={thStyle({ width: 60 })}>SL</th>
                      <th style={thStyle({ width: 100 })}>ĐƠN GIÁ</th>
                      <th style={thStyle({ width: 110 })}>THÀNH TIỀN</th>
                      <th style={thStyle({ width: 130 })}>GHI CHÚ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chiTietHienThi.length > 0 ? (
                      chiTietHienThi.map((it, idx) => (
                        <tr key={idx}>
                          <td style={tdStyle({ align: "center" })}>{idx + 1}</td>
                          <td style={tdStyle({ align: "left" })}>
                            <div style={{ fontWeight: 600 }}>{it.TenItem || "—"}</div>
                            {it.MaMau && (
                              <div style={{ fontSize: 11, color: "#666" }}>
                                Màu: {it.TenMau ? `${it.TenMau} (${it.MaMau})` : it.MaMau}
                              </div>
                            )}
                          </td>
                          <td style={tdStyle({ align: "center" })}>Thùng</td>
                          <td style={tdStyle({ align: "center" })}>{it.SoLuong ?? ""}</td>
                          <td style={tdStyle({ align: "right" })}>
                            {it.DonGia ? it.DonGia.toLocaleString("vi-VN") : "—"}
                          </td>
                          <td style={tdStyle({ align: "right" })}>
                            {it.ThanhTien ? it.ThanhTien.toLocaleString("vi-VN") : "—"}
                          </td>
                          <td style={tdStyle({ align: "left" })}></td>
                        </tr>
                      ))
                    ) : (
                      // Empty rows placeholder
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx}>
                          <td style={tdStyle({ align: "center", height: 28 })}>{idx + 1}</td>
                          <td style={tdStyle({})}></td>
                          <td style={tdStyle({})}></td>
                          <td style={tdStyle({})}></td>
                          <td style={tdStyle({})}></td>
                          <td style={tdStyle({})}></td>
                          <td style={tdStyle({})}></td>
                        </tr>
                      ))
                    )}
                    {/* TỔNG */}
                    <tr>
                      <td colSpan={5} style={{ ...tdStyle({ align: "right" }), fontWeight: "bold", borderRight: "1px solid #000" }}>
                        TỔNG CỘNG:
                      </td>
                      <td style={{ ...tdStyle({ align: "right" }), fontWeight: "bold" }}>
                        {phieu.TongTien.toLocaleString("vi-VN")} đ
                      </td>
                      <td style={tdStyle({})}></td>
                    </tr>
                  </tbody>
                </table>

                {/* GHI CHÚ */}
                {phieu.GhiChu && (
                  <div style={{ fontSize: 12, marginTop: 6, color: "#444" }}>
                    <strong>Ghi chú:</strong> {phieu.GhiChu}
                  </div>
                )}
                {phieu.MoTa && (
                  <div style={{ fontSize: 12, marginTop: 4, color: "#444" }}>
                    <strong>Mô tả:</strong> {phieu.MoTa}
                  </div>
                )}

                {/* SIGNATURES */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36, textAlign: "center" }}>
                  {[
                    { title: isNhap ? "Người giao" : "Người xuất kho", sub: "(Ký, họ tên)" },
                    { title: "Thủ kho", sub: "(Ký, họ tên)" },
                    { title: isNhap ? "Người nhận" : "Người nhận hàng", sub: "(Ký, họ tên)" },
                    { title: "Kế toán", sub: "(Ký, họ tên)" },
                    { title: "Quản lý kho", sub: "(Ký, họ tên)" },
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
    </>
  );
}

// Style helpers
function thStyle(extra: { width?: number } = {}): React.CSSProperties {
  return {
    border: "1px solid #000",
    padding: "6px 8px",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
    width: extra.width,
  };
}

function tdStyle(extra: { align?: string; height?: number } = {}): React.CSSProperties {
  return {
    border: "1px solid #000",
    padding: "5px 8px",
    fontSize: 12,
    textAlign: (extra.align as any) || "center",
    height: extra.height,
    verticalAlign: "middle",
  };
}
