"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { getChatMessages, addChatMessage, getSessionMessages } from "@/lib/mock-data";
import type { ChatMessage } from "@/lib/mock-data";

const SESSION_KEY = "cardshop_visitor_session";
const VISITOR_NAME_KEY = "cardshop_visitor_name";

export default function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [visitorName, setVisitorName] = useState("访客");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = "v_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
      localStorage.setItem(SESSION_KEY, sid);
    }
    setSessionId(sid);
    const name = localStorage.getItem(VISITOR_NAME_KEY) || "访客";
    setVisitorName(name);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const loadMessages = () => {
      setMessages(getSessionMessages(sessionId));
    };
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !sessionId) return;
    addChatMessage({ sessionId, sender: "visitor", senderName: visitorName, message: input.trim() });
    setInput("");
    setMessages(getSessionMessages(sessionId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-white shadow-lg shadow-black/20 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer group"
        >
          <MessageCircle size={24} className="text-black" />
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[480px] bg-dark-2 border border-glass-border rounded-2xl shadow-2xl shadow-black/40 flex flex-col animate-fade-in overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border bg-dark-1/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-light-3">任何问题请联系客服</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle size={32} className="mx-auto text-gray-4 mb-3" />
                <p className="text-sm text-gray-4">您好！有什么可以帮您的？</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "visitor"
                    ? "bg-white text-black rounded-br-md"
                    : "bg-dark-3 text-light-3 rounded-bl-md border border-glass-border"
                }`}>
                  <p>{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === "visitor" ? "text-gray-500" : "text-gray-4"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="px-4 py-3 border-t border-glass-border bg-dark-1/50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                className="flex-1 bg-dark-3 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-light-3 placeholder:text-gray-4 focus:outline-none focus:border-white/20 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}