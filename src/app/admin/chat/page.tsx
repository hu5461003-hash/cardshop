"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getChatSessions, getSessionMessages, addChatMessage, markSessionRead } from "@/lib/mock-data";
import { t } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/mock-data";

interface ChatSession {
  sessionId: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  visitorName: string;
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 轮询会话列表
  useEffect(() => {
    const loadSessions = () => {
      setSessions(getChatSessions());
    };
    loadSessions();
    const interval = setInterval(loadSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  // 轮询当前会话消息
  useEffect(() => {
    if (!activeSession) return;
    const loadMessages = () => {
      setMessages(getSessionMessages(activeSession));
    };
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectSession = (sessionId: string) => {
    setActiveSession(sessionId);
    markSessionRead(sessionId);
    // 立即刷新会话列表以更新未读数
    setSessions(getChatSessions());
  };

  const handleSend = () => {
    if (!input.trim() || !activeSession) return;
    addChatMessage({
      sessionId: activeSession,
      sender: "admin",
      senderName: "客服",
      message: input.trim(),
    });
    setInput("");
    setMessages(getSessionMessages(activeSession));
    setSessions(getChatSessions());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) + " " +
      date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-glass-border flex items-center justify-center">
          <MessageCircle size={20} className="text-light-3" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-light-3">{t("admin.chat.title")}</h1>
        </div>
      </div>

      {/* 聊天主体 */}
      <div className="glass-card rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* 左侧会话列表 */}
        <div className="w-[300px] border-r border-glass-border flex flex-col bg-dark-2/50">
          <div className="px-4 py-3 border-b border-glass-border">
            <p className="text-sm text-gray-4">
              {sessions.length === 0 ? "暂无会话" : `${sessions.length} 个会话`}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-4">
                <MessageCircle size={32} className="mb-3 opacity-40" />
                <p className="text-sm">暂无聊天会话</p>
              </div>
            )}
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => handleSelectSession(session.sessionId)}
                className={`w-full text-left px-4 py-3 border-b border-glass-border/50 transition-colors cursor-pointer ${
                  activeSession === session.sessionId
                    ? "bg-white/[0.06]"
                    : "hover:bg-glass-bg"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-light-3 truncate">
                    {session.visitorName}
                  </span>
                  <span className="text-[11px] text-gray-4 shrink-0 ml-2">
                    {formatTime(session.lastTime)}
                  </span>
                </div>
                <p className="text-xs text-gray-4 truncate">{session.lastMessage}</p>
                {session.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-medium mt-1">
                    {session.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧消息区域 */}
        <div className="flex-1 flex flex-col bg-dark-1/30">
          {activeSession ? (
            <>
              {/* 会话头部 */}
              <div className="px-5 py-3 border-b border-glass-border bg-dark-2/30">
                <p className="text-sm font-medium text-light-3">
                  {sessions.find(s => s.sessionId === activeSession)?.visitorName || "访客"}
                </p>
                <p className="text-[11px] text-gray-4 mt-0.5">
                  {activeSession}
                </p>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-4">
                    <MessageCircle size={32} className="mb-3 opacity-40" />
                    <p className="text-sm">暂无消息</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
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

              {/* 回复输入框 */}
              <div className="px-4 py-3 border-t border-glass-border bg-dark-2/30">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入回复消息..."
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-4">
              <MessageCircle size={48} className="mb-4 opacity-30" />
              <p className="text-sm">选择一个会话开始聊天</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}