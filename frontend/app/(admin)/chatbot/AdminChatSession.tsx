'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import api from '@/lib/utils/axiosAuth';
import { io, Socket } from 'socket.io-client';
import { Send, User as UserIcon, MessageSquare, Clock, Phone, AlertCircle, Search } from 'lucide-react';

export default function AdminChatSession({ preselectedCustomerId }: { preselectedCustomerId?: string | null }) {
  const { user } = useAuthStore();
  const userRole = user?.role || 'Guest';

  // State
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Setup Socket
  useEffect(() => {
    if (!user) return;
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('receive_message', (msg: any) => {
      setMessages(prev => {
        if (prev.find(m => m.timestamp === msg.timestamp && m.content === msg.content)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const [allCustomers, setAllCustomers] = useState<any[]>([]);

  // Fetch Sessions and Customers
  useEffect(() => {
    if (!user) return;
    
    // Fetch sessions
    api.get('/chat/sessions').then(res => {
      if (res.data.success) {
        setSessions(res.data.data);
      }
    }).catch(err => console.error("Error fetching sessions:", err));

    // Fetch all customers
    api.get('/khach-hang').then(res => {
      if (res.data.success) {
        setAllCustomers(res.data.data);
      }
    }).catch(err => console.error("Error fetching customers:", err));
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const unifiedSessions = React.useMemo(() => {
    const list: any[] = [...sessions];
    allCustomers.forEach(customer => {
      const exists = list.find(s => s.KhachHangID?._id === customer._id || s.KhachHangID === customer._id);
      if (!exists) {
        list.push({
          _id: `temp_${customer._id}`,
          isTemp: true,
          KhachHangID: customer,
          Messages: []
        });
      }
    });
    return list;
  }, [sessions, allCustomers]);

  const selectSession = (session: any) => {
    if (session.isTemp) {
      // Init real session
      api.post('/chat/sessions/init', { customerId: session.KhachHangID._id })
        .then(res => {
          if (res.data.success) {
            const newSession = res.data.data;
            setSessions(prev => [newSession, ...prev]);
            setActiveSession(newSession);
            setMessages(newSession.Messages || []);
            if (socket) socket.emit('join_chat', newSession._id);
          }
        })
        .catch(err => console.error("Error init session for customer:", err));
      return;
    }
    setActiveSession(session);
    setMessages(session.Messages || []);
    if (socket) socket.emit('join_chat', session._id);
  };

  useEffect(() => {
    if (preselectedCustomerId) {
      let session = unifiedSessions.find(s => s.KhachHangID?._id === preselectedCustomerId || s.KhachHangID === preselectedCustomerId);
      if (session) {
        selectSession(session);
      }
    }
  }, [preselectedCustomerId, unifiedSessions]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || !socket) return;

    const newMsg = {
      sessionId: activeSession._id,
      senderId: user?.id,
      senderRole: userRole,
      senderName: user?.username || 'User',
      content: input.trim()
    };

    socket.emit('send_message', newMsg);
    setInput('');
  };



  const filteredSessions = unifiedSessions.filter(s => {
    const term = searchTerm.toLowerCase();
    const name = s.KhachHangID?.TenKhachHang?.toLowerCase() || '';
    const phone = s.KhachHangID?.SoDienThoai?.toLowerCase() || '';
    return name.includes(term) || phone.includes(term);
  });

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col md:flex-row gap-6 p-2 w-full">
      <div className="w-full md:w-[350px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm khách hàng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSessions.map(session => {
            const isActive = activeSession?._id === session._id;
            const lastMsg = session.Messages?.[session.Messages?.length - 1];
            return (
              <div 
                key={session._id}
                onClick={() => selectSession(session)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold text-sm truncate pr-2 ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                    {session.KhachHangID?.TenKhachHang || 'Khách hàng ẩn danh'}
                  </h3>
                </div>
                <p className="text-xs truncate text-slate-500">
                  {lastMsg ? `${lastMsg.senderRole.includes('KhachHang') ? 'KH:' : 'Bạn:'} ${lastMsg.content}` : 'Chưa có tin nhắn'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">Chọn cuộc trò chuyện bên trái</div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800">{activeSession.KhachHangID?.TenKhachHang || 'Khách hàng'}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Phone size={12} /> {activeSession.KhachHangID?.SoDienThoai || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderRole !== 'KhachHangB2B' && msg.senderRole !== 'KhachHangB2C';
                
                // Format the time
                const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
                const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 px-1 flex items-center gap-1.5">
                      <Clock size={10} /> {timeStr} - {dateStr}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <button type="submit" disabled={!input.trim()} className="bg-blue-600 text-white px-5 rounded-xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
