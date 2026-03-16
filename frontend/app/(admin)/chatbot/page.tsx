'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Info } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Xin chào! Tôi là trợ lý AI chuyên môn của VTSC. Tôi có thể giúp bạn tra cứu thông tin sản phẩm sơn tĩnh điện Akzonobel, quy trình R&D, và bảng thông số an toàn (MSDS). Bạn cần hỗ trợ gì hôm nay?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate simple session ID for prototype
    const sid = localStorage.getItem('vtsc_chat_session') || `session_${Date.now()}`;
    localStorage.setItem('vtsc_chat_session', sid);
    setSessionId(sid);
    
    // Load history
    fetch(`http://localhost:5000/api/chatbot/history/${sid}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const loadedMessages = data.data.map((msg: any, i: number) => ({
            id: `msg-${i}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }));
          
          setMessages([
             {
              id: 'welcome',
              role: 'model',
              content: 'Xin chào! Tôi là trợ lý AI chuyên môn của VTSC. Tôi có thể giúp bạn tra cứu thông tin sản phẩm sơn tĩnh điện Akzonobel, quy trình R&D, và bảng thông số an toàn (MSDS). Bạn cần hỗ trợ gì hôm nay?',
              timestamp: new Date()
            },
            ...loadedMessages
          ]);
        }
      })
      .catch(err => console.error('Failed to load chat history:', err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to UI immediately
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: data.data.response,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `❌ Lỗi: ${error.message || 'Không thể kết nối đến máy chủ AI.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card h-[calc(100vh-140px)] flex flex-col p-0 overflow-hidden border-0" style={{ boxShadow: 'var(--shadow-lg)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] p-6 text-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Bot size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1 shadow-sm">Trợ lý AI Hỗ trợ Khách hàng</h2>
            <p className="text-white/80 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Luôn sẵn sàng trả lời 24/7 về MSDS & Akzonobel
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2">
            <Info size={14} /> Đoạn chat được bảo mật bằng mã hóa
          </div>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md' 
                : 'bg-white shadow-sm border border-slate-200'
            }`}>
              {msg.role === 'user' ? (
                <UserIcon size={20} className="text-white" />
              ) : (
                <Bot size={22} className="text-[var(--accent-cyan)]" />
              )}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`p-4 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}
                style={{ fontSize: '0.95rem' }}
              >
                {msg.content}
              </div>
              <span className="text-xs text-slate-400 mt-2 font-medium">
                {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                {msg.role === 'model' && ' • AI Trả lời'}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="shrink-0 w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center">
              <Bot size={22} className="text-[var(--accent-cyan)]" />
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-[var(--accent-purple)]" />
              <span className="text-slate-500 font-medium text-sm">AI đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form 
          onSubmit={handleSubmit}
          className="relative max-w-4xl mx-auto flex items-end gap-3 bg-slate-50 border border-slate-300 rounded-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-[var(--accent-cyan)] focus-within:border-transparent shadow-sm"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
               if(e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSubmit(e);
               }
            }}
            placeholder="Nhập câu hỏi của bạn về sơn Akzonobel, mã màu, độ sấy, hoặc MSDS..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-2.5 px-3 text-slate-700 placeholder:text-slate-400"
            rows={1}
            style={{ fontSize: '0.95rem' }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className={`shrink-0 p-3 rounded-xl flex items-center justify-center transition-all ${
              !input.trim() || isLoading
                ? 'bg-slate-200 text-slate-400' 
                : 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-3 font-medium">
          Mô hình AI có thể mắc sai sót. Vui lòng kiểm tra lại các thông số kỹ thuật quan trọng.
        </p>
      </div>
    </div>
  );
}
