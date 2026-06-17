"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // assuming the project uses this, otherwise fallback to alert

export default function ContractDebtManager({ contractId }: { contractId: string }) {
  const [debtInfo, setDebtInfo] = useState({ tong_gia_tri: 0, da_thanh_toan: 0, cong_no_con_lai: 0, lich_su: [] });

  const fetchDebtData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/thanh-toan/contracts/${contractId}/debt`);
      if (res.data.success) {
        setDebtInfo(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi lấy dữ liệu công nợ:", err);
    }
  };

  useEffect(() => {
    if (contractId) fetchDebtData();
  }, [contractId]);

  const formatVND = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-slate-50/50 rounded-2xl border border-slate-200 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng giá trị hợp đồng</p>
          <p className="text-xl lg:text-2xl font-black text-slate-800 break-words">{formatVND(debtInfo.tong_gia_tri)}</p>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <p className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Đã thanh toán</p>
          <p className="text-xl lg:text-2xl font-black text-emerald-600 break-words">{formatVND(debtInfo.da_thanh_toan)}</p>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-rose-100 bg-rose-50/30 flex flex-col justify-center">
          <p className="text-xs lg:text-sm font-bold text-rose-500 uppercase tracking-wider mb-2">Nợ còn lại</p>
          <p className="text-xl lg:text-2xl font-black text-rose-600 break-words">{formatVND(debtInfo.cong_no_con_lai)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Lịch sử thanh toán</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-sm font-bold text-slate-500">Mã Giao Dịch</th>
              <th className="p-4 text-sm font-bold text-slate-500">Số Tiền</th>
              <th className="p-4 text-sm font-bold text-slate-500">Phương Thức</th>
              <th className="p-4 text-sm font-bold text-slate-500">Ngày TT</th>
              <th className="p-4 text-sm font-bold text-slate-500">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {debtInfo.lich_su?.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Chưa có giao dịch nào</td></tr>
            ) : (
              debtInfo.lich_su?.map((p: any) => (
                <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-700">{p.MaGiaoDich}</td>
                  <td className="p-4 font-black text-slate-900">{formatVND(p.SoTien)}</td>
                  <td className="p-4 font-medium text-slate-600">{p.PhuongThucThanhToan}</td>
                  <td className="p-4 text-slate-500 text-sm">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      {p.TrangThai}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
