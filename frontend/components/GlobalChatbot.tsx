"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, X, Send, MessageSquare, Loader2 } from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { getGuestSessionId } from "@/lib/store/cartStore";
import RouteMap from "@/app/(admin)/van-chuyen/RouteMap";

export default function GlobalChatbot() {
  const { user } = useAuthStore();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([
    {
      role: "bot",
      text: "👋 Xin chào! Tôi là **VTSC PaintPro AI** - Trợ lý ảo chuyên gia về Sơn tĩnh điện & Sơn công nghiệp.\n\nTôi có thể giúp bạn:\n- Tư vấn chọn sơn theo vật liệu (Nhôm, Gỗ, Bê tông...)\n- Cung cấp giải pháp cho các bề mặt đặc thù (Chịu nhiệt, Tàu biển)\n- Theo dõi đơn hàng & tiến độ (Sắp ra mắt)\n\nBạn đang quan tâm đến vấn đề gì?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isChatOpen, sendingChat]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setSendingChat(true);

    try {
      const sessionId = user?.id || getGuestSessionId();
      const res = await api.post("/chatbot/message", { sessionId, message: userMsg });
      if (res.data.success) {
        setChatHistory((prev) => [
          ...prev,
          { role: "bot", text: res.data.data.response },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", text: "Không thể kết nối với máy chủ AI. Vui lòng kiểm tra lại đường truyền." },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  const renderMessageContent = (text: string) => {
    // Regex chia text thành mảng, giữ lại các block [MAP|...]
    const parts = text.split(/(\[MAP\|[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[MAP|') && part.endsWith(']')) {
        const data = part.slice(5, -1).split('|');
        const origin = data[0] || 'Nhà máy VTSC, Việt Nam';
        const destination = data[1] || 'Hà Nội, Việt Nam';
        const currentLocation = data[2] || '';
        
        return (
          <div key={index} className="h-[300px] w-full mt-4 mb-2 rounded-xl overflow-hidden shadow-inner border border-slate-200">
            <RouteMap origin={origin} destination={destination} currentLocation={currentLocation} />
          </div>
        );
      }
      return (
        <div key={index} className="prose prose-sm max-w-none prose-img:m-0 prose-p:m-0 prose-p:leading-relaxed prose-headings:text-slate-800 prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        </div>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isChatOpen && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[400px] h-[600px] mb-6 border border-white/50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300 transform origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-5 flex justify-between items-center shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 backdrop-blur-md shadow-inner">
                <Bot size={28} />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg leading-tight tracking-wide">VTSC PaintPro AI</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <p className="text-blue-100 text-xs font-medium">Trực tuyến</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white/90 flex items-center justify-center transition-all z-10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth custom-scrollbar">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[85%] px-5 py-3.5 rounded-2xl text-[14.5px] shadow-sm leading-relaxed bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-[90%] px-5 py-4 rounded-2xl text-[14px] shadow-sm leading-relaxed bg-white text-slate-700 rounded-tl-sm border border-slate-100/60">
                    {renderMessageContent(msg.text)}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {sendingChat && (
              <div className="flex justify-start">
                <div className="bg-white px-5 py-4 rounded-2xl shadow-sm text-blue-600 rounded-tl-sm border border-slate-100/60 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm font-medium text-slate-500">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendChat}
            className="p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/60 flex gap-3"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 bg-slate-100/80 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500/50 border-none rounded-xl px-5 py-3.5 text-sm font-medium outline-none transition-all shadow-inner"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              disabled={sendingChat}
            />
            <button
              type="submit"
              disabled={!chatMessage.trim() || sendingChat}
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.5)] hover:-translate-y-1 transition-all duration-300 relative group"
      >
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
        {isChatOpen ? (
          <X size={28} className="relative z-10" />
        ) : (
          <MessageSquare size={28} className="relative z-10 animate-in zoom-in" />
        )}
        
        {/* Notification dot */}
        {!isChatOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
        )}
      </button>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.5);
        }
      `}} />
    </div>
  );
}
