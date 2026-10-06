"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Globe, ShieldCheck, ArrowRight } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer
      id="footer"
      className="relative bg-slate-950 text-white pt-16 pb-12 border-t border-slate-800/80 transition-colors duration-300"
    >
      <div className="max-w-[1300px] mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          {/* Column 1: Company Profile */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3.5">
              <img
                src="/vtsc.png"
                alt="VTSC Logo"
                className="h-12 w-auto object-contain drop-shadow"
              />
              <span className="font-extrabold text-lg sm:text-xl tracking-tight uppercase text-white">
                CÔNG TY CP TMDV VOSCO (VTSC)
              </span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Đơn vị phân phối và ứng dụng giải pháp sơn tĩnh điện cao cấp AkzoNobel Interpon hàng đầu Việt Nam. Cung cấp dịch vụ R&D pha chế màu sơn theo tiêu chuẩn quốc tế.
            </p>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3 text-slate-300">
                <MapPin size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span>215 Lạch Tray, Phường Đằng Giang, Quận Ngô Quyền, Hải Phòng</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Phone size={18} className="text-blue-400 flex-shrink-0" />
                <span>0225.3842.160 — 0225.3747.226</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Mail size={18} className="text-blue-400 flex-shrink-0" />
                <span>vtsc@vtschp.vn</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.facebook.com/VOSCO.VTSC"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-800"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://vtsc.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-800"
                aria-label="Website"
              >
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Policies */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Chính sách & Cam kết
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li>
                <Link
                  href="/policies?type=return"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline block"
                >
                  Chính sách đổi trả sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  href="/policies?type=warranty"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline block"
                >
                  Chính sách bảo hành màng sơn
                </Link>
              </li>
              <li>
                <Link
                  href="/policies?type=shipping"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline block"
                >
                  Chính sách vận chuyển & giao hàng
                </Link>
              </li>
              <li>
                <Link
                  href="/policies?type=aftersale"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline block"
                >
                  Chính sách hậu mãi & hỗ trợ kỹ thuật
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Tra cứu & Dịch vụ trực tuyến
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li>
                <Link
                  href="/shop"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline flex items-center gap-1.5"
                >
                  <span>Cửa hàng sơn tĩnh điện AkzoNobel</span>
                  <ArrowRight size={14} className="opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/colors"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline flex items-center gap-1.5"
                >
                  <span>Bảng tra cứu mã màu RAL & Interpon</span>
                  <ArrowRight size={14} className="opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/tracking"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline flex items-center gap-1.5"
                >
                  <span>Theo dõi tiến độ đơn hàng & lộ trình xe</span>
                  <ArrowRight size={14} className="opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/my-contracts"
                  className="text-slate-400 hover:text-blue-400 transition-colors no-underline flex items-center gap-1.5"
                >
                  <span>Tra cứu hợp đồng nguyên tắc B2B</span>
                  <ArrowRight size={14} className="opacity-60" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
          <p>© 2026 VTSC PaintPro — Công ty CP TMDV VOSCO. Mọi quyền được bảo lưu.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" /> Tiêu chuẩn AkzoNobel Interpon
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
