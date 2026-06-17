"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { toast, confirm } from "@/lib/utils/notification";
import { resolveImageUrl } from "@/lib/utils/imageUrl";
import RouteMap from "./RouteMap";
import {
  Truck,
  Map,
  PackageCheck,
  AlertTriangle,
  Search,
  Eye,
  MapPin,
  ArrowLeft,
  Calendar,
  FileText,
  Phone,
  PhoneCall,
  Share2,
  Upload,
  CheckCircle2,
  Circle,
  Clock,
  Package,
  MoreHorizontal,
  User,
  Navigation,
  Building,
  XCircle,
} from "lucide-react";

interface TrackingLog {
  ThoiGian: string;
  NoiDung: string;
  Status: "COMPLETE" | "PROCESSING" | "PENDING";
  Icon?: string;
}

interface VanChuyen {
  _id: string;
  MaVanChuyen: string;
  DonHang: {
    _id: string;
    MaDonHang: string;
    DiaChiGiaoHang: string;
    GhiChu: string;
    TenNguoiNhan?: string;
    SDTNguoiNhan?: string;
    KhachHang: {
      MaKH: string;
      TenKhachHang: string;
      SDT?: string;
    };
  } | null;
  LoHang: {
    SoKien: number;
    KhoiLuong: number;
    MauSon: string;
    BienBanFile?: string;
  };
  VanChuyenInfo: {
    DonVi: string;
    NhanVien: {
      _id: string;
      HoTen: string;
      SDT: string;
    } | null;
    SDT: string;
    PhiVC: number;
  };
  LoTrinh: TrackingLog[];
  TrangThaiTongQuat: string;
  DuKienBanGiao?: string;
  HinhAnhGiaoHang?: string[];
  createdAt: string;
}

const LocationInput = ({
  value,
  onChange,
  placeholder,
  icon: Icon,
  iconColor,
  ringColor,
  onEnter,
}: any) => {
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length >= 3 && isOpen) {
        try {
          const res = await fetch(
            `/api/geocode?q=${encodeURIComponent(value)}&limit=5`,
          );
          const data = await res.json();
          const parsedSuggestions = data.map((f: any) => {
            // Remove 'Việt Nam' at the end to make it cleaner like local Google Maps usage
            return f.display_name.replace(/, Việt Nam$/, "");
          });
          setSuggestions(parsedSuggestions);
        } catch (e) {
          console.error("Geocoding error:", e);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [value, isOpen]);

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Icon size={14} className={iconColor || "text-slate-400"} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            onEnter();
            setIsOpen(false);
          }
        }}
        className={`w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 ${ringColor || "focus:ring-blue-500"} focus:border-transparent transition-all shadow-sm`}
        placeholder={placeholder}
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-[2000] w-full mt-1 bg-white border border-slate-200 rounded-md shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b last:border-0 border-slate-50 text-left"
              onClick={() => {
                onChange(s);
                setIsOpen(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function VanChuyenPage() {
  const { user } = useAuthStore();
  const isCustomer =
    user?.role === "KhachHangB2B" || user?.role === "KhachHangB2C";

  const [data, setData] = useState<VanChuyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTracking, setSelectedTracking] = useState<VanChuyen | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"LIST" | "DETAIL">("LIST");
  const [mapOrigin, setMapOrigin] = useState(
    "Số 215 Lạch Tray, Gia Viên, Hải Phòng",
  );
  const [mapDestination, setMapDestination] = useState("");
  const [newWaypoint, setNewWaypoint] = useState("");
  const [waypointAction, setWaypointAction] = useState(
    "Đã đi đến trung tâm phân loại",
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (selectedTracking) {
      let dest = selectedTracking.DonHang?.DiaChiGiaoHang;
      if (!dest || dest === "Địa chỉ mặc định") {
        dest = (selectedTracking.DonHang?.KhachHang as any)?.DiaChi || "";
      }
      setMapDestination(dest || "");
    }
  }, [selectedTracking]);

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/shipping");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleShareLocation = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép liên kết theo dõi vào bộ nhớ tạm!");
  };

  const handleCallDriver = () => {
    const sdt =
      selectedTracking?.VanChuyenInfo?.NhanVien?.SDT ||
      selectedTracking?.VanChuyenInfo?.SDT;
    if (sdt) {
      window.location.href = `tel:${sdt}`;
    } else {
      toast.warning("Không tìm thấy số điện thoại tài xế");
    }
  };

  const handleUpdateGeneralStatus = async (newStatus: string) => {
    if (!selectedTracking) return;
    if (
      !(await confirm(
        `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng thành "${newStatus}"?`,
      ))
    )
      return;

    let icon = "Truck";
    let statusLog = "PROCESSING";
    if (newStatus === "Giao hàng thành công") {
      icon = "CheckCircle";
      statusLog = "COMPLETE";
    }

    const updatePayload = {
      TrangThaiTongQuat: newStatus,
      LoTrinh: [
        ...selectedTracking.LoTrinh,
        {
          ThoiGian: new Date().toISOString(),
          NoiDung: `Trạng thái đơn hàng: ${newStatus}`,
          Status: statusLog,
          Icon: icon,
        },
      ],
    };

    try {
      const res = await api.patch(
        `/shipping/${selectedTracking._id}`,
        updatePayload,
      );

      if (res.data.success) {
        toast.success("Đã cập nhật trạng thái thành công!");
        const updated = { ...selectedTracking, ...updatePayload } as VanChuyen;
        setSelectedTracking(updated);
        setData((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t)),
        );
      } else {
        throw new Error("Cập nhật thất bại từ server");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error(
        "Đã xảy ra lỗi khi kết nối với server. Vui lòng thử lại sau.",
      );
    }
  };

  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị vị trí.");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.display_name) {
            setNewWaypoint(data.display_name);
            alert(
              "Đã lấy vị trí thành công! Bạn có thể nhấn Thêm trạm để cập nhật.",
            );
          } else {
            alert("Không thể xác định địa chỉ từ tọa độ này.");
          }
        } catch (error) {
          console.error("Lỗi khi lấy vị trí:", error);
          alert("Lỗi khi lấy địa chỉ từ tọa độ GPS.");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation Error:", error);
        alert(
          "Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.",
        );
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleAddWaypoint = async () => {
    if (!newWaypoint || !selectedTracking) return;

    if (
      !(await confirm(
        `Bạn có chắc chắn muốn thêm trạm trung chuyển/phân loại "${newWaypoint}" vào lộ trình?`,
      ))
    )
      return;

    const waypointName = newWaypoint;
    const newLog: TrackingLog = {
      ThoiGian: new Date().toISOString(),
      NoiDung: `${waypointAction}: ${waypointName}`,
      Status: "PROCESSING",
      Icon: "MapPin",
    };

    const updatePayload = {
      LoTrinh: [...selectedTracking.LoTrinh, newLog],
    };

    try {
      const res = await api.patch(
        `/shipping/${selectedTracking._id}`,
        updatePayload,
      );

      if (res.data.success) {
        setNewWaypoint("");

        // Cập nhật UI Tracking
        const updated = { ...selectedTracking, ...updatePayload } as VanChuyen;
        setSelectedTracking(updated);
        setData((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t)),
        );
        toast.success("Đã thêm trạm và cập nhật lịch sử lộ trình thành công!");
      } else {
        throw new Error("Cập nhật thất bại từ server");
      }
    } catch (error) {
      console.error("Lỗi khi thêm trạm trung chuyển:", error);
      toast.error(
        "Đã xảy ra lỗi khi kết nối với server. Vui lòng thử lại sau.",
      );
    }
  };

  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const receiptInputRef = React.useRef<HTMLInputElement>(null);

  const getReceiverPhone = (ghiChu: string) => {
    if (!ghiChu) return "N/A";
    const match = ghiChu.match(/SĐT nhận:\s*([\d.\s]+)/);
    return match ? match[1].trim() : "N/A";
  };

  const validData = data.filter(d => d.TrangThaiTongQuat === "Đang giao hàng" || d.TrangThaiTongQuat === "Giao hàng thành công");

  const STATS = {
    total: validData.length,
    delivering: validData.filter((d) => d.TrangThaiTongQuat === "Đang giao hàng").length,
    delivered: validData.filter((d) => d.TrangThaiTongQuat === "Giao hàng thành công").length,
    issues: 0,
  };

  const filteredData = validData.filter((item) => {
    const tenKH = item?.DonHang?.KhachHang?.TenKhachHang || "";
    const maVC = item?.MaVanChuyen || "";
    const maDH = item?.DonHang?.MaDonHang || "";

    const matchSearch =
      tenKH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maVC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maDH.toLowerCase().includes(searchTerm.toLowerCase());

    const matchFilter =
      filter === "all" ||
      (filter === "delivering" && item.TrangThaiTongQuat === "Đang giao hàng") ||
      (filter === "delivered" && item.TrangThaiTongQuat === "Giao hàng thành công");

    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-md border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <p className="text-[13px] font-semibold text-blue-600 uppercase tracking-widest">
            Đang tải dữ liệu vận chuyển...
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "DETAIL" && selectedTracking) {
    const isDelivered =
      selectedTracking.TrangThaiTongQuat === "Giao hàng thành công";
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode("LIST")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight uppercase">
              Theo dõi vận chuyển #
              {selectedTracking.DonHang?.MaDonHang || "N/A"}
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              {selectedTracking.MaVanChuyen}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <>
          <div
            className={`bg-white rounded-lg border-l-4 border border-slate-100 shadow-sm p-6 flex items-center justify-between ${isDelivered ? "border-l-emerald-500" : "border-l-blue-500"}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDelivered ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
              >
                {isDelivered ? <CheckCircle2 size={24} /> : <Truck size={24} />}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  Trạng thái tổng quát
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold uppercase tracking-wider ${isDelivered ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                >
                  {isDelivered ? "✅" : "🚚"}{" "}
                  {selectedTracking.TrangThaiTongQuat}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-slate-400 font-medium">
              {isDelivered
                ? `Hoàn tất: ${new Date().toLocaleDateString()}`
                : `Dự kiến: ${selectedTracking.DuKienBanGiao ? new Date(selectedTracking.DuKienBanGiao).toLocaleDateString() : "N/A"}`}
            </div>
          </div>

          {/* Route Map Card - with real embedded map */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-rose-500" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Bản đồ lộ trình giao hàng
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(mapOrigin)}&destination=${encodeURIComponent(mapDestination)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                <Navigation size={12} /> Mở Google Maps
              </a>
            </div>

            {/* Map Controls */}
            {!isCustomer && (
              <div className="p-4 border-b border-slate-50 flex flex-col gap-4 bg-slate-50/30 relative z-[1000]">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Điểm xuất phát (Xưởng)
                    </label>
                    <LocationInput
                      value={mapOrigin}
                      onChange={setMapOrigin}
                      placeholder="Nhập địa chỉ kho/xưởng..."
                      icon={Building}
                      iconColor="text-blue-500"
                      ringColor="focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Điểm đến (Khách hàng)
                    </label>
                    <LocationInput
                      value={mapDestination}
                      onChange={setMapDestination}
                      placeholder="Nhập địa chỉ nhận hàng..."
                      icon={MapPin}
                      iconColor="text-rose-500"
                      ringColor="focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Waypoint Update Section */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-slate-200">
                  <div className="w-full sm:w-1/3 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Hoạt động tại trạm
                    </label>
                    <select
                      value={waypointAction}
                      onChange={(e) => setWaypointAction(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm h-[38px]"
                    >
                      <option value="Đã đi đến trung tâm phân loại">
                        Đã đi đến trung tâm phân loại
                      </option>
                      <option value="Đã xuất khỏi trung tâm phân loại">
                        Đã xuất khỏi trung tâm phân loại
                      </option>
                      <option value="Đã đi đến trạm">Đã đi đến trạm</option>
                      <option value="Đã xuất khỏi trạm">
                        Đã xuất khỏi trạm
                      </option>
                      <option value="Đã đến thành phố">Đã đến thành phố</option>
                      <option value="Đang trung chuyển tại">
                        Đang trung chuyển tại
                      </option>
                    </select>
                  </div>
                  <div className="w-full sm:w-2/3 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Địa điểm / Trạm / Thành phố
                    </label>
                    <div className="flex gap-2">
                      <LocationInput
                        value={newWaypoint}
                        onChange={setNewWaypoint}
                        placeholder="Tìm kiếm phường, đường, quận huyện, thành phố..."
                        icon={MapPin}
                        iconColor="text-blue-500"
                        ringColor="focus:ring-blue-500"
                        onEnter={handleAddWaypoint}
                      />
                      <button
                        onClick={handleGetMyLocation}
                        disabled={isGettingLocation}
                        className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap h-[38px] flex items-center gap-1"
                        title="Sử dụng vị trí hiện tại của tôi (GPS)"
                      >
                        <Navigation
                          size={16}
                          className={isGettingLocation ? "animate-pulse" : ""}
                        />{" "}
                        {isGettingLocation ? "Đang lấy..." : "Vị trí của tôi"}
                      </button>
                      <button
                        onClick={handleAddWaypoint}
                        disabled={!newWaypoint}
                        className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap h-[38px] flex items-center gap-1"
                      >
                        <MapPin size={16} /> Thêm trạm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Embedded Map */}
            <div className="relative w-full" style={{ height: 500 }}>
              <RouteMap
                origin={mapOrigin}
                destination={mapDestination}
                currentLocation={
                  selectedTracking.LoTrinh?.filter(
                    (log) => log.Icon === "MapPin",
                  )
                    .slice(-1)[0]
                    ?.NoiDung.split(": ")[1]
                }
                waypoints={selectedTracking.LoTrinh?.filter(
                  (log) => log.Icon === "MapPin",
                )
                  .map((log) => log.NoiDung.split(": ")[1])
                  .slice(0, -1)}
                isDelivered={isDelivered}
                onMapClick={setNewWaypoint}
              />
              {/* Overlay badge */}
              <div
                className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg z-[400] pointer-events-none ${isDelivered ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}`}
              >
                {isDelivered ? <CheckCircle2 size={13} /> : <Truck size={13} />}
                {isDelivered ? "Đã giao thành công" : "Đang trên đường giao"}
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="px-8 py-6 bg-slate-50/50">
              <div className="relative">
                {/* Track background */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 rounded-md"></div>
                {/* Active track */}
                <div
                  className="absolute top-5 left-6 h-1 rounded-md transition-all duration-1000"
                  style={{
                    width: isDelivered
                      ? "calc(100% - 3rem)"
                      : "calc(50% - 1.5rem)",
                    background: isDelivered ? "#059669" : "#2563eb",
                    boxShadow: `0 0 8px ${isDelivered ? "#05966980" : "#2563eb80"}`,
                  }}
                ></div>

                {/* Waypoints */}
                <div className="relative flex justify-between">
                  {/* Origin */}
                  <div className="flex flex-col items-center gap-2 w-20">
                    <div className="w-10 h-10 rounded-lg bg-white border-2 border-blue-500 flex items-center justify-center shadow-sm z-10">
                      <Building size={18} className="text-blue-600" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight">
                      Xưởng Sơn
                    </span>
                  </div>

                  {/* Truck position */}
                  <div
                    className="absolute -top-7 flex flex-col items-center transition-all duration-1000"
                    style={{
                      left: isDelivered
                        ? "calc(100% - 5rem)"
                        : "calc(50% - 2rem)",
                    }}
                  >
                    <span
                      className={`text-[10px] font-semibold text-white px-2 py-0.5 rounded-lg mb-1.5 whitespace-nowrap ${isDelivered ? "bg-emerald-600" : "bg-blue-600"}`}
                    >
                      {isDelivered ? "Đã bàn giao" : "Đang di chuyển"}
                    </span>
                    <Truck
                      size={26}
                      style={{
                        color: isDelivered ? "#059669" : "#2563eb",
                        filter: `drop-shadow(0 0 6px ${isDelivered ? "#059669" : "#2563eb"})`,
                      }}
                    />
                  </div>

                  {/* Destination */}
                  <div className="flex flex-col items-center gap-2 w-20">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 shadow-sm z-10 transition-all duration-500 ${isDelivered ? "bg-emerald-50 border-emerald-500" : "bg-white border-slate-200"}`}
                    >
                      {isDelivered ? (
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      ) : (
                        <User size={18} className="text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold text-center leading-tight ${isDelivered ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      {selectedTracking.DonHang?.KhachHang?.TenKhachHang ||
                        "Khách hàng"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address row */}
              <div className="mt-8 flex items-start gap-2 text-xs text-slate-500">
                <MapPin size={13} className="text-rose-400 mt-0.5 shrink-0" />
                <span className="font-medium">
                  {selectedTracking.DonHang?.DiaChiGiaoHang ||
                    "Chưa cập nhật địa chỉ giao hàng"}
                </span>
              </div>
            </div>
          </div>
        </>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cargo Details */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-6">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">
              Chi tiết lô hàng
            </h4>
            <div className="space-y-4 text-sm">
              {[
                {
                  label: "Số kiện",
                  value: `${selectedTracking.LoHang?.SoKien || 0} kiện (Đã đóng gói)`,
                },
                {
                  label: "Khối lượng",
                  value: `${selectedTracking.LoHang?.KhoiLuong || 0} thùng`,
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-slate-400 font-medium">{r.label}</span>
                  <span className="font-bold text-slate-900">{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Màu sơn</span>
                <span className="font-bold text-blue-600">
                  {selectedTracking.LoHang?.MauSon || "N/A"} (Kiểm tra OK)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">
                  Biên bản bàn giao
                </span>
                <div className="flex items-center gap-2">
                  {selectedTracking.LoHang.BienBanFile ||
                  (selectedTracking as any).BienBanFile ? (
                    <a
                      href={resolveImageUrl(
                        selectedTracking.LoHang.BienBanFile ||
                          (selectedTracking as any).BienBanFile,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
                    >
                      <FileText size={14} /> Xem File
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Chưa cập nhật
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transport Info */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-6">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">
              Thông tin vận chuyển
            </h4>
            <div className="space-y-4 text-sm">
              {[
                {
                  label: "Đơn vị",
                  value: selectedTracking.VanChuyenInfo?.DonVi || "N/A",
                },
                {
                  label: "Tài xế",
                  value:
                    selectedTracking.VanChuyenInfo?.NhanVien?.HoTen ||
                    "Chưa phân công",
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-slate-400 font-medium">{r.label}</span>
                  <span className="font-bold text-slate-900">{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">SĐT tài xế</span>
                <span className="font-bold text-amber-600">
                  {selectedTracking.VanChuyenInfo?.NhanVien?.SDT ||
                    selectedTracking.VanChuyenInfo?.SDT ||
                    "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">
                  Phí vận chuyển
                </span>
                <span className="font-semibold text-emerald-600">
                  {selectedTracking.VanChuyenInfo?.PhiVC?.toLocaleString() ||
                    "0"}
                  đ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Receiver Info */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-6">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">
            Chi tiết phiếu giao — Thông tin người nhận
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Người nhận hàng
              </p>
              <p className="font-semibold text-slate-900 text-base">
                {selectedTracking.DonHang?.TenNguoiNhan ||
                  selectedTracking.DonHang?.KhachHang?.TenKhachHang ||
                  "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Số điện thoại
              </p>
              <p className="font-semibold text-amber-600 text-base">
                {selectedTracking.DonHang?.SDTNguoiNhan ||
                  selectedTracking.DonHang?.KhachHang?.SDT ||
                  getReceiverPhone(selectedTracking.DonHang?.GhiChu || "")}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Địa chỉ bàn giao
              </p>
              <p className="font-bold text-slate-700">
                {selectedTracking.DonHang?.DiaChiGiaoHang || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-8">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Lịch sử lộ trình
          </h4>
          <div className="relative space-y-8">
            <div className="absolute left-[88px] top-1 bottom-1 w-px bg-slate-100"></div>
            {selectedTracking.LoTrinh.map((log, idx) => {
              const isComplete = log.Status === "COMPLETE";
              const isProcessing = log.Status === "PROCESSING";
              return (
                <div key={idx} className="flex items-start gap-8 relative">
                  <div
                    className={`w-[72px] text-right shrink-0 pt-0.5 ${isComplete ? "text-slate-900" : "text-slate-300"}`}
                  >
                    <div className="text-sm font-bold">
                      {log.ThoiGian
                        ? new Date(log.ThoiGian).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {log.ThoiGian
                        ? new Date(log.ThoiGian).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : ""}
                    </div>
                  </div>
                  <div className="relative z-10 bg-white pt-0.5">
                    {isComplete ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : isProcessing ? (
                      <div className="w-[18px] h-[18px] rounded-md bg-blue-600 border-4 border-blue-100"></div>
                    ) : (
                      <Circle size={18} className="text-slate-200" />
                    )}
                  </div>
                  <p
                    className={`text-sm pt-0.5 ${isComplete || isProcessing ? "font-semibold text-slate-900" : "text-slate-300"}`}
                  >
                    {log.NoiDung}
                  </p>
                </div>
              );
            })}
          </div>

          {selectedTracking.HinhAnhGiaoHang &&
            selectedTracking.HinhAnhGiaoHang.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-50">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  📸 Hình ảnh minh chứng giao hàng
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedTracking.HinhAnhGiaoHang.map((url, i) => (
                    <div
                      key={i}
                      onClick={() =>
                        window.open(resolveImageUrl(url), "_blank")
                      }
                      className="rounded-md overflow-hidden h-36 bg-slate-50 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <img
                        src={resolveImageUrl(url)}
                        alt={`Evidence ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap gap-3 justify-center pt-2 border-t border-slate-100 items-center">
          <button
            onClick={handleCallDriver}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm border-2 border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
          >
            <PhoneCall size={18} /> Gọi Tài Xế
          </button>
          <button
            onClick={handleShareLocation}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm border-2 border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer"
          >
            <Share2 size={18} /> Chia Sẻ Vị Trí
          </button>

          {!isCustomer && !isDelivered && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
              <button
                onClick={() =>
                  handleUpdateGeneralStatus("Giao hàng thành công")
                }
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} /> Xác nhận giao hàng thành công
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-md blur-3xl -mr-16 -mt-16 bg-blue-500/10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tổng Chuyến Hàng
              </p>
              <h3 className="text-3xl font-semibold text-slate-900">
                {STATS.total}{" "}
                <span className="text-xs font-bold text-slate-400">chuyến</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <Map size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-md blur-3xl -mr-16 -mt-16 bg-violet-500/10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Đang Vận Chuyển
              </p>
              <h3 className="text-3xl font-semibold text-violet-600">
                {STATS.delivering}{" "}
                <span className="text-xs font-bold text-violet-400">
                  chuyến
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <Truck size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-md blur-3xl -mr-16 -mt-16 bg-emerald-500/10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Giao Thành Công
              </p>
              <h3 className="text-3xl font-semibold text-emerald-600">
                {STATS.delivered}{" "}
                <span className="text-xs font-bold text-emerald-400">
                  chuyến
                </span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <PackageCheck size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-md blur-3xl -mr-16 -mt-16 bg-amber-500/10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Cảnh Báo Sự Cố
              </p>
              <h3 className="text-3xl font-semibold text-amber-600">
                {STATS.issues}{" "}
                <span className="text-xs font-bold text-amber-400">sự cố</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96 group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="text"
              className="w-full bg-slate-50 border-none rounded-lg px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
              placeholder="Tra cứu mã vận chuyển, đơn hàng, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-lg overflow-x-auto max-w-full">
            {[
              { id: "all", label: "Tất cả" },
              { id: "delivering", label: "Đang giao hàng" },
              { id: "delivered", label: "Giao thành công" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-md text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  filter === f.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Mã Vận Chuyển
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Bill Đơn Hàng
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Khách Hàng
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Hàng Hóa
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Tài Xế
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Trạng Thái
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Ngày Tạo
                </th>
                <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-20 text-slate-400 font-medium italic"
                  >
                    Không tìm thấy dữ liệu vận chuyển.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isDelivered =
                    item.TrangThaiTongQuat === "Giao hàng thành công";
                  const isDelivering =
                    item.TrangThaiTongQuat === "Đang giao hàng";
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-600">
                          {item.MaVanChuyen}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-[14px]">
                        {item.DonHang?.MaDonHang || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-[14px]">
                          {item.DonHang?.KhachHang?.TenKhachHang || "N/A"}
                        </div>
                        <div className="text-[12px] text-slate-400 mt-0.5">
                          {item.DonHang?.KhachHang?.MaKH || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-[14px] font-medium">
                        {item.LoHang?.SoKien || 0} kiện —{" "}
                        {item.LoHang?.KhoiLuong || 0}thùng
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-[14px] ${item.VanChuyenInfo?.NhanVien ? "text-amber-600" : "text-slate-400 italic"}`}
                        >
                          {item.VanChuyenInfo?.NhanVien?.HoTen ||
                            "Chưa phân công"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                            isDelivered
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : isDelivering
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {item.TrangThaiTongQuat}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTracking(item);
                            setViewMode("DETAIL");
                          }}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 hover:border-blue-100 transition-all cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
