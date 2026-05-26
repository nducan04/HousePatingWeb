'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  HelpCircle 
} from 'lucide-react';

export default function NotificationContainer() {
  const { 
    toasts, 
    removeToast, 
    confirmState, 
    respondConfirm, 
    promptState, 
    respondPrompt 
  } = useNotificationStore();

  const [promptValue, setPromptValue] = useState('');
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Set default prompt value when prompt opens
  useEffect(() => {
    if (promptState.isOpen) {
      setPromptValue(promptState.defaultValue || '');
      setTimeout(() => {
        promptInputRef.current?.focus();
        promptInputRef.current?.select();
      }, 50);
    }
  }, [promptState.isOpen, promptState.defaultValue]);

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((toast) => {
          let Icon = Info;
          let colorClass = '';

          switch (toast.type) {
            case 'success':
              Icon = CheckCircle2;
              colorClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
              break;
            case 'error':
              Icon = AlertCircle;
              colorClass = 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400';
              break;
            case 'warning':
              Icon = AlertTriangle;
              colorClass = 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
              break;
            case 'info':
            default:
              Icon = Info;
              colorClass = 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400';
              break;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 transform translate-x-0 animate-[slide-in_0.3s_ease-out] ${colorClass}`}
              role="alert"
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-semibold break-words leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-800/30 shadow-2xl rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 animate-[scale-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {confirmState.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {confirmState.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => respondConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => respondConfirm(true)}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 rounded-xl transition-colors cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptState.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-800/30 shadow-2xl rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 animate-[scale-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {promptState.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {promptState.message}
                </p>
                <input
                  ref={promptInputRef}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') respondPrompt(promptValue);
                    if (e.key === 'Escape') respondPrompt(null);
                  }}
                  className="w-full mt-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-slate-100 text-sm font-semibold transition-all"
                  placeholder="Nhập thông tin tại đây..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => respondPrompt(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => respondPrompt(promptValue)}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 rounded-xl transition-colors cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
