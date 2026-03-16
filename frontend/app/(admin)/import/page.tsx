'use client';

import { useState, useRef } from 'react';
import { FileUp, FileType, CheckCircle2, AlertCircle, X, DownloadCloud } from 'lucide-react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [collection, setCollection] = useState('customers');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    totalProcessed?: number;
    insertedCount?: number;
    errorCount?: number;
    errors?: string[];
    message?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      setResult({
        success: false,
        message: 'Định dạng file không hỗ trợ. Vui lòng chọn .xlsx, .xls, hoặc .csv'
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', collection);

    try {
      const response = await fetch('http://localhost:5000/api/files/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          ...data.data
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra khi upload file');
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <DownloadCloud className="text-[var(--accent-purple)]" />
          Import Dữ liệu từ Excel/CSV
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Loại Dữ Liệu</label>
            <div className="space-y-3">
              {[
                { id: 'customers', label: 'Khách hàng', icon: '🏢' },
                { id: 'products', label: 'Sản phẩm', icon: '🎨' },
                { id: 'targets', label: 'Mục tiêu Doanh số', icon: '📈' },
              ].map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setCollection(item.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                    collection === item.id 
                      ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan-soft)] ring-1 ring-[var(--accent-cyan)] shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className={`font-medium ${collection === item.id ? 'text-[var(--accent-cyan)]' : 'text-slate-700'}`}>
                    Danh sách {item.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="font-medium text-sm text-slate-700 mb-2">Template Mẫu</h4>
              <p className="text-xs text-slate-500 mb-3">Tải file mẫu để đảm bảo định dạng cột chuẩn xác trước khi import.</p>
              <button className="text-xs font-semibold text-[var(--accent-cyan)] hover:underline flex items-center gap-1">
                <FileType size={14} /> Tải file mẫu {collection}.xlsx
              </button>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Tải Lên File</label>
            
            {/* Drop Zone */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                isDragging 
                  ? 'border-[var(--accent-purple)] bg-[var(--accent-purple-soft)] scale-[1.02]' 
                  : file 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              style={{ minHeight: '300px', cursor: file ? 'default' : 'pointer' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInput} 
                className="hidden" 
                accept=".xlsx,.xls,.csv" 
              />
              
              {file ? (
                <div className="w-full flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">{file.name}</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                      disabled={isLoading}
                    >
                      Hủy File
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      className="px-6 py-2 bg-[var(--accent-purple)] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <FileUp size={16} /> Tiến hành Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                    <FileUp size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">Kéo & Thả file vào đây</h3>
                  <p className="text-sm text-slate-500 font-medium">hoặc click để chọn file từ máy tính</p>
                  <p className="text-xs text-slate-400 mt-4">Hỗ trợ: .xlsx, .xls, .csv (Tối đa 10MB)</p>
                </>
              )}
            </div>

            {/* Results Area */}
            {result && (
              <div className={`mt-6 p-6 rounded-xl border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                {result.success ? (
                  <div>
                    <h3 className="text-green-800 font-bold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="text-green-500" />
                      Import Thành Công
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100 text-center">
                        <div className="text-xs text-slate-500 font-medium mb-1">Tổng Số Dòng</div>
                        <div className="text-xl font-bold text-slate-800">{result.totalProcessed}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100 text-center">
                        <div className="text-xs text-slate-500 font-medium mb-1">Lưu Thành Công</div>
                        <div className="text-xl font-bold text-green-600">{result.insertedCount}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100 text-center">
                        <div className="text-xs text-slate-500 font-medium mb-1">Lỗi / Bỏ Qua</div>
                        <div className="text-xl font-bold text-red-500">{result.errorCount}</div>
                      </div>
                    </div>
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-4 border-t border-green-200 pt-3">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Chi tiết các lỗi vòng lặp (Max 10):</p>
                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto pr-2">
                          {result.errors.map((err, i) => (
                            <li key={i} className="flex gap-2 items-start opacity-90">
                              <X size={12} className="shrink-0 mt-0.5" /> <span>{err}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
                      <AlertCircle className="text-red-500" />
                      Import Thất Bại
                    </h3>
                    <p className="text-sm text-red-600 font-medium">{result.message}</p>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
