'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import api from '@/lib/utils/axiosAuth';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, Clock, X, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getGuestSessionId } from "@/lib/store/cartStore";
import RouteMap from "@/app/(admin)/van-chuyen/RouteMap";

export default function CustomerLiveChat() {
  const { user } = useAuthStore();
  const userRole = user?.role || 'Guest';
  const isCustomer = userRole === 'KhachHangB2B' || userRole === 'KhachHangB2C';

  const [isOpen, setIsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Tab State
  const [chatTab, setChatTab] = useState<'cskh' | 'bot'>('cskh');

  // Bot State
  const [botMessage, setBotMessage] = useState('');
  const [sendingBot, setSendingBot] = useState(false);
  const [botHistory, setBotHistory] = useState<{ role: string; text: string }[]>([
    {
      role: "bot",
      text: "👋 Xin chào! Tôi là **VTSC PaintPro AI** - Trợ lý ảo chuyên gia về Sơn tĩnh điện & Sơn công nghiệp.\n\nTôi có thể giúp bạn:\n- Tư vấn chọn sơn theo vật liệu\n- Cung cấp giải pháp cho các bề mặt đặc thù\n- Theo dõi đơn hàng & tiến độ\n\nBạn đang quan tâm đến vấn đề gì?",
    },
  ]);
  const botMessagesEndRef = useRef<HTMLDivElement>(null);

  // Setup Socket & Session when opened
  useEffect(() => {
    if (!user || !isCustomer || !isOpen) return;

    if (!activeSession) {
      api.post('/chat/sessions/init').then(res => {
        if (res.data.success) {
          setActiveSession(res.data.data);
          setMessages(res.data.data.Messages || []);
        }
      }).catch(err => console.error(err));
    }

    if (!socket && activeSession) {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';
      const newSocket = io(socketUrl);
      setSocket(newSocket);
      newSocket.emit('join_chat', activeSession._id);

      newSocket.on('receive_message', (msg: any) => {
        setMessages(prev => {
          if (prev.find(m => m.timestamp === msg.timestamp && m.content === msg.content)) return prev;
          return [...prev, msg];
        });
      });
    }

    return () => {
      // Keep socket open if desired, but here we disconnect when chat is closed or unmounted
      if (!isOpen && socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [user, isCustomer, isOpen, activeSession, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || !socket) return;

    const newMsg = {
      sessionId: activeSession._id,
      senderId: user?._id,
      senderRole: userRole,
      senderName: user?.username || 'User',
      content: input.trim()
    };

    socket.emit('send_message', newMsg);
    setInput('');
  };

  useEffect(() => {
    if (isOpen && chatTab === 'bot') {
      botMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [botHistory, isOpen, chatTab, sendingBot]);

  const handleSendBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botMessage.trim() || sendingBot) return;

    const userMsg = botMessage;
    setBotMessage("");
    setBotHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setSendingBot(true);

    try {
      const sessionId = user?._id || getGuestSessionId();
      const res = await api.post("/chatbot/message", { sessionId, message: userMsg });
      if (res.data.success) {
        setBotHistory((prev) => [
          ...prev,
          { role: "bot", text: res.data.data.response },
        ]);
      } else {
        setBotHistory((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setBotHistory((prev) => [
        ...prev,
        { role: "bot", text: "Không thể kết nối với máy chủ AI. Vui lòng kiểm tra lại đường truyền." },
      ]);
    } finally {
      setSendingBot(false);
    }
  };

  const renderBotMessageContent = (text: string) => {
    const parts = text.split(/(\[MAP\|[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[MAP|') && part.endsWith(']')) {
        const data = part.slice(5, -1).split('|');
        const origin = data[0] || 'Nhà máy VTSC, Việt Nam';
        const destination = data[1] || 'Hà Nội, Việt Nam';
        const currentLocation = data[2] || '';
        
        return (
          <div key={index} className="h-[200px] w-full mt-2 mb-2 rounded-xl overflow-hidden shadow-inner border border-slate-200">
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

  if (!isCustomer) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-blue-600 rounded-t-2xl flex flex-col text-white shadow-md relative overflow-hidden">
          <div className="p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {chatTab === 'cskh' ? <MessageSquare size={20} /> : <Bot size={20} />}
              </div>
              <div>
                <h3 className="font-bold">{chatTab === 'cskh' ? 'CSKH VTSC' : 'VTSC PaintPro AI'}</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Luôn trực tuyến
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex border-t border-white/10 bg-blue-700/50 z-10">
            <button 
              onClick={() => setChatTab('cskh')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${chatTab === 'cskh' ? 'bg-white text-blue-600' : 'text-blue-100 hover:bg-white/10'}`}
            >
              <MessageSquare size={14} /> Hỗ trợ viên
            </button>
            <button 
              onClick={() => setChatTab('bot')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${chatTab === 'bot' ? 'bg-white text-blue-600' : 'text-blue-100 hover:bg-white/10'}`}
            >
              <Bot size={14} /> Trợ lý AI
            </button>
          </div>
        </div>

        {/* CSKH Tab Content */}
        {chatTab === 'cskh' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
              <div className="text-center text-xs text-slate-400 my-2">Hôm nay</div>
              {messages.map((msg, i) => {
                const isMe = msg.senderRole === 'KhachHangB2B' || msg.senderRole === 'KhachHangB2C';
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-[10px] mt-1 flex justify-end ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="submit" disabled={!input.trim()} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}

        {/* BOT Tab Content */}
        {chatTab === 'bot' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {botHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] shadow-sm bg-blue-600 text-white rounded-br-sm">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[90%] px-4 py-3 rounded-2xl text-[14px] shadow-sm bg-white text-slate-700 rounded-tl-sm border border-slate-200">
                      {renderBotMessageContent(msg.text)}
                    </div>
                  )}
                </div>
              ))}
              {sendingBot && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl shadow-sm text-blue-600 rounded-tl-sm border border-slate-200 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm text-slate-500">AI đang suy nghĩ...</span>
                  </div>
                </div>
              )}
              <div ref={botMessagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl">
              <form onSubmit={handleSendBot} className="flex gap-2">
                <input
                  type="text"
                  value={botMessage}
                  onChange={(e) => setBotMessage(e.target.value)}
                  placeholder="Hỏi trợ lý AI..."
                  disabled={sendingBot}
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="submit" disabled={!botMessage.trim() || sendingBot} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
