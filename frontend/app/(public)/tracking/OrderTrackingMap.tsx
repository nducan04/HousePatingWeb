'use client';

import React, { useState } from 'react';
import { MapPin, Truck, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/lib/utils/notification';

const mockTrackingHistory: any[] = [];

export default function OrderTrackingMap() {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [history, setHistory] = useState(mockTrackingHistory);

  // Admin form state
  const [currentLocation, setCurrentLocation] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [status, setStatus] = useState('Đang trung chuyển');

  const handleUpdate = () => {
    if (!currentLocation || !updateContent) return;
    
    const newEntry = {
      id: Date.now(),
      lat: 14.0583, // Mock new coordinate
      lng: 108.2772,
      time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      content: updateContent,
      status: 'current'
    };

    const updatedHistory = history.map(h => ({ ...h, status: 'completed' }));
    setHistory([newEntry, ...updatedHistory]);
    
    setCurrentLocation('');
    setUpdateContent('');
    toast.success('Đã cập nhật vị trí và trạng thái!');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Module Header & Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              Theo dõi Vận chuyển Đơn hàng
            </h1>
            <p className="text-sm text-slate-500 mt-1">Mã vận đơn: VN-987654321</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'customer' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Góc nhìn Khách hàng
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'admin' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Góc nhìn Admin
            </button>
          </div>
        </div>

        {/* Main Content Area: 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: MAP INTERFACE */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px] flex items-center justify-center">
              {/* Mock Map Background */}
              <div 
                className="absolute inset-0 z-0 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
              
              {/* Map Polyline & Icons SVG */}
              <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 400 400">
                {/* Hanoi to HCMC Polyline */}
                <path 
                  d="M 150 100 Q 200 200 120 300" 
                  fill="none" 
                  className="stroke-blue-600 stroke-4"
                  strokeDasharray="8 4"
                />
                
                {/* Hanoi Pin */}
                <circle cx="150" cy="100" r="6" className="fill-slate-400" />
                <text x="165" y="105" className="text-[10px] font-bold fill-slate-500">Hà Nội</text>
                
                {/* HCMC Pin */}
                <circle cx="120" cy="300" r="6" className="fill-slate-400" />
                <text x="135" y="305" className="text-[10px] font-bold fill-slate-500">TP. Hồ Chí Minh</text>
              </svg>

              {/* Truck Marker (Current Position) */}
              <div className="absolute z-20" style={{ top: '45%', left: '42%' }}>
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-2 bg-red-100 rounded-full animate-ping opacity-75"></div>
                  <div className="bg-red-600 text-white p-2 rounded-full shadow-lg relative z-10 flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    Đang trên đường đến...
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </div>

              {/* Admin Overlay Form (If Active Tab is Admin) */}
              {activeTab === 'admin' && (
                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-2xl p-5 border border-slate-100 z-30 animate-in slide-in-from-bottom-4">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-blue-600" />
                    Cập nhật Tọa độ & Trạng thái
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Vị trí hiện tại</label>
                      <input 
                        type="text" 
                        value={currentLocation}
                        onChange={e => setCurrentLocation(e.target.value)}
                        placeholder="VD: Trạm trung chuyển Đà Nẵng..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Nội dung cập nhật</label>
                      <textarea 
                        value={updateContent}
                        onChange={e => setUpdateContent(e.target.value)}
                        placeholder="VD: Kiện hàng đang được phân loại..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Trạng thái</label>
                      <select 
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Đã lấy hàng</option>
                        <option>Đang trung chuyển</option>
                        <option>Đang giao hàng</option>
                        <option>Đã giao thành công</option>
                      </select>
                    </div>
                    
                    <button 
                      onClick={handleUpdate}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
                    >
                      <MapPin size={18} />
                      Cập nhật Vị trí & Trạng thái
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Floating Info (Only in Customer Tab) */}
            {activeTab === 'customer' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <CheckCircle className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Giao hàng dự kiến</div>
                    <div className="text-emerald-600 font-black">Thứ Bảy, 23/05/2026</div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                  <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                    <Truck className="text-blue-600" size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Thông tin COD</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Hãy chuẩn bị sẵn <span className="font-bold text-rose-600">25.500đ</span> tiền mặt.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: TIMELINE (VERTICAL STEPPER) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="text-slate-400" size={20} />
              Lịch sử cập nhật
            </h3>
            
            <div className="relative pl-6">
              {/* Stepper Line */}
              <div className="absolute top-4 bottom-4 left-[11px] border-l-2 border-slate-200"></div>
              
              <div className="space-y-8">
                {history.map((item, index) => {
                  const isCurrent = index === 0;
                  
                  return (
                    <div key={item.id} className="relative">
                      {/* Node Circle */}
                      <div className={`absolute -left-[30px] w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        isCurrent ? 'border-emerald-500' : 'border-slate-300'
                      }`}>
                        {isCurrent && <CheckCircle size={20} className="text-emerald-500 absolute bg-white rounded-full" />}
                      </div>
                      
                      {/* Content */}
                      <div>
                        <div className={`text-sm ${isCurrent ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                          {item.content}
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-1.5">
                          {item.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
