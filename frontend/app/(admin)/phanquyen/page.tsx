"use client";

import React, { useState } from "react";
import { ShieldAlert, Save, Info, CheckCircle2, Circle } from "lucide-react";

interface Permission {
  id: string;
  module: string;
  description: string;
  roles: {
    Admin: boolean;
    NhanVien: boolean;
    KhachHangB2B: boolean;
    KhachHangB2C: boolean;
  };
}

const mockPermissions: Permission[] = [
  {
    id: "1",
    module: "Quản lý hệ thống & tài khoản",
    description: "Toàn quyền cấu hình người dùng, profile và cấp phát vai trò",
    roles: {
      Admin: true,
      NhanVien: false,
      KhachHangB2B: false,
      KhachHangB2C: false,
    },
  },
  {
    id: "2",
    module: "Dashboard & Thống kê",
    description: "Truy cập vào bảng tin tổng hợp và các chỉ số đo lường",
    roles: {
      Admin: true,
      NhanVien: true,
      KhachHangB2B: false,
      KhachHangB2C: false,
    },
  },
  {
    id: "3",
    module: "Quản lý kho & sản phẩm",
    description:
      "Điều chỉnh danh mục, giá thành, và logic nghiệp vụ Nhập/Xuất kho",
    roles: {
      Admin: true,
      NhanVien: true,
      KhachHangB2B: false,
      KhachHangB2C: false,
    },
  },
  {
    id: "4",
    module: "Hợp đồng pha chế",
    description: "Trình ký hợp đồng và lưu trữ văn bản pháp lý",
    roles: {
      Admin: true,
      NhanVien: true,
      KhachHangB2B: true,
      KhachHangB2C: false,
    },
  },
  {
    id: "5",
    module: "Theo dõi đơn hàng & R&D",
    description: "Tra cứu tiến độ sản xuất và công thức R&D",
    roles: {
      Admin: true,
      NhanVien: true,
      KhachHangB2B: true,
      KhachHangB2C: true,
    },
  },
  {
    id: "6",
    module: "Tra cứu mục lục sơn (B2C)",
    description: "Tự do tra cứu thẻ màu, giá thành tham chiếu",
    roles: {
      Admin: true,
      NhanVien: true,
      KhachHangB2B: true,
      KhachHangB2C: true,
    },
  },
  {
    id: "7",
    module: "Tích hợp AI Bot",
    description: "Nhắn tin cấu hình và hỏi đáp với AI Model lõi",
    roles: {
      Admin: true,
      NhanVien: true,
      KhachHangB2B: true,
      KhachHangB2C: true,
    },
  },
];

const ROLES = [
  {
    id: "Admin",
    name: "Admin",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-600",
    activeBg: "bg-purple-50",
    activeText: "text-purple-600",
  },
  {
    id: "NhanVien",
    name: "Nhân viên / Đại lý",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-600",
    activeBg: "bg-blue-50",
    activeText: "text-blue-600",
  },
  {
    id: "KhachHangB2B",
    name: "Khách B2B",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    activeBg: "bg-amber-50",
    activeText: "text-amber-600",
  },
  {
    id: "KhachHangB2C",
    name: "Khách B2C",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-600",
  },
];

export default function PhanQuyenPage() {
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [hasChanges, setHasChanges] = useState(false);

  const togglePermission = (
    permId: string,
    roleId: keyof Permission["roles"],
  ) => {
    if (roleId === "Admin") return;

    setPermissions(
      permissions.map((p) => {
        if (p.id === permId) {
          return {
            ...p,
            roles: {
              ...p.roles,
              [roleId]: !p.roles[roleId],
            },
          };
        }
        return p;
      }),
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    alert("Đã lưu cấu hình phân quyền mới xuống hệ thống thành công!");
    setHasChanges(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] transition-all cursor-pointer ${
              hasChanges
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Save size={18} /> Lưu cập nhật
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-[30%]">
                  Module Hệ thống / Tính năng
                </th>
                {ROLES.map((role) => (
                  <th key={role.id} className="px-6 py-5 text-center">
                    <div
                      className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest ${role.badgeBg} ${role.badgeText}`}
                    >
                      {role.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {permissions.map((perm) => (
                <tr
                  key={perm.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 text-[15px]">
                      {perm.module}
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium mt-1 flex items-start gap-1.5">
                      <Info
                        size={14}
                        className="mt-0.5 flex-shrink-0 text-blue-400"
                      />
                      <span className="leading-relaxed">
                        {perm.description}
                      </span>
                    </div>
                  </td>
                  {ROLES.map((role) => {
                    const isGranted =
                      perm.roles[role.id as keyof Permission["roles"]];
                    const isAdmin = role.id === "Admin";
                    return (
                      <td key={role.id} className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            togglePermission(
                              perm.id,
                              role.id as keyof Permission["roles"],
                            )
                          }
                          disabled={isAdmin}
                          className={`w-12 h-12 rounded-2xl inline-flex items-center justify-center transition-all ${
                            isAdmin
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:scale-110"
                          } ${
                            isGranted
                              ? `${role.activeBg} ${role.activeText} shadow-sm border border-transparent`
                              : "bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400 border border-slate-100"
                          }`}
                          title={
                            isAdmin
                              ? "Quyền Admin là bắt buộc"
                              : "Thay đổi quyền truy cập"
                          }
                        >
                          {isGranted ? (
                            <CheckCircle2 size={24} />
                          ) : (
                            <Circle size={24} />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
