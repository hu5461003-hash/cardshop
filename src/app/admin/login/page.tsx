"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";

const ADMIN_TOKEN = "cs_admin_2024_secure";
const COOKIE_NAME = "cardshop_admin_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 天

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 模拟验证（生产环境应调用后端 API）
    if (username === "admin" && password === "admin123") {
      // 设置认证 cookie
      document.cookie = `${COOKIE_NAME}=${ADMIN_TOKEN};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
      router.push("/admin");
    } else {
      setError(t("admin.login.error"));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-dark-1">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-lg">CS</span>
          </div>
          <h1 className="text-xl font-bold text-light-3 mb-1">{t("admin.login.title")}</h1>
          <p className="text-sm text-gray-3">{t("admin.login.desc")}</p>
        </div>
        <div className="glass-card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">{t("admin.login.username")}</label>
              <div className="relative">
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" className="input-premium pl-10" />
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-3" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">{t("admin.login.password")}</label>
              <div className="relative">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-premium pl-10" />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-3" />
              </div>
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "登录中..." : <>{t("admin.login.submit")} <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
        <p className="text-xs text-gray-4 text-center mt-4">{t("admin.login.demo")}</p>
      </div>
    </div>
  );
}
