"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Download,
  Printer,
  Trash2,
  Plus,
  Phone,
  Banknote,
  Building,
  FileText,
  ArrowLeft,
  Layers,
  Thermometer,
  Ruler,
  FileCheck,
  ClipboardList,
  Calculator,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Clock,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "@/lib/utils/axiosAuth";
import { paintColors, trackingData } from "@/lib/data/colors-data";
import { QRCodeSVG } from "qrcode.react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/lib/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

// ==================== HÀM HỖ TRỢ ====================
const numberToVietnameseWords = (num: number): string => {
  if (num === 0) return "Không đồng chẵn";

  const units = ["", "nghìn", "triệu", "tỷ"];
  const digits = [
    "không",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];

  const readThreeDigits = (n: number, isFirst: boolean): string => {
    let temp = n;
    const hundred = Math.floor(temp / 100);
    temp %= 100;
    const ten = Math.floor(temp / 10);
    const unit = temp % 10;

    let res = "";

    if (hundred > 0 || !isFirst) {
      res += digits[hundred] + " trăm ";
    }

    if (ten > 0) {
      if (ten === 1) {
        res += "mười ";
      } else {
        res += digits[ten] + " mươi ";
      }
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ ";
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) {
        res += "mốt";
      } else if (unit === 5 && ten > 0) {
        res += "lăm";
      } else if (unit === 5 && ten === 0) {
        res += "năm";
      } else {
        res += digits[unit];
      }
    }

    return res.trim();
  };

  let result = "";
  let tempNum = num;
  const groups: number[] = [];

  while (tempNum > 0) {
    groups.push(tempNum % 1000);
    tempNum = Math.floor(tempNum / 1000);
  }

  for (let idx = groups.length - 1; idx >= 0; idx--) {
    const groupVal = groups[idx];
    if (groupVal > 0) {
      const isFirst = idx === groups.length - 1;
      const groupText = readThreeDigits(groupVal, isFirst);

      let unitName = "";
      if (idx === 1) unitName = "nghìn";
      else if (idx === 2) unitName = "triệu";
      else if (idx >= 3) {
        const billionGroup = idx % 3;
        const billionPower = Math.floor(idx / 3);
        let suffix = "tỷ".repeat(billionPower);
        if (billionGroup === 1) unitName = "nghìn " + suffix;
        else if (billionGroup === 2) unitName = "triệu " + suffix;
        else unitName = suffix;
      }

      result += groupText + " " + unitName + " ";
    }
  }

  result = result.trim().replace(/\s+/g, " ");
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result + " đồng chẵn";
};
const API_DON_HANG = "/orders";

const PAYMENT_METHODS = [
  { key: "TIEN_MAT", label: "Tiền mặt", icon: Banknote },
  { key: "CHUYEN_KHOAN", label: "Chuyển khoản", icon: CreditCard },
  { key: "GHI_NO", label: "Ghi nợ", icon: FileText },
];

interface OrderItem {
  SanPham: any;
  TenSanPham: string;
  MaMau: string;
  SoLuong: number;
  DonGia: number;
  ThanhTien: number;
}

interface Order {
  _id: string;
  MaDonHang: string;
  KhachHang: {
    _id: string;
    MaKH: string;
    TenKhachHang: string;
    SDT: string;
    DiaChi: string;
    PhanLoai?: string;
  };
  Items: OrderItem[];
  TongTien: number;
  TienThue?: number;
  TrangThai:
  | "CHO_XAC_NHAN"
  | "DANG_XU_LY"
  | "DA_XU_LY_XONG"
  | "DANG_GIAO"
  | "DA_GIAO"
  | "DA_HUY";
  PhuongThucThanhToan: string;
  TrangThaiThanhToan: string;
  DiaChiGiaoHang: string;
  HanXacNhan: string;
  createdAt: string;
  GhiChu?: string;
  // New fields
  TongDienTichSon?: number;
  PhuPhi?: number;
  DaCoc?: number;
  TechnicalSpecs?: {
    LoaiBot: string;
    NhietDoSay: string;
    DoDayLopPhu: string;
  };
  KhuyenMai?: KhuyenMai;
  GiamGia?: number;
  NhanVienPhuTrach?: {
    _id: string;
    MaNV: string;
    HoTen: string;
  };
  SDTNguoiNhan?: string;
}

interface KhuyenMai {
  _id: string;
  MaVoucher: string;
  LoaiGiamGia: "PHAN_TRAM" | "GIAM_THANG" | "TANG_KEM";
  MucGiam: number;
  GiamToiDa: number;
  DonHangToiThieu: number;
  TrangThai: string;
}

interface KhachHang {
  _id: string;
  MaKH: string;
  TenKhachHang: string;
  SDT: string;
  DiaChi: string;
  PhanLoai?: string;
}

interface Driver {
  _id: string;
  HoTen: string;
  SDT: string;
  BoPhan: string;
}

interface MaMauSon {
  _id: string;
  MaMau: string;
  TenMau: string;
  HexCode?: string;
  TrangThai: boolean;
}

interface SanPham {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  DonGiaCoSo: number;
  TongTonKho: number;
  TonKho?: number;
  HinhAnh?: string;
  DanhSachMaMau?: MaMauSon[];
}

interface NewOrderItem {
  sanPhamId: string;
  tenSanPham: string;
  soLuong: number;
  donGia: number;
  tonKho: number;
  maMau: string;
  tenMau: string;
  hexCode: string;
}

export default function OrderManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdminOrEmployee = user?.role === "Admin" || user?.role === "NhanVien";

  useEffect(() => {
    if (
      user &&
      (user.role === "KhachHangB2B" || user.role === "KhachHangB2C")
    ) {
      router.push("/my-orders");
    }
  }, [user, router]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [rdTrackingLogs, setRdTrackingLogs] = useState<any[]>([]);
  const [shippingData, setShippingData] = useState<any[]>([]);

  // Create Order Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customers, setCustomers] = useState<KhachHang[]>([]);
  const [allProducts, setAllProducts] = useState<SanPham[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [orderItems, setOrderItems] = useState<NewOrderItem[]>([]);
  const [diaChiGiaoHang, setDiaChiGiaoHang] = useState("");
  const [sdtNguoiNhan, setSdtNguoiNhan] = useState("");
  const [phuongThucTT, setPhuongThucTT] = useState("TIEN_MAT");
  const [ghiChu, setGhiChu] = useState("");

  // New Technical & Financial states for creation
  const [tongDienTichSon, setTongDienTichSon] = useState(1);
  const [phuPhi, setPhuPhi] = useState(0);
  const [daCoc, setDaCoc] = useState(0);
  const [loaiBot, setLoaiBot] = useState("AkzoNobel Interpon");
  const [nhietDoSay, setNhietDoSay] = useState("195°C / 15 phút");
  const [doDayLopPhu, setDoDayLopPhu] = useState("75 µm");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedColorCode, setSelectedColorCode] = useState("");
  const [colorSearchTerm, setColorSearchTerm] = useState("");
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState("");
  const [allStaff, setAllStaff] = useState<any[]>([]);

  // Driver Selection states
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    id: string;
    status: string;
  } | null>(null);

  // Promotion states
  const [promotions, setPromotions] = useState<KhuyenMai[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState("");
  const [calculatedDiscount, setCalculatedDiscount] = useState(0);

  // Paint Calculator states
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcUnit, setCalcUnit] = useState<"m" | "ft">("m");
  const [calcWalls, setCalcWalls] = useState<any[]>([
    { id: Date.now(), length: "", height: "" },
  ]);
  const [calcDeductions, setCalcDeductions] = useState<any[]>([]);

  // Payment Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);

  // Refs for PDF printing
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    fetchDrivers();
    fetchPromotions();
    fetchStaff();
    fetchShippingData();
  }, []);

  const fetchShippingData = async () => {
    try {
      const res = await api.get("/shipping");
      if (res.data.success) {
        setShippingData(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu vận chuyển:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get("/staff");
      if (res.data.success) {
        setAllStaff(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân sự:", error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const res = await api.get("/promotions");
      if (res.data.success) {
        // Only active ones
        setPromotions(
          res.data.data.filter((p: any) => p.TrangThai === "DANG_DIEN_RA"),
        );
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khuyến mãi:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get("/staff");
      if (res.data.success) {
        // Filter for Logistics/Warehouse/Shipping departments & Delivery/Technical Staff
        const eligibleDrivers = res.data.data.filter(
          (nv: any) =>
            (nv.BoPhan === "Kho / Logistics" ||
              nv.BoPhan === "Kho" ||
              nv.BoPhan === "Logistic" ||
              nv.BoPhan === "Vận tải" ||
              nv.BoPhan === "Vận chuyển" ||
              nv.BoPhan === "Giao nhận") &&
            (nv.ChucVu === "Nhân viên giao hàng" ||
              nv.ChucVu === "Tài xế" ||
              nv.ChucVu === "Nhân viên kỹ thuật" ||
              nv.ChucVu === "Trưởng bộ phận kho / logistic" ||
              nv.BoPhan === "Vận tải" ||
              nv.BoPhan === "Vận chuyển" ||
              nv.BoPhan === "Giao nhận"),
        );
        setDrivers(eligibleDrivers);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tài xế:", error);
    }
  };

  // ==================== HÀM XUẤT PHIẾU CỌC WORD ====================
  // ==================== HÀM XUẤT PHIẾU CỌC WORD (ĐÃ SỬA) ====================
  const handleDownloadPhieuCoc = async () => {
    if (!selectedOrder) return;

    const orderId = selectedOrder.MaDonHang || "#N/A";
    const createdDate = new Date(selectedOrder.createdAt).toLocaleDateString(
      "vi-VN",
    );
    const customerName = selectedOrder.KhachHang?.TenKhachHang || "Khách lẻ";
    const phoneNumber = selectedOrder.KhachHang?.SDT || "Chưa cập nhật";

    const itemsContent =
      selectedOrder.Items && selectedOrder.Items.length > 0
        ? selectedOrder.Items.map(
          (item) => `"${item.TenSanPham} (${item.SoLuong} thùng)"`,
        ).join(", ")
        : '"Sản phẩm sơn"';
    const colorCodes =
      selectedOrder.Items && selectedOrder.Items.length > 0
        ? Array.from(
          new Set(selectedOrder.Items.map((item) => item.MaMau)),
        ).join(", ")
        : "N/A";

    const powderType =
      selectedOrder.TechnicalSpecs?.LoaiBot || "AkzoNobel Interpon";
    const totalAmount = selectedOrder.TongTien || 0;
    const depositAmount = selectedOrder.DaCoc || 0;
    const remainingAmount = totalAmount - depositAmount;
    const depositPercent =
      totalAmount > 0 ? Math.round((depositAmount / totalAmount) * 100) : 0;

    const fileName = `Phieu_Coc_${orderId.replace("#", "")}.docx`;

    const noBorder = {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    };

    const formatCurrency = (amount: number) =>
      amount.toLocaleString("vi-VN") + " đ";

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Times New Roman",
              size: 24,
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children: [
            // === HEADER ===
            new Table({
              width: { type: WidthType.PERCENTAGE, size: 100 },
              borders: noBorder,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { type: WidthType.PERCENTAGE, size: 50 },
                      borders: noBorder,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "CÔNG TY CP TMDV VOSCO",
                              bold: true,
                              font: "Times New Roman",
                              size: 24,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "(VTSC)",
                              bold: true,
                              font: "Times New Roman",
                              size: 24,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "Hệ thống PaintPro",
                              font: "Times New Roman",
                              size: 22,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { type: WidthType.PERCENTAGE, size: 50 },
                      borders: noBorder,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT",
                              bold: true,
                              font: "Times New Roman",
                              size: 24,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "NAM",
                              bold: true,
                              font: "Times New Roman",
                              size: 24,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "Độc lập - Tự do - Hạnh phúc",
                              bold: true,
                              underline: { type: "single" },
                              font: "Times New Roman",
                              size: 24,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({
              spacing: { before: 200, after: 200 },
              children: [new TextRun("")],
            }),

            // === TIÊU ĐỀ ===
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 80 },
              children: [
                new TextRun({
                  text: "PHIẾU BIÊN NHẬN ĐẶT CỌC",
                  bold: true,
                  font: "Times New Roman",
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: `Mã đơn hàng: #${orderId} - Ngày tạo: ${createdDate}`,
                  italics: true,
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),

            // === NỘI DUNG CHÍNH ===
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: "Họ tên khách hàng: ",
                  bold: true,
                  font: "Times New Roman",
                  size: 24,
                }),
                new TextRun({
                  text: customerName,
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: "Số điện thoại: ",
                  bold: true,
                  font: "Times New Roman",
                  size: 24,
                }),
                new TextRun({
                  text: phoneNumber,
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: "Nội dung đặt cọc: ",
                  bold: true,
                  font: "Times New Roman",
                  size: 24,
                }),
                new TextRun({
                  text: `Đặt cọc thi công/mua sơn tĩnh điện sản phẩm ${itemsContent}, Mã màu: ${colorCodes}, Loại bột: ${powderType}.`,
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),

            new Paragraph({
              spacing: { before: 120, after: 80 },
              children: [
                new TextRun({
                  text: "Tổng giá trị đơn hàng: ",
                  bold: true,
                  font: "Times New Roman",
                  size: 24,
                }),
                new TextRun({
                  text: formatCurrency(totalAmount),
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: `Số tiền đã đặt cọc (${depositPercent}%): `,
                  bold: true,
                  font: "Times New Roman",
                  size: 24,
                }),
                new TextRun({
                  text: formatCurrency(depositAmount),
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: "Viết bằng chữ: ",
                  bold: true,
                  font: "Times New Roman",
                  size: 24,
                }),
                new TextRun({
                  text: `(${numberToVietnameseWords(depositAmount)})`,
                  italics: true,
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: "Số tiền còn lại cần thanh toán: ",
                  bold: true,
                  font: "Times New Roman",
                  size: 24,
                }),
                new TextRun({
                  text: formatCurrency(remainingAmount),
                  bold: true,
                  color: "C00000",
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),

            // === CHỮ KÝ ===
            new Paragraph({
              spacing: { before: 300 },
              children: [new TextRun("")],
            }),
            new Table({
              width: { type: WidthType.PERCENTAGE, size: 100 },
              borders: noBorder,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { type: WidthType.PERCENTAGE, size: 50 },
                      borders: noBorder,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "NGƯỜI NỘP TIỀN",
                              bold: true,
                              font: "Times New Roman",
                              size: 24,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 60 },
                          children: [
                            new TextRun({
                              text: "(Ký, ghi rõ họ tên)",
                              italics: true,
                              font: "Times New Roman",
                              size: 22,
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { type: WidthType.PERCENTAGE, size: 50 },
                      borders: noBorder,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "ĐẠI DIỆN CÔNG TY",
                              bold: true,
                              font: "Times New Roman",
                              size: 24,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 60 },
                          children: [
                            new TextRun({
                              text: "(Ký, ghi rõ họ tên)",
                              italics: true,
                              font: "Times New Roman",
                              size: 22,
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                        new Paragraph({
                          children: [new TextRun({ text: " " })],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Lỗi tạo file Word:", error);
      alert("Có lỗi xảy ra khi tạo phiếu cọc!");
    }
  };

  // ==================== HÀM XUẤT HÓA ĐƠN GTGT WORD ====================
  const handleDownloadHoaDonGTGT = async () => {
    if (!selectedOrder) return;

    try {
      const orderId = selectedOrder.MaDonHang || "#N/A";
      const customerName = selectedOrder.KhachHang?.TenKhachHang || "Vãng lai";
      const customerPhone = selectedOrder.KhachHang?.SDT || "";
      const customerAddress =
        selectedOrder.KhachHang?.DiaChi || "Chưa cập nhật";
      const paymentMethod =
        selectedOrder.PhuongThucThanhToan === "TIEN_MAT"
          ? "Tiền mặt (TM)"
          : "Chuyển khoản (CK)";
      const orderDateStr = new Date(selectedOrder.createdAt).toLocaleDateString(
        "vi-VN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      );
      const [day, month, year] = orderDateStr.split("/");

      // Mock data for VAT calculation
      const vatAmount = selectedOrder.TienThue || 0;
      const totalGross = selectedOrder.TongTien || 0;
      const subTotalCalc = totalGross - vatAmount;
      const taxRate = vatAmount > 0 ? 8 : 0;

      const formatCurrency = (amount: number) =>
        amount.toLocaleString("vi-VN") + " đ";

      const noBorder = {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      };

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Times New Roman",
                size: 24, // 12pt
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1134, right: 1134, bottom: 1134, left: 1417 },
              },
            },
            children: [
              // 1. Khối thông tin Hóa đơn & Đơn vị bán hàng (Header)
              new Table({
                width: { type: WidthType.PERCENTAGE, size: 100 },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { type: WidthType.PERCENTAGE, size: 55 },
                        borders: noBorder,
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO (VTSC)",
                                bold: true,
                                size: 24,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Mã số thuế: 0100100456",
                                bold: true,
                                size: 24,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Địa chỉ: Số 215 Lạch Tray, Phường Gia Viên, Thành phố Hải Phòng",
                                size: 24,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Điện thoại: 02226.676767 - Số tài khoản: 110000123456 tại VietinBank",
                                size: 24,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { type: WidthType.PERCENTAGE, size: 45 },
                        borders: noBorder,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "HÓA ĐƠN GIÁ TRỊ GIA TĂNG",
                                bold: true,
                                size: 28,
                                color: "FF0000",
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "Mẫu số (Form): 1C26TAA",
                                size: 24,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "Ký hiệu (Serial): K26TBB",
                                size: 24,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: `Số (No.): ${orderId}`,
                                bold: true,
                                size: 24,
                                color: "FF0000",
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: `Ngày (Date): ${day} Tháng ${month} Năm ${year}`,
                                italics: true,
                                size: 24,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({
                spacing: { before: 240, after: 120 },
                children: [new TextRun("")],
              }),

              // 2. Khối thông tin Người mua hàng (Buyer Information)
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({ text: "Họ tên người mua hàng: " }),
                  new TextRun({ text: customerName, bold: true }),
                ],
              }),
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({
                    text: `Tên đơn vị (nếu có): ${selectedOrder.KhachHang?.PhanLoai === "DOANH_NGHIEP" ? selectedOrder.KhachHang?.TenKhachHang : "...................................................................."}`,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({
                    text: "Mã số thuế (nếu có): ....................................................................",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({ text: `Địa chỉ: ${customerAddress}` }),
                ],
              }),
              new Paragraph({
                spacing: { line: 280, after: 240 },
                children: [
                  new TextRun({
                    text: `Hình thức thanh toán: ${paymentMethod}`,
                  }),
                ],
              }),

              // 3. Bảng chi tiết hàng hóa, dịch vụ (Goods Table)
              new Table({
                width: { type: WidthType.PERCENTAGE, size: 100 },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "888888" },
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "888888",
                  },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "888888" },
                  right: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "888888",
                  },
                  insideHorizontal: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "888888",
                  },
                  insideVertical: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "888888",
                  },
                },
                rows: [
                  // Header Row
                  new TableRow({
                    children: [
                      "STT",
                      "Tên hàng hóa / dịch vụ",
                      "Đơn vị tính",
                      "Số lượng",
                      "Đơn giá",
                      "Thành tiền",
                    ].map(
                      (text) =>
                        new TableCell({
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text, bold: true })],
                            }),
                          ],
                        }),
                    ),
                  }),
                  // Data Rows
                  ...(selectedOrder.Items || []).map((item, index) => {
                    const itemRatio =
                      (item.DonGia * item.SoLuong) /
                      (subTotalCalc > 0 ? subTotalCalc : 1);
                    // If there's tax, the line item price without tax is its proportion of the total.
                    // Actually, item.DonGia is the base price. Since no discount is applied to line items here,
                    // we can just use item.DonGia (which doesn't include tax in DB).
                    const itemPrice = item.DonGia;
                    const itemTotal = itemPrice * item.SoLuong;
                    return new TableRow({
                      children: [
                        new TableCell({
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new TextRun({ text: (index + 1).toString() }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                          },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `${item.TenSanPham} (Mã màu: ${item.MaMau})`,
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new TextRun({
                                  text: item.SanPham?.DonViTinh || "Thùng",
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [
                                new TextRun({ text: item.SoLuong.toString() }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({
                                  text: formatCurrency(itemPrice),
                                }),
                              ],
                            }),
                          ],
                        }),
                        new TableCell({
                          margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                          },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({
                                  text: formatCurrency(itemTotal),
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    });
                  }),
                  // 4. Khối tính toán tài chính (Financial Summary Rows)
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 5,
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: "Cộng tiền hàng (Total Net Amount):",
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: formatCurrency(subTotalCalc),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 5,
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: `Thuế suất GTGT (VAT Rate): ${taxRate}%    Tiền thuế GTGT (VAT Amount):`,
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({ text: formatCurrency(vatAmount) }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 5,
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: "Tổng cộng tiền thanh toán (Total Gross Amount):",
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: formatCurrency(totalGross),
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 6,
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Số tiền viết bằng chữ (Amount in words): ${numberToVietnameseWords(totalGross)}`,
                                italics: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({
                spacing: { before: 240, after: 120 },
                children: [new TextRun("")],
              }),

              // 5. Khối Ký tên (Signatures)
              new Table({
                width: { type: WidthType.PERCENTAGE, size: 100 },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { type: WidthType.PERCENTAGE, size: 50 },
                        borders: noBorder,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "NGƯỜI MUA HÀNG",
                                bold: true,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "(Ký, ghi rõ họ tên)",
                                italics: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { type: WidthType.PERCENTAGE, size: 50 },
                        borders: noBorder,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: "NGƯỜI BÁN HÀNG",
                                bold: true,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 120 },
                            children: [
                              new TextRun({
                                text: "(Ký điện tử bởi: CÔNG TY CP TMDV VOSCO - VTSC)",
                                italics: true,
                                size: 20,
                              }),
                            ],
                          }),
                          new Table({
                            width: { type: WidthType.PERCENTAGE, size: 80 },
                            alignment: AlignmentType.CENTER,
                            borders: {
                              top: {
                                style: BorderStyle.SINGLE,
                                size: 2,
                                color: "059669",
                              },
                              bottom: {
                                style: BorderStyle.SINGLE,
                                size: 2,
                                color: "059669",
                              },
                              left: {
                                style: BorderStyle.SINGLE,
                                size: 2,
                                color: "059669",
                              },
                              right: {
                                style: BorderStyle.SINGLE,
                                size: 2,
                                color: "059669",
                              },
                            },
                            rows: [
                              new TableRow({
                                children: [
                                  new TableCell({
                                    margins: {
                                      top: 100,
                                      bottom: 100,
                                      left: 100,
                                      right: 100,
                                    },
                                    children: [
                                      new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                          new TextRun({
                                            text: "✓ Ký bởi: CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO",
                                            bold: true,
                                            color: "059669",
                                            size: 20,
                                          }),
                                        ],
                                      }),
                                      new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                          new TextRun({
                                            text: `Ngày ký: ${orderDateStr}`,
                                            color: "059669",
                                            size: 20,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Hoa_Don_GTGT_VTSC_${orderId.replace("#", "")}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Lỗi tạo hóa đơn GTGT:", error);
      alert("Có lỗi xảy ra khi tạo hóa đơn GTGT!");
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-refresh real-time every 5 seconds
    const intervalId = setInterval(() => {
      fetchOrders(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activeTab]);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get(`${API_DON_HANG}?status=${activeTab}`);
      if (res.data.success) {
        const sortedData = res.data.data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setOrders(sortedData);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/khach-hang");
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/san-pham-son");
      if (res.data.success) setAllProducts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    fetchCustomers();
    fetchProducts();
    setSelectedCustomerId("");
    setOrderItems([]);
    setDiaChiGiaoHang("");
    setSdtNguoiNhan("");
    setPhuongThucTT("TIEN_MAT");
    setGhiChu("");
    setSelectedProductId("");
    setSelectedColorCode("");
    setColorSearchTerm("");
    setSelectedPromotionId("");
    setCalculatedDiscount(0);
    setIsCreateModalOpen(true);
  };

  // Paint Calculator logic
  const handleAddCalcWall = () => {
    setCalcWalls([...calcWalls, { id: Date.now(), length: "", height: "" }]);
  };
  const handleAddCalcDeduction = () => {
    setCalcDeductions([
      ...calcDeductions,
      { id: Date.now(), length: "", height: "" },
    ]);
  };
  const handleRemoveCalcItem = (id: number, type: "wall" | "deduction") => {
    if (type === "wall") {
      if (calcWalls.length > 1)
        setCalcWalls(calcWalls.filter((w) => w.id !== id));
    } else {
      setCalcDeductions(calcDeductions.filter((d) => d.id !== id));
    }
  };
  const updateCalcItem = (
    id: number,
    field: string,
    value: string,
    type: "wall" | "deduction",
  ) => {
    if (type === "wall") {
      setCalcWalls(
        calcWalls.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
      );
    } else {
      setCalcDeductions(
        calcDeductions.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
      );
    }
  };

  const calculatedResult = useMemo(() => {
    let wallArea = calcWalls.reduce(
      (sum, w) => sum + (Number(w.length) * Number(w.height) || 0),
      0,
    );
    let deductionArea = calcDeductions.reduce(
      (sum, d) => sum + (Number(d.length) * Number(d.height) || 0),
      0,
    );

    if (calcUnit === "ft") {
      wallArea = wallArea * 0.092903; // sq ft to sq m
      deductionArea = deductionArea * 0.092903;
    }

    const totalArea = Math.max(0, wallArea - deductionArea);
    const liters = (totalArea * 2) / 12.3; // 2 coats, coverage 12.3m2/L

    return {
      area: Math.round(totalArea * 100) / 100,
      liters: Math.round(liters * 10) / 10,
    };
  }, [calcWalls, calcDeductions, calcUnit]);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const kh = customers.find((c) => c._id === id);
    if (kh) {
      setDiaChiGiaoHang(kh.DiaChi || "");
      setSdtNguoiNhan(kh.SDT || "");

      // Recalculate existing items' unit price based on the selected customer's classification
      let factor = 1.0;
      if (kh.PhanLoai === "B2B") factor = 1.2;
      else if (kh.PhanLoai === "B2C") factor = 1.3;

      setOrderItems((prevItems) =>
        prevItems.map((item) => {
          const sp = allProducts.find((p) => p._id === item.sanPhamId);
          const basePrice = sp ? sp.DonGiaCoSo : item.donGia;
          return {
            ...item,
            donGia: basePrice * factor,
          };
        }),
      );
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const sp = allProducts.find((p) => p._id === selectedProductId);
    if (!sp) return;
    const stockAvailable = Math.max(sp.TongTonKho || 0, sp.TonKho || 0);
    if (stockAvailable <= 0) {
      alert("Sản phẩm hết hàng");
      return;
    }

    if (!selectedColorCode) return alert("Vui lòng chọn mã màu sơn");

    const color = paintColors.find((c) => c.code === selectedColorCode);
    const chosenMaMau = color?.code || selectedColorCode;
    const chosenTenMau = color?.name || selectedColorCode;
    const chosenHex = color?.hex || "#888888";

    const uniqueKey = `${sp._id}_${chosenMaMau}`;
    if (orderItems.find((i) => `${i.sanPhamId}_${i.maMau}` === uniqueKey)) {
      alert("Sản phẩm với mã màu này đã có trong danh sách");
      return;
    }

    const kh = customers.find((c) => c._id === selectedCustomerId);
    let factor = 1.0;
    if (kh?.PhanLoai === "B2B") factor = 1.2;
    else if (kh?.PhanLoai === "B2C") factor = 1.3;

    setOrderItems([
      ...orderItems,
      {
        sanPhamId: sp._id,
        tenSanPham: sp.TenDongSon,
        soLuong: 1,
        donGia: sp.DonGiaCoSo * factor,
        tonKho: Math.max(sp.TongTonKho || 0, sp.TonKho || 0),
        maMau: chosenMaMau,
        tenMau: chosenTenMau,
        hexCode: chosenHex,
      },
    ]);
    setSelectedProductId("");
    setSelectedColorCode("");
    setColorSearchTerm("");
  };

  const handleRemoveItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemQtyChange = (idx: number, qty: number) => {
    if (qty < 1) return;
    const item = orderItems[idx];
    if (qty > item.tonKho) {
      alert(`Tối đa ${item.tonKho} thùng`);
      return;
    }
    const updated = [...orderItems];
    updated[idx] = { ...item, soLuong: qty };
    setOrderItems(updated);
  };

  const orderSubtotal = orderItems.reduce(
    (s: number, i: any) => s + i.donGia * i.soLuong,
    0,
  );

  // Calculate discount when items or promotion changes
  useEffect(() => {
    if (!selectedPromotionId) {
      setCalculatedDiscount(0);
      return;
    }

    const promo = promotions.find((p) => p._id === selectedPromotionId);
    if (!promo) {
      setCalculatedDiscount(0);
      return;
    }

    if (orderSubtotal < promo.DonHangToiThieu) {
      setCalculatedDiscount(0);
      return;
    }

    let discount = 0;
    if (promo.LoaiGiamGia === "PHAN_TRAM") {
      discount = (orderSubtotal * promo.MucGiam) / 100;
      if (promo.GiamToiDa > 0 && discount > promo.GiamToiDa)
        discount = promo.GiamToiDa;
    } else if (promo.LoaiGiamGia === "GIAM_THANG") {
      discount = promo.MucGiam;
    }
    setCalculatedDiscount(discount);
  }, [selectedPromotionId, orderSubtotal, promotions]);

  const handleCreateOrder = async () => {
    if (!selectedCustomerId) return alert("Vui lòng chọn khách hàng");
    if (orderItems.length === 0)
      return alert("Vui lòng thêm ít nhất 1 sản phẩm");
    if (!diaChiGiaoHang) return alert("Vui lòng nhập địa chỉ giao hàng");
    if (!sdtNguoiNhan) return alert("Vui lòng nhập số điện thoại người nhận");

    setIsSubmittingOrder(true);
    try {
      const maDH = `DH${Date.now().toString().slice(-8)}`;
      const items = orderItems.map((i) => ({
        SanPham: i.sanPhamId,
        TenSanPham: i.tenSanPham,
        MaMau: i.maMau,
        SoLuong: i.soLuong,
        DonGia: i.donGia,
        ThanhTien: i.donGia * i.soLuong,
      }));

      const res = await api.post(API_DON_HANG, {
        MaDonHang: maDH,
        KhachHang: selectedCustomerId,
        NhanVienPhuTrach: selectedSalespersonId || undefined,
        Items: items,
        TongTien: orderSubtotal + phuPhi - calculatedDiscount,
        GiamGia: calculatedDiscount,
        khuyenMaiId: selectedPromotionId || undefined,
        TrangThai: "CHO_XAC_NHAN",
        PhuongThucThanhToan: phuongThucTT,
        TrangThaiThanhToan: "CHUA_THANH_TOAN",
        DiaChiGiaoHang: diaChiGiaoHang,
        GhiChu: ghiChu
          ? `SĐT nhận: ${sdtNguoiNhan} | ${ghiChu}`
          : `SĐT nhận: ${sdtNguoiNhan}`,
        // New fields
        TongDienTichSon: tongDienTichSon,
        PhuPhi: phuPhi,
        DaCoc: daCoc,
        TechnicalSpecs: {
          LoaiBot: loaiBot,
          NhietDoSay: nhietDoSay,
          DoDayLopPhu: doDayLopPhu,
        },
      });

      if (res.data.success) {
        alert(`Tạo đơn hàng thành công! Mã đơn: ${maDH}`);
        setIsCreateModalOpen(false);
        fetchOrders();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi tạo đơn hàng");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: string,
    driverId?: string,
  ) => {
    // If switching to DANG_GIAO and no driver provided yet, open picker
    if (status === "DANG_GIAO" && driverId === undefined) {
      setPendingStatusUpdate({ id, status });
      setIsDriverModalOpen(true);
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Xác nhận trạng thái",
      text: `Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái ${STATUS_MAP[status as keyof typeof STATUS_MAP]?.label || status}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#94a3b8",
      buttonsStyling: true,
      customClass: {
        confirmButton: "px-6 py-2.5 rounded-md font-bold text-sm shadow-md",
        cancelButton:
          "px-6 py-2.5 rounded-md font-bold text-sm bg-slate-400 text-white",
      },
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const payload: any = { status };
      if (driverId) {
        payload.taiXeId = driverId;
        const driver = drivers.find((d) => d._id === driverId);
        if (driver) payload.sdtTaiXe = driver.SDT;
      }

      const res = await api.patch(`${API_DON_HANG}/${id}/status`, payload);
      if (res.data.success) {
        alert("Cập nhật trạng thái thành công!");
        fetchOrders();
        setIsDriverModalOpen(false);
        setSelectedDriverId("");
        setPendingStatusUpdate(null);
        if (selectedOrder?._id === id) {
          setIsDetailsModalOpen(false);
        }
      }
    } catch (error: any) {
      console.error("Update status error:", error);
      alert(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleUpdateDeposit = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.patch(
        `${API_DON_HANG}/${selectedOrder._id}/deposit`,
        { amount: depositAmount },
      );
      if (res.data.success) {
        alert("Cập nhật tiền cọc thành công!");
        setIsPaymentModalOpen(false);
        fetchOrders();
        // Update local selectedOrder to reflect changes if modal is open
        setSelectedOrder({ ...selectedOrder, DaCoc: depositAmount });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi cập nhật tiền cọc");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    const confirmResult = await Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa đơn hàng này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#94a3b8",
      buttonsStyling: true,
      customClass: {
        confirmButton: "px-6 py-2.5 rounded-md font-bold text-sm shadow-md",
        cancelButton:
          "px-6 py-2.5 rounded-md font-bold text-sm bg-slate-400 text-white",
      },
    });

    if (!confirmResult.isConfirmed) return;
    try {
      await api.delete(`${API_DON_HANG}/${id}`);
      alert("Đã xóa đơn hàng");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.MaDonHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.KhachHang?.TenKhachHang?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ),
  );

  const exportToExcel = () => {
    const dataToExport = filteredOrders.map((order) => ({
      "Mã Đơn Hàng": order.MaDonHang,
      "Khách Hàng": order.KhachHang?.TenKhachHang || "Vãng lai",
      SĐT: order.KhachHang?.SDT || "",
      "Số Lượng SP":
        order.Items?.reduce((acc, curr) => acc + curr.SoLuong, 0) || 0,
      "Tổng Tiền": order.TongTien,
      "Ghi Chú": order.GhiChu || "",
      "Ngày Tạo": new Date(order.createdAt).toLocaleString(),
      "Hạn Xác Nhận": new Date(order.HanXacNhan).toLocaleString(),
      "Trạng Thái":
        STATUS_MAP[order.TrangThai as keyof typeof STATUS_MAP]?.label ||
        order.TrangThai,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Don-Hang");
    XLSX.writeFile(
      workbook,
      `VTSC_Danh_Sach_Don_Hang_${new Date().toLocaleDateString().replace(/\//g, "_")}.xlsx`,
    );
  };

  const STATUS_MAP = {
    CHO_XAC_NHAN: { label: "Chờ xác nhận", color: "#d97706", icon: Clock },
    DANG_XU_LY: { label: "Đã xác nhận", color: "#3b82f6", icon: Package },
    DA_XU_LY_XONG: { label: "Đã đóng gói - Chờ giao hàng", color: "#10b981", icon: Package },
    DANG_GIAO: { label: "Đang vận chuyển", color: "#7c3aed", icon: Truck },
    DA_GIAO: { label: "Đã giao hàng", color: "#059669", icon: CheckCircle },
    DA_HUY: { label: "Đã hủy", color: "#e11d48", icon: XCircle },
  };

  const TABS = [
    { key: "ALL", label: "Tất cả" },
    { key: "CHO_XAC_NHAN", label: "Chờ xác nhận" },
    { key: "DANG_XU_LY", label: "Đã xác nhận" },
    { key: "DA_XU_LY_XONG", label: "Đã đóng gói - Chờ giao hàng" },
    { key: "DANG_GIAO", label: "Đang vận chuyển" },
    { key: "DA_GIAO", label: "Đã giao hàng" },
    { key: "DA_HUY", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {TABS.slice(1).map((tab) => {
          const count = orders.filter((o) => o.TrangThai === tab.key).length;
          const statusInfo = STATUS_MAP[tab.key as keyof typeof STATUS_MAP];
          const Icon = statusInfo.icon;
          return (
            <div
              key={tab.key}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-md blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"
                style={{ backgroundColor: `${statusInfo.color}12` }}
              ></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {tab.label}
                  </p>
                  <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                    {count}{" "}
                    <span className="text-xs font-bold text-slate-400 ml-1">
                      đơn
                    </span>
                  </h3>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
                  style={{
                    backgroundColor: `${statusInfo.color}15`,
                    color: statusInfo.color,
                  }}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Kiện Hàng Gần Đây / Tracking Section */}
      <div className="bg-gradient-to-br from-blue-50/40 via-indigo-50/20 to-white p-8 rounded-md border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Truck size={22} className="animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Theo dõi đơn hàng mới nhất
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Click vào kiện hàng để xem chi tiết lộ trình vận chuyển trên toàn
              cầu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shippingData.slice(0, 2).map((t) => {
            const isDelivered = t.TrangThaiTongQuat === "Giao hàng thành công";
            const totalSteps = Math.max(5, t.LoTrinh?.length || 0);
            const completedSteps = isDelivered ? totalSteps : (t.LoTrinh?.length || 0);
            const currentStepLabel = t.LoTrinh?.[t.LoTrinh.length - 1]?.NoiDung || t.TrangThaiTongQuat;
            
            return (
              <div
                key={t._id}
                className="bg-white border border-slate-100 rounded-3xl p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group relative overflow-hidden"
                onClick={() => {
                  window.location.href = `/van-chuyen`;
                }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/20 rounded-md blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

                <div className="relative z-10 flex-1">
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    {t.MaVanChuyen}
                  </span>
                  <div className="font-medium text-slate-800 mt-3 text-[14px]">
                    {t.DonHang?.KhachHang?.TenKhachHang || "Khách hàng"}
                  </div>
                  <div className="text-[12px] text-slate-400 font-semibold mt-0.5">
                    {t.LoHang?.MauSon || "Sơn tĩnh điện"}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-28 h-1.5 bg-slate-100 rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md transition-all duration-500 ${isDelivered ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{
                          width: `${Math.min(100, (completedSteps / totalSteps) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      {completedSteps}/{totalSteps} chặng
                    </span>
                  </div>
                  {currentStepLabel && (
                    <span className={`inline-block mt-3 px-3 py-1 rounded-md text-xs font-bold shadow-sm ${isDelivered ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      • {currentStepLabel.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="relative z-10 bg-white p-3 rounded-lg border border-slate-100 group-hover:border-blue-200 transition-colors shadow-sm ml-4">
                  <QRCodeSVG
                    value={`https://vtsc.vn/tracking/${t.MaVanChuyen}`}
                    size={75}
                    bgColor="#ffffff"
                    fgColor="#0c102a"
                    level="M"
                  />
                </div>
              </div>
            );
          })}
          {shippingData.length === 0 && (
            <div className="col-span-2 text-center py-8 text-slate-400 font-medium">
              Chưa có dữ liệu vận chuyển nào đang hoạt động.
            </div>
          )}
        </div>
      </div>
      {/* Filters & Search */ }
  <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm space-y-6">
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
        <div className="relative w-full md:w-80 group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
          />
          <input
            type="text"
            className="w-full bg-slate-50 border-none rounded-lg px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
            placeholder="Tìm mã đơn, khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-lg overflow-x-auto max-w-full">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAdminOrEmployee && (
          <>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-[14px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer"
            >
              <Download size={18} /> Xuất Excel
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus size={18} /> Tạo đơn hàng
            </button>
          </>
        )}
      </div>
    </div>
  </div>

  {/* Orders Table */ }
  <div className="bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-collapse min-w-[1000px]">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-36 whitespace-nowrap">
              Mã đơn hàng
            </th>
            <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Khách hàng
            </th>
            <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Số lượng
            </th>
            <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Tổng tiền
            </th>
            <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Thanh toán
            </th>
            <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Trạng thái
            </th>
            <th className="px-6 py-5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Hạn xác nhận
            </th>
            <th className="px-6 py-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest w-40 whitespace-nowrap">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loading ? (
            <tr>
              <td
                colSpan={8}
                className="text-center py-20 text-blue-600 font-bold"
              >
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : filteredOrders.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="text-center py-20 text-slate-400 font-medium italic"
              >
                Không tìm thấy đơn hàng nào.
              </td>
            </tr>
          ) : (
            filteredOrders.map((order) => (
              <tr
                key={order._id}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-600">
                    #{order.MaDonHang}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-slate-900 text-[14px]">
                    {order.KhachHang?.TenKhachHang || "Vãng lai"}
                  </div>
                  <div className="text-[12px] text-slate-400 font-medium mt-0.5">
                    {order.KhachHang?.SDT}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium text-[14px]">
                  {order.Items.reduce((acc, curr) => acc + curr.SoLuong, 0)}{" "}
                  sản phẩm
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-emerald-600 text-[15px]">
                    {order.TongTien.toLocaleString()} ₫
                  </div>
                  {order.KhuyenMai && (
                    <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      🎁 {order.KhuyenMai.MaVoucher}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium text-[14px]">
                  {order.PhuongThucThanhToan === "TIEN_MAT"
                    ? "Tiền mặt"
                    : order.PhuongThucThanhToan === "CHUYEN_KHOAN"
                      ? "Chuyển khoản"
                      : order.PhuongThucThanhToan === "GHI_NO"
                        ? "Ghi nợ"
                        : order.PhuongThucThanhToan || "COD"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold border"
                    style={{
                      background: `${STATUS_MAP[order.TrangThai].color}18`,
                      color: STATUS_MAP[order.TrangThai].color,
                      borderColor: `${STATUS_MAP[order.TrangThai].color}40`,
                    }}
                  >
                    {STATUS_MAP[order.TrangThai].label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium">
                  {order.TrangThai === "CHO_XAC_NHAN" ? (
                    <span
                      style={{
                        color:
                          new Date(order.HanXacNhan) < new Date()
                            ? "#e11d48"
                            : "#059669",
                      }}
                    >
                      {new Date(order.HanXacNhan).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailsModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border-none"
                      title="Xem chi tiết"
                    >
                      <Eye size={15} />
                    </button>
                    {!isAdminOrEmployee &&
                      (order.TrangThai === "DANG_GIAO" ||
                        order.TrangThai === "DA_GIAO") && (
                        <Link
                          href="/tracking"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-[11px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors no-underline"
                          title="Theo dõi vận chuyển"
                        >
                          <Truck size={13} /> Theo dõi
                        </Link>
                      )}
                    {isAdminOrEmployee && (
                      <>
                        {order.TrangThai === "CHO_XAC_NHAN" && (
                          order.GhiChu?.toLowerCase().includes('hợp đồng') ? (
                            order.GhiChu?.toLowerCase().includes('pha chế') ? (
                              <span
                                className="inline-flex items-center px-3 py-1.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-500 shadow-sm"
                                title="Đơn hàng đang chờ phòng R&D kiểm định và phê duyệt (KCS)"
                              >
                                <Clock size={12} className="mr-1" /> CHỜ R&D
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-3 py-1.5 rounded-md font-bold text-[11px] bg-amber-50 text-amber-600 shadow-sm border border-amber-200"
                                title="Đơn hàng đang chờ khách hàng ký hợp đồng trên Blockchain"
                              >
                                <Clock size={12} className="mr-1" /> CHỜ KÝ HỢP ĐỒNG
                              </span>
                            )
                          ) : (
                            <button
                              onClick={() => {
                                handleUpdateStatus(order._id, "DANG_XU_LY");
                              }}
                              className="inline-flex items-center px-3 py-1.5 rounded-md font-bold text-[11px] bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer border-none"
                              title="Xác nhận đơn"
                            >
                              XÁC NHẬN
                            </button>
                          )
                        )}
                        {(order.TrangThai === "DANG_XU_LY" || order.TrangThai === "DA_XU_LY_XONG") && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order._id, "DANG_GIAO")
                            }
                            className="inline-flex items-center px-3 py-1.5 rounded-md font-bold text-[11px] text-white hover:opacity-90 shadow-sm transition-all cursor-pointer border-none"
                            style={{ background: "#7c3aed" }}
                            title="Giao hàng"
                          >
                            GIAO HÀNG
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* ═══ CREATE ORDER MODAL ═══ */}
    {isCreateModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-md shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <Plus size={22} className="text-blue-600" /> Tạo Đơn Hàng Mới
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
            {/* Left: Khách hàng + sản phẩm */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Khách hàng */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-lg px-4 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer"
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((c) => (
                      <option
                        key={c._id}
                        value={c._id}
                        className="text-slate-800 bg-white"
                      >
                        [{c.MaKH}] {c.TenKhachHang} — {c.SDT} (
                        {c.PhanLoai || "Chưa phân loại"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Khuyến mãi */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Chương trình ưu đãi
                  </label>
                  <select
                    className={`w-full bg-slate-50 border-none rounded-lg px-4 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer ${calculatedDiscount > 0 ? "ring-2 ring-emerald-500/20" : ""}`}
                    value={selectedPromotionId}
                    onChange={(e) => setSelectedPromotionId(e.target.value)}
                  >
                    <option value="">-- Không sử dụng ưu đãi --</option>
                    {promotions.map((p) => (
                      <option
                        key={p._id}
                        value={p._id}
                        disabled={orderSubtotal < p.DonHangToiThieu}
                        className="text-slate-800 bg-white"
                      >
                        {p.MaVoucher} —{" "}
                        {p.LoaiGiamGia === "PHAN_TRAM"
                          ? `Giảm ${p.MucGiam}%`
                          : `Giảm ${p.MucGiam.toLocaleString()}₫`}{" "}
                        {orderSubtotal < p.DonHangToiThieu
                          ? `(Thiếu ${(p.DonHangToiThieu - orderSubtotal).toLocaleString()}₫)`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thêm sản phẩm */}
              <div className="space-y-4">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Sản phẩm sơn <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-3">
                  <select
                    className="flex-1 bg-slate-50 border-none rounded-lg px-4 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer"
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSelectedColorCode("");
                      setColorSearchTerm("");
                    }}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {allProducts
                      .filter(
                        (p) =>
                          Math.max(p.TongTonKho || 0, p.TonKho || 0) > 0,
                      )
                      .map((p) => {
                        const kh = customers.find(
                          (c) => c._id === selectedCustomerId,
                        );
                        let factor = 1.0;
                        let labelSuffix = "";
                        if (kh?.PhanLoai === "B2B") {
                          factor = 1.2;
                          labelSuffix = " (B2B +20%)";
                        } else if (kh?.PhanLoai === "B2C") {
                          factor = 1.3;
                          labelSuffix = " (B2C +30%)";
                        }
                        const displayPrice = p.DonGiaCoSo * factor;
                        const availableStock = Math.max(
                          p.TongTonKho || 0,
                          p.TonKho || 0,
                        );
                        return (
                          <option key={p._id} value={p._id}>
                            {p.TenDongSon} — {displayPrice.toLocaleString()}
                            ₫{labelSuffix} (Kho: {availableStock})
                          </option>
                        );
                      })}
                  </select>
                  <button
                    onClick={handleAddProduct}
                    disabled={!selectedProductId || !selectedColorCode}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-[14px] hover:bg-blue-700 shadow-md disabled:opacity-55 disabled:cursor-not-allowed transition-all cursor-pointer border-none"
                  >
                    Thêm sản phẩm
                  </button>
                </div>

                {/* Bảng màu sơn - luôn hiển thị khi đã chọn sản phẩm */}
                {selectedProductId && (
                  <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-lg space-y-3">
                    <label className="text-[11px] font-semibold text-slate-450 uppercase tracking-wider block">
                      Chọn mã màu sơn{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-100 rounded-md px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                      placeholder="Tìm mã màu hoặc tên màu (RAL-1015, Silver, Red...)"
                      value={colorSearchTerm}
                      onChange={(e) => setColorSearchTerm(e.target.value)}
                    />
                    {selectedColorCode &&
                      (() => {
                        const c = paintColors.find(
                          (pc) => pc.code === selectedColorCode,
                        );
                        return c ? (
                          <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                            <div
                              className="w-8 h-8 rounded-lg shadow-inner border border-slate-200"
                              style={{ background: c.hex }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-blue-700">
                                {c.code}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {c.name} • {c.category} • {c.gloss}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedColorCode("");
                                setColorSearchTerm("");
                              }}
                              className="w-6 h-6 rounded-md hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-455 transition-colors border-none bg-transparent cursor-pointer font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })()}
                    <div className="bg-white border border-slate-150 rounded-md overflow-hidden max-h-[160px] overflow-y-auto custom-scrollbar">
                      {paintColors
                        .filter((c) => {
                          if (!colorSearchTerm) return true;
                          const q = colorSearchTerm.toLowerCase();
                          return (
                            c.code.toLowerCase().includes(q) ||
                            c.name.toLowerCase().includes(q) ||
                            c.category.toLowerCase().includes(q)
                          );
                        })
                        .map((c) => (
                          <div
                            key={c.code}
                            onClick={() => {
                              setSelectedColorCode(c.code);
                              setColorSearchTerm("");
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                            style={{
                              backgroundColor:
                                selectedColorCode === c.code
                                  ? "#eff6ff"
                                  : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedColorCode !== c.code)
                                e.currentTarget.style.backgroundColor =
                                  "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              if (selectedColorCode !== c.code)
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                            }}
                          >
                            <div
                              className="w-6 h-6 rounded-md shadow-inner border border-slate-200 flex-shrink-0"
                              style={{ background: c.hex }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-700">
                                {c.code}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {c.name} • {c.category}
                              </div>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400">
                              {c.surface}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm đã chọn */}
              <div className="border border-slate-100 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-150">
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                          Mã màu
                        </th>
                        <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                          Số lượng
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                          Thành tiền
                        </th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orderItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-slate-405 font-medium italic text-sm"
                          >
                            Chưa có sản phẩm nào được chọn
                          </td>
                        </tr>
                      ) : (
                        orderItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800 text-xs">
                                {item.tenSanPham}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Kho: {item.tonKho} thùng
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center gap-1.5 justify-center">
                                <div
                                  className="w-4 h-4 rounded-md shadow-inner border border-slate-200 flex-shrink-0"
                                  style={{ background: item.hexCode }}
                                />
                                <span className="text-[11px] font-semibold text-slate-700">
                                  {item.maMau}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {item.tenMau}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    handleItemQtyChange(
                                      idx,
                                      item.soLuong - 1,
                                    )
                                  }
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center cursor-pointer border-none font-bold text-sm"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={item.soLuong}
                                  onChange={(e) =>
                                    handleItemQtyChange(
                                      idx,
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  className="w-12 text-center bg-slate-50 border border-slate-150 rounded-lg py-1 font-bold text-slate-805 text-xs outline-none"
                                  min={1}
                                  max={item.tonKho}
                                />
                                <button
                                  onClick={() =>
                                    handleItemQtyChange(
                                      idx,
                                      item.soLuong + 1,
                                    )
                                  }
                                  className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center cursor-pointer border-none font-bold text-sm"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-[12px] font-semibold text-slate-700">
                              {item.donGia.toLocaleString()} ₫
                            </td>
                            <td className="px-4 py-3 text-right text-[12px] font-semibold text-blue-600">
                              {(
                                item.donGia * item.soLuong
                              ).toLocaleString()}{" "}
                              ₫
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-400 hover:text-rose-500 transition-colors bg-transparent border-none cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {orderItems.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-50/50 font-semibold text-slate-700 border-t border-slate-150">
                          <td
                            colSpan={4}
                            className="px-4 py-3.5 text-right text-xs uppercase tracking-wider"
                          >
                            Tổng cộng sản phẩm:
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm text-emerald-600 font-semibold">
                            {orderSubtotal.toLocaleString()} ₫
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* THÔNG SỐ KỸ THUẬT SƠN */}
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-4">
                <div className="text-[12px] font-semibold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={16} /> Thông số kỹ thuật sơn (MERN)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                      Loại bột sơn
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-100 rounded-md px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                      value={loaiBot}
                      onChange={(e) => setLoaiBot(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                      Nhiệt độ sấy
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-100 rounded-md px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                      value={nhietDoSay}
                      onChange={(e) => setNhietDoSay(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                      Độ dày lớp phủ
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-100 rounded-md px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                      value={doDayLopPhu}
                      onChange={(e) => setDoDayLopPhu(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>Diện tích sơn (m2)</span>
                      <button
                        type="button"
                        onClick={() => setIsCalculatorOpen(true)}
                        className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-2 py-0.5 cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Calculator size={10} /> Công cụ tính
                      </button>
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white border border-slate-100 rounded-md px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                      value={tongDienTichSon}
                      onChange={(e) =>
                        setTongDienTichSon(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Thông tin giao hàng + thanh toán */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:border-l lg:border-slate-100 lg:pl-8">
              {/* Địa chỉ giao hàng */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Địa chỉ giao hàng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="w-full bg-slate-50 border-none rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium resize-none min-h-[80px]"
                  placeholder="Nhập địa chỉ giao hàng chi tiết..."
                  value={diaChiGiaoHang}
                  onChange={(e) => setDiaChiGiaoHang(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SĐT người nhận */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    SĐT người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-none rounded-lg px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                    placeholder="VD: 0912345678"
                    value={sdtNguoiNhan}
                    onChange={(e) => setSdtNguoiNhan(e.target.value)}
                  />
                </div>

                {/* Nhân viên phụ trách */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                    Nhân viên sales phụ trách
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-lg px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer"
                    value={selectedSalespersonId}
                    onChange={(e) =>
                      setSelectedSalespersonId(e.target.value)
                    }
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {allStaff
                      .filter(
                        (s: any) =>
                          s.BoPhan === "Kinh doanh" ||
                          s.BoPhan === "Sale / MKT" ||
                          s.BoPhan === "CSKH Bảo Hành",
                      )
                      .map((s: any) => (
                        <option
                          key={s._id}
                          value={s._id}
                          className="text-slate-800 bg-white"
                        >
                          {s.MaNV} - {s.HoTen}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const PMIcon = pm.icon;
                    const isActive = phuongThucTT === pm.key;
                    return (
                      <button
                        key={pm.key}
                        type="button"
                        onClick={() => setPhuongThucTT(pm.key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer gap-2 ${isActive
                            ? "border-blue-600 bg-blue-50/50 text-blue-600 font-bold shadow-sm"
                            : "border-slate-100 bg-slate-50/30 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        <PMIcon
                          size={20}
                          className={
                            isActive ? "text-blue-600" : "text-slate-400"
                          }
                        />
                        <span className="text-[11px] whitespace-nowrap">
                          {pm.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CHI PHÍ BỔ SUNG & ĐẶT CỌC */}
              <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                    Phụ phí (Đóng gói/VC)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-100 rounded-md px-3 py-2 text-sm text-amber-600 font-bold outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                    value={phuPhi}
                    onChange={(e) => setPhuPhi(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                    Số tiền đã cọc
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-100 rounded-md px-3 py-2 text-sm text-emerald-600 font-bold outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                    value={daCoc}
                    onChange={(e) => setDaCoc(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Ghi chú đơn hàng
                </label>
                <textarea
                  className="w-full bg-slate-50 border-none rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium resize-none min-h-[60px]"
                  placeholder="Nhập ghi chú khác (tùy chọn)..."
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                />
              </div>

              {/* Tổng kết & Xác nhận */}
              <div className="border-t border-slate-100 pt-6 mt-auto space-y-4">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-50 text-amber-600">
                    Chờ xác nhận
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-slate-400">Thanh toán:</span>
                  <span className="text-slate-800 font-bold">
                    {
                      PAYMENT_METHODS.find((p) => p.key === phuongThucTT)
                        ?.label
                    }
                  </span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                    <span>Chiết khấu ưu đãi:</span>
                    <span className="font-semibold">
                      -{calculatedDiscount.toLocaleString()} ₫
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                  <span className="text-xs font-semibold text-slate-900 uppercase tracking-widest">
                    TỔNG THANH TOÁN:
                  </span>
                  <span className="text-2xl font-semibold text-emerald-600">
                    {(
                      orderSubtotal +
                      phuPhi -
                      calculatedDiscount
                    ).toLocaleString()}{" "}
                    ₫
                  </span>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={isSubmittingOrder}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {isSubmittingOrder ? (
                    "ĐANG TẠO ĐƠN HÀNG..."
                  ) : (
                    <>
                      <CheckCircle size={18} /> TẠO ĐƠN HÀNG
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ DETAILS MODAL ═══ */}
    {isDetailsModalOpen && selectedOrder && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-md shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Custom Header with Back Button */}
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors cursor-pointer border-none"
              >
                <ArrowLeft size={14} /> Quay lại
              </button>
              <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-wider">
                Chi tiết đơn hàng #{selectedOrder.MaDonHang}
              </h3>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase bg-blue-50 text-blue-600">
              {STATUS_MAP[selectedOrder.TrangThai].label}
            </span>
          </div>

          {/* Modal Body */}
          <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* I. THÔNG TIN KHÁCH HÀNG & SẢN PHẨM */}
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:shadow-sm transition-all space-y-4">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User size={14} /> I. Thông tin khách hàng
                </h4>
                <div className="space-y-2.5 text-[13px] font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Khách hàng:</span>
                    <span className="font-bold text-slate-800">
                      {selectedOrder.KhachHang?.TenKhachHang ||
                        "Khách vãng lai"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số điện thoại:</span>
                    <span className="text-slate-800">
                      {selectedOrder.SDTNguoiNhan || selectedOrder.KhachHang?.SDT || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-400 whitespace-nowrap">Địa chỉ:</span>
                    <span className="text-slate-800 text-right leading-snug">
                      {selectedOrder.DiaChiGiaoHang || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sản phẩm:</span>
                    <span className="font-bold text-slate-800">
                      {selectedOrder.Items?.[0]?.TenSanPham} (
                      {selectedOrder.Items?.reduce(
                        (s: number, i: any) => s + i.SoLuong,
                        0,
                      )}{" "}
                      thùng)
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Ngày giờ mua hàng:
                      </span>
                      <span className="text-slate-800 font-bold">
                        {new Date(selectedOrder.createdAt).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    {(() => {
                      const diffTime = Math.abs(
                        new Date().getTime() -
                        new Date(selectedOrder.createdAt).getTime(),
                      );
                      const diffMonths =
                        diffTime / (1000 * 60 * 60 * 24 * 30.44);
                      if (diffMonths > 24) {
                        return (
                          <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-md border border-rose-100 flex flex-col gap-1">
                            <span className="font-bold">
                              ⚠️ Không đủ điều kiện:
                            </span>{" "}
                            Đơn hàng / Hợp đồng đã mua sau 2 năm sẽ không
                            được áp dụng chính sách bảo hành, đổi trả.
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* II. THÔNG SỐ KỸ THUẬT SƠN (MERN) */}
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:shadow-sm transition-all space-y-4">
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layers size={14} /> II. Thông số kỹ thuật sơn
                </h4>
                <div className="space-y-2.5 text-[13px] font-medium text-slate-600">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400 mt-0.5">
                      Mã màu đặt hàng:
                    </span>
                    <div className="flex flex-col gap-1.5 items-end">
                      {selectedOrder?.Items?.map(
                        (item: any, idx: number) => {
                          const cInfo = paintColors.find(
                            (c) => c.code === item.MaMau,
                          );
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-100"
                            >
                              <span
                                className="w-3 h-3 rounded-md border border-slate-200"
                                style={{
                                  backgroundColor: cInfo?.hex || "#ccc",
                                }}
                              ></span>
                              <span className="font-semibold text-blue-600 text-xs">
                                {item.MaMau || "N/A"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                x{item.SoLuong}
                              </span>
                            </div>
                          );
                        },
                      ) || (
                          <span className="font-semibold text-slate-400">
                            N/A
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loại bột:</span>
                    <span className="text-slate-800">
                      {selectedOrder?.TechnicalSpecs?.LoaiBot ||
                        "AkzoNobel Interpon"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nhiệt độ sấy:</span>
                    <span className="text-slate-800">
                      {selectedOrder?.TechnicalSpecs?.NhietDoSay ||
                        "195°C / 15 phút"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Độ dày lớp phủ:</span>
                    <span className="text-slate-800">
                      {selectedOrder?.TechnicalSpecs?.DoDayLopPhu ||
                        "75 µm"}
                    </span>
                  </div>
                  {(selectedOrder?.KhachHang?.PhanLoai === "DOANH_NGHIEP" ||
                    selectedOrder?.GhiChu?.toLowerCase().includes(
                      "pha chế",
                    ) ||
                    selectedOrder?.GhiChu?.toLowerCase().includes("mẫu") ||
                    selectedOrder?.GhiChu?.toLowerCase().includes(
                      "hợp đồng",
                    )) && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => setIsChartModalOpen(true)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            color: "#2563eb",
                            border: "1px solid #2563eb",
                          }}
                        >
                          📈 Xem biểu đồ hiệu suất thực
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* III. THÔNG TIN THANH TOÁN (PAYMENT) */}
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
              <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <CreditCard size={14} /> III. Thông tin thanh toán (Payment)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-150">
                <div className="space-y-3 text-[13px] font-medium text-slate-650">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Đơn giá / m2:</span>
                    <span className="text-slate-800">
                      {(
                        selectedOrder.TongTien /
                        (selectedOrder.TongDienTichSon || 1)
                      ).toLocaleString()}
                      đ / m2
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Thành tiền sản phẩm:
                    </span>
                    <span className="text-slate-800">
                      {(
                        selectedOrder.TongTien - (selectedOrder.PhuPhi || 0)
                      ).toLocaleString()}
                      đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Phụ phí (đóng gói/VC):
                    </span>
                    <span className="text-slate-800">
                      {(selectedOrder.PhuPhi || 0).toLocaleString()}đ
                    </span>
                  </div>
                  {selectedOrder.GiamGia !== undefined &&
                    selectedOrder.GiamGia > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>
                          Chiết khấu (
                          {selectedOrder.KhuyenMai?.MaVoucher || "Voucher"}
                          ):
                        </span>
                        <span>
                          -{(selectedOrder.GiamGia || 0).toLocaleString()}đ
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-[14px]">
                    <span className="font-bold text-slate-900">
                      TỔNG CỘNG:
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {selectedOrder.TongTien.toLocaleString()}đ
                    </span>
                  </div>
                </div>
                <div className="space-y-3 text-[13px] font-medium text-slate-650 pt-4 md:pt-0 md:pl-8">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">
                      Khách đã đặt cọc:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {(selectedOrder.DaCoc || 0).toLocaleString()}đ (
                        {Math.round(
                          ((selectedOrder.DaCoc || 0) /
                            selectedOrder.TongTien) *
                          100,
                        )}
                        %)
                      </span>
                      {selectedOrder.TrangThai === "CHO_XAC_NHAN" && (
                        <button
                          onClick={() => {
                            setDepositAmount(selectedOrder.DaCoc || 0);
                            setIsPaymentModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                          style={{
                            padding: "2px 8px",
                            fontSize: "10px",
                            color: "#2563eb",
                            border: "1px solid #2563eb",
                          }}
                        >
                          Cập nhật
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-4 text-[16px]">
                    <span className="font-bold text-slate-900">
                      SỐ TIỀN CÒN LẠI:
                    </span>
                    <span className="font-semibold text-rose-500">
                      {Math.max(
                        0,
                        selectedOrder.TongTien - (selectedOrder.DaCoc || 0),
                      ).toLocaleString()}
                      đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline / Action Section */}
            <div className="space-y-3.5">
              <button
                onClick={handleDownloadPhieuCoc}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
              >
                <FileCheck size={14} /> In Phiếu Cọc (Word)
              </button>

              <button
                onClick={handleDownloadHoaDonGTGT}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                disabled={isPrinting}
              >
                <Printer size={14} /> In Hóa Đơn GTGT
              </button>
            </div>

            {/* Status Control Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              {selectedOrder.TrangThai !== "DA_GIAO" &&
                selectedOrder.TrangThai !== "DA_HUY" && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder._id, "DA_HUY")
                    }
                    className="px-5 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hủy đơn hàng
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* CHART MODAL */}
        {isChartModalOpen && selectedOrder && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1100,
              display: "flex",
              alignItems: "center",
              justifyItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden"
              style={{
                width: "95%",
                maxWidth: "800px",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "32px",
                background: "#0f172a",
                color: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: 16,
                }}
              >
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: 0,
                    color: "#00d4ff",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Thermometer size={24} /> Hiệu Suất Sấy Thực Tế - Đơn #
                  {selectedOrder.MaDonHang}
                </h3>
                <button
                  onClick={() => setIsChartModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 24,
                  }}
                >
                  &times;
                </button>
              </div>

              <div style={{ height: 400, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const matchLog = rdTrackingLogs.find(
                        (log) =>
                          (log.MaMauYeuCau &&
                            selectedOrder.Items?.[0]?.MaMau &&
                            log.MaMauYeuCau.toLowerCase() ===
                            selectedOrder.Items?.[0]?.MaMau.toLowerCase()) ||
                          (log.colorCode &&
                            selectedOrder.Items?.[0]?.MaMau &&
                            log.colorCode.toLowerCase() ===
                            selectedOrder.Items?.[0]?.MaMau.toLowerCase()),
                      );
                      const versions = matchLog?.LichSuPhienBan || [];

                      if (versions.length > 0) {
                        return versions.map((v: any) => ({
                          time: `V${v.version || "1.0"}`,
                          nhietDo: parseFloat(v.nhietDo) || 195,
                          hieuSuat: parseFloat(v.hieuSuat) || 98,
                        }));
                      }

                      const targetTempStr =
                        selectedOrder.TechnicalSpecs?.NhietDoSay || "195";
                      const targetTemp =
                        parseInt(targetTempStr.replace(/\D/g, "")) || 195;
                      return [
                        { time: "Phút 0", nhietDo: 25, hieuSuat: 0 },
                        {
                          time: "Phút 5",
                          nhietDo: Math.round(targetTemp * 0.6),
                          hieuSuat: 30,
                        },
                        {
                          time: "Phút 10",
                          nhietDo: Math.round(targetTemp * 0.9),
                          hieuSuat: 60,
                        },
                        {
                          time: "Phút 15",
                          nhietDo: targetTemp,
                          hieuSuat: 95,
                        },
                        {
                          time: "Phút 20",
                          nhietDo: targetTemp,
                          hieuSuat: 98,
                        },
                        {
                          time: "Phút 25",
                          nhietDo: Math.round(targetTemp * 0.5),
                          hieuSuat: 100,
                        },
                      ];
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis
                      yAxisId="left"
                      stroke="#00d4ff"
                      label={{
                        value: "Nhiệt độ (°C)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#00d4ff",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#059669"
                      label={{
                        value: "Hiệu suất (%)",
                        angle: 90,
                        position: "insideRight",
                        fill: "#059669",
                      }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="nhietDo"
                      name="Nhiệt độ lò sấy (°C)"
                      stroke="#00d4ff"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="hieuSuat"
                      name="Độ bám dính (%)"
                      stroke="#059669"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: "rgba(0,212,255,0.05)",
                  borderRadius: 12,
                  border: "1px solid rgba(0,212,255,0.2)",
                }}
              >
                <div style={{ display: "flex", gap: 20 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginBottom: 4,
                      }}
                    >
                      Loại bột sơn
                    </div>
                    <div style={{ fontWeight: 600, color: "#fff" }}>
                      {selectedOrder.TechnicalSpecs?.LoaiBot ||
                        "AkzoNobel Interpon"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginBottom: 4,
                      }}
                    >
                      Nhiệt độ chuẩn
                    </div>
                    <div style={{ fontWeight: 600, color: "#fff" }}>
                      {selectedOrder.TechnicalSpecs?.NhietDoSay || "195°C"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginBottom: 4,
                      }}
                    >
                      Đánh giá
                    </div>
                    <div style={{ fontWeight: 600, color: "#059669" }}>
                      Đạt tiêu chuẩn xuất xưởng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HIDDEN PRINT TEMPLATE (Pure white for PDF) */}
        <div
          style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
        >
          <div
            ref={printRef}
            style={{
              width: "210mm",
              padding: "20mm",
              background: "#fff",
              color: "#000",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <div
              style={{
                borderBottom: "2px solid #333",
                paddingBottom: "10mm",
                marginBottom: "10mm",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: "28px" }}>
                  VTSC PAINT PRO
                </h1>
                <p style={{ margin: "5px 0" }}>
                  Hệ thống Quản lý Bền mặt Công nghiệp
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: 0 }}>PHIẾU XÁC NHẬN</h2>
                <p>Mã: #{selectedOrder.MaDonHang}</p>
              </div>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "10mm",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      width: "50%",
                      verticalAlign: "top",
                      padding: "5mm",
                      border: "1px solid #ddd",
                    }}
                  >
                    <h3
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "2mm",
                      }}
                    >
                      I. KHÁCH HÀNG & PHỤ TRÁCH
                    </h3>
                    <p>
                      <strong>Khách hàng:</strong>{" "}
                      {selectedOrder.KhachHang?.TenKhachHang}
                    </p>
                    <p>
                      <strong>Số ĐT:</strong> {selectedOrder.KhachHang?.SDT}
                    </p>
                    <p>
                      <strong>NV Sales:</strong>{" "}
                      {selectedOrder.NhanVienPhuTrach
                        ? `${selectedOrder.NhanVienPhuTrach.MaNV} - ${selectedOrder.NhanVienPhuTrach.HoTen}`
                        : "Chưa gán"}
                    </p>
                    <p>
                      <strong>Diện tích sơn:</strong>{" "}
                      {selectedOrder.TongDienTichSon} m2
                    </p>
                  </td>
                  <td
                    style={{
                      width: "50%",
                      verticalAlign: "top",
                      padding: "5mm",
                      border: "1px solid #ddd",
                    }}
                  >
                    <h3
                      style={{
                        borderBottom: "1px solid #eee",
                        paddingBottom: "2mm",
                      }}
                    >
                      II. THÔNG SỐ KỸ THUẬT (MERN)
                    </h3>
                    <p>
                      <strong>Mã màu:</strong>{" "}
                      {selectedOrder.Items?.[0]?.MaMau}
                    </p>
                    <p>
                      <strong>Loại bột:</strong>{" "}
                      {selectedOrder.TechnicalSpecs?.LoaiBot}
                    </p>
                    <p>
                      <strong>Nhiệt độ sấy:</strong>{" "}
                      {selectedOrder.TechnicalSpecs?.NhietDoSay}
                    </p>
                    <p>
                      <strong>Độ dày lớp phủ:</strong>{" "}
                      {selectedOrder.TechnicalSpecs?.DoDayLopPhu}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                border: "1px solid #ddd",
                padding: "5mm",
                marginBottom: "10mm",
              }}
            >
              <h3
                style={{
                  borderBottom: "1px solid #eee",
                  paddingBottom: "2mm",
                }}
              >
                III. CHI TIẾT THANH TOÁN
              </h3>
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td>Thành tiền hàng:</td>
                    <td style={{ textAlign: "right" }}>
                      {(
                        selectedOrder.TongTien - (selectedOrder.PhuPhi || 0)
                      ).toLocaleString()}
                      đ
                    </td>
                  </tr>
                  <tr>
                    <td>Phụ phí (VC/Đóng gói):</td>
                    <td style={{ textAlign: "right" }}>
                      {(selectedOrder.PhuPhi || 0).toLocaleString()}đ
                    </td>
                  </tr>
                  <tr style={{ fontWeight: "bold", fontSize: "18px" }}>
                    <td style={{ paddingTop: "5mm" }}>TỔNG CỘNG:</td>
                    <td style={{ textAlign: "right", paddingTop: "5mm" }}>
                      {selectedOrder.TongTien.toLocaleString()}đ
                    </td>
                  </tr>
                  <tr style={{ color: "#28a745" }}>
                    <td>Đã đặt cọc:</td>
                    <td style={{ textAlign: "right" }}>
                      {(selectedOrder.DaCoc || 0).toLocaleString()}đ
                    </td>
                  </tr>
                  <tr
                    style={{
                      fontWeight: "bold",
                      color: "#dc3545",
                      fontSize: "20px",
                    }}
                  >
                    <td
                      style={{
                        paddingTop: "3mm",
                        borderTop: "2px double #ddd",
                      }}
                    >
                      CÒN LẠI:
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        paddingTop: "3mm",
                        borderTop: "2px double #ddd",
                      }}
                    >
                      {(
                        selectedOrder.TongTien - (selectedOrder.DaCoc || 0)
                      ).toLocaleString()}
                      đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: "20mm",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ textAlign: "center", width: "200px" }}>
                <p>Khách hàng</p>
                <div style={{ height: "30mm" }}></div>
                <p>(Ký tên)</p>
              </div>
              <div style={{ textAlign: "center", width: "200px" }}>
                <p>Người lập phiếu</p>
                <div style={{ height: "30mm" }}></div>
                <p>(Ký tên)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ DRIVER SELECTION MODAL ═══ */}
    {isDriverModalOpen && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2.5">
              <Truck size={20} className="text-purple-600" /> Điều phối tài
              xế giao hàng
            </h3>
            <button
              onClick={() => setIsDriverModalOpen(false)}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
            >
              ×
            </button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
            <p className="text-xs text-slate-500 leading-relaxed">
              Vui lòng chọn tài xế từ bộ phận{" "}
              <strong>Nhân viên Kỹ thuật (Kho / Logistics)</strong> để bắt
              đầu quá trình vận chuyển.
            </p>

            <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
              {drivers.map((driver) => (
                <div
                  key={driver._id}
                  onClick={() => setSelectedDriverId(driver._id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3.5 ${selectedDriverId === driver._id
                      ? "border-blue-600 bg-blue-50/40 shadow-sm"
                      : "border-slate-100 hover:bg-slate-50"
                    }`}
                >
                  <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-slate-805">
                      {driver.HoTen}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {driver.BoPhan} • SĐT: {driver.SDT}
                    </div>
                  </div>
                  {selectedDriverId === driver._id && (
                    <CheckCircle
                      size={18}
                      className="text-blue-600 flex-shrink-0"
                    />
                  )}
                </div>
              ))}
              {drivers.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium italic text-xs">
                  Không tìm thấy nhân viên Kỹ thuật phù hợp ở bộ phận
                  Kho/Logistics.
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                onClick={() => setIsDriverModalOpen(false)}
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  pendingStatusUpdate &&
                  handleUpdateStatus(
                    pendingStatusUpdate.id,
                    pendingStatusUpdate.status,
                    selectedDriverId,
                  )
                }
                disabled={!selectedDriverId}
                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer border-none"
              >
                Xác nhận giao hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ PAINT CALCULATOR MODAL ═══ */}
    {isCalculatorOpen && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" /> Tính diện
              tích bề mặt sơn
            </h3>
            <button
              onClick={() => setIsCalculatorOpen(false)}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {/* Unit Toggle */}
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <span className="text-xs font-semibold text-slate-500 pl-2">
                Đơn vị đo lường
              </span>
              <div className="flex gap-1 p-0.5 bg-slate-200/50 rounded-md">
                <button
                  onClick={() => setCalcUnit("m")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${calcUnit === "m" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 bg-transparent"}`}
                >
                  Mét (m)
                </button>
                <button
                  onClick={() => setCalcUnit("ft")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${calcUnit === "ft" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 bg-transparent"}`}
                >
                  Feet (ft)
                </button>
              </div>
            </div>

            {/* Walls Section */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Bề mặt tường ({calcWalls.length})
              </div>
              <div className="space-y-3">
                {calcWalls.map((wall, index) => (
                  <div key={wall.id} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Chiều dài"
                        className="w-full bg-slate-50 border-none rounded-md px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                        value={wall.length}
                        onChange={(e) =>
                          updateCalcItem(
                            wall.id,
                            "length",
                            e.target.value,
                            "wall",
                          )
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {calcUnit}
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Chiều cao"
                        className="w-full bg-slate-50 border-none rounded-md px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                        value={wall.height}
                        onChange={(e) =>
                          updateCalcItem(
                            wall.id,
                            "height",
                            e.target.value,
                            "wall",
                          )
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {calcUnit}
                      </span>
                    </div>
                    {calcWalls.length > 1 && (
                      <button
                        onClick={() =>
                          handleRemoveCalcItem(wall.id, "wall")
                        }
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddCalcWall}
                  className="w-full py-2.5 bg-white border border-dashed border-blue-200 hover:bg-blue-50/50 text-blue-650 rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Thêm diện tích tường
                </button>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                Diện tích khấu trừ (Cửa đi / Cửa sổ) (
                {calcDeductions.length})
              </div>
              <div className="space-y-3">
                {calcDeductions.map((ded, index) => (
                  <div key={ded.id} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Chiều dài"
                        className="w-full bg-slate-50 border-none rounded-md px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                        value={ded.length}
                        onChange={(e) =>
                          updateCalcItem(
                            ded.id,
                            "length",
                            e.target.value,
                            "deduction",
                          )
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {calcUnit}
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Chiều cao"
                        className="w-full bg-slate-50 border-none rounded-md px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                        value={ded.height}
                        onChange={(e) =>
                          updateCalcItem(
                            ded.id,
                            "height",
                            e.target.value,
                            "deduction",
                          )
                        }
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {calcUnit}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleRemoveCalcItem(ded.id, "deduction")
                      }
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddCalcDeduction}
                  className="w-full py-2.5 bg-white border border-dashed border-rose-200 hover:bg-rose-50/50 text-rose-500 rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Thêm cửa sổ / cửa đi
                </button>
              </div>
            </div>
          </div>

          {/* Footer / Results */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0 space-y-4">
            <div className="space-y-2 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Diện tích tường khả dụng:</span>
                <span className="text-slate-800 font-bold">
                  {calculatedResult.area} m²
                </span>
              </div>
              <div className="flex justify-between">
                <span>Định mức che phủ kỹ thuật:</span>
                <span className="text-slate-800 font-bold">
                  12.3 m² / Lít (2 lớp phủ)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-slate-200/60 pt-3">
              <span className="text-xs font-semibold text-slate-900 uppercase">
                Khối lượng sơn ước tính:
              </span>
              <span className="text-2xl font-semibold text-blue-600">
                {calculatedResult.liters} Lít
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCalculatorOpen(false)}
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setTongDienTichSon(calculatedResult.area);
                  setIsCalculatorOpen(false);
                }}
                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <FileCheck size={16} /> Áp dụng kết quả
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ PAYMENT MODAL ═══ */}
    {isPaymentModalOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard size={20} className="text-amber-500" /> Cập nhật
              tiền cọc
            </h3>
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
            >
              ×
            </button>
          </div>
          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Số tiền khách đã trả (VNĐ)
              </label>
              <input
                type="number"
                className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                style={{
                  width: "100%",
                  fontSize: 20,
                  fontWeight: 700,
                  textAlign: "right",
                  color: "#059669",
                }}
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
              />
              <div className="flex gap-2">
                {[0.3, 0.5, 1].map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setDepositAmount(
                        Math.round(selectedOrder!.TongTien * p),
                      )
                    }
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-xs font-bold transition-all cursor-pointer"
                  >
                    {p * 100}%
                  </button>
                ))}
              </div>
            </div>



            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateDeposit}
                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer border-none"
              >
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
    </div >
  );
}
