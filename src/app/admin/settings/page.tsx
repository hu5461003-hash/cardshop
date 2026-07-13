"use client";

import { useState, useEffect } from "react";
import { Save, Globe, Megaphone, Headphones, Search, Check, RotateCcw, Shield, Image } from "lucide-react";
import { t } from "@/lib/i18n";
import { getSettings, updateSettings, resetStore } from "@/lib/mock-data";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [seoMetaTitle, setSeoMetaTitle] = useState("");
  const [seoMetaKeywords, setSeoMetaKeywords] = useState("");
  const [seoMetaDescription, setSeoMetaDescription] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [supportLink, setSupportLink] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [faviconUploading, setFaviconUploading] = useState(false);

  useEffect(() => {
    const s = getSettings();
    setSiteName(s.siteName); setSiteDescription(s.siteDescription); setCustomDomain(s.customDomain);
    setSeoMetaTitle(s.seoMetaTitle); setSeoMetaKeywords(s.seoMetaKeywords); setSeoMetaDescription(s.seoMetaDescription);
    setAnnouncement(s.announcement); setSupportLink(s.supportLink); setSupportEmail(s.supportEmail);
    setAdminUsername(s.adminUsername); setAdminPassword(s.adminPassword);
    setFaviconUrl(s.faviconUrl || "");
  }, []);

  const handleSave = () => {
    updateSettings({
      siteName, siteDescription, customDomain,
      seoMetaTitle, seoMetaKeywords, seoMetaDescription,
      announcement, supportLink, supportEmail, faviconUrl,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024) {
      alert("图标文件不能超过 100KB");
      return;
    }
    setFaviconUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const res = await fetch("/api/admin/settings/favicon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faviconUrl: base64 }),
        });
        const data = await res.json();
        if (data.success) {
          setFaviconUrl(base64);
          // 更新页面 favicon
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) link.href = base64;
        } else {
          alert(data.message || "上传失败");
        }
      } catch {
        alert("上传失败");
      } finally {
        setFaviconUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePassword = async () => {
    if (!adminUsername || !adminPassword) return;
    if (adminUsername.length < 3 || adminPassword.length < 6) {
      alert("用户名至少3位，密码至少6位");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSaved(true);
        setTimeout(() => {
          setPasswordSaved(false);
          // 密码更新成功后跳转到登录页
          window.location.href = "/admin/login";
        }, 1500);
      } else {
        alert(data.message || "更新失败");
      }
    } catch {
      alert("更新失败");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleReset = () => {
    resetStore();
    setShowReset(false);
    window.location.reload();
  };

  return (
    <div className="animate-fade-in">
      {saved && (<div className="fixed top-4 right-4 z-50 glass-card px-4 py-3 flex items-center gap-2 animate-fade-in"><Check size={16} className="text-success" /><span className="text-sm text-light-3">{t("common.saved")}</span></div>)}

      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-light-3 mb-1">{t("admin.settings.title")}</h1><p className="text-sm text-gray-3">{t("admin.settings.desc")}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowReset(true)} className="btn-ghost text-sm flex items-center gap-2 text-error"><RotateCcw size={14} /> 重置数据</button>
          <button onClick={handleSave} className="btn-primary text-sm flex items-center gap-2">{saved ? t("common.saved") : <><Save size={14} /> {t("common.saveChanges")}</>}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-base font-medium text-light-3 mb-6 flex items-center gap-2"><Globe size={16} className="text-gray-4" /> {t("admin.settings.general")}</h2>
          <div className="space-y-4">
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.siteName")}</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="input-premium" /></div>
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.siteDescription")}</label><input type="text" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className="input-premium" /></div>
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.customDomain")}</label><input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder={t("admin.settings.customDomainPlaceholder")} className="input-premium" /><p className="text-xs text-gray-4 mt-1">{t("admin.settings.customDomainHint")}</p></div>
            {/* Favicon 上传 */}
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">网站图标 (Favicon)</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg border border-glass-border bg-dark-1 flex items-center justify-center overflow-hidden">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="favicon" className="w-full h-full object-cover" />
                  ) : (
                    <Image size={20} className="text-gray-4" />
                  )}
                </div>
                <div className="flex-1">
                  <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-glass-border text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer ${faviconUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {faviconUploading ? "上传中..." : "选择图片"}
                    <input type="file" accept="image/png,image/svg+xml,image/x-icon,image/gif" onChange={handleFaviconUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-4 mt-1">支持 PNG/SVG/ICO，不超过 100KB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-base font-medium text-light-3 mb-6 flex items-center gap-2"><Search size={16} className="text-gray-4" /> {t("admin.settings.seo")}</h2>
          <div className="space-y-4">
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.metaTitle")}</label><input type="text" value={seoMetaTitle} onChange={(e) => setSeoMetaTitle(e.target.value)} className="input-premium" /></div>
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.metaKeywords")}</label><input type="text" value={seoMetaKeywords} onChange={(e) => setSeoMetaKeywords(e.target.value)} className="input-premium" /></div>
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.metaDescription")}</label><textarea value={seoMetaDescription} onChange={(e) => setSeoMetaDescription(e.target.value)} className="input-premium h-20 resize-none" /></div>
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-base font-medium text-light-3 mb-6 flex items-center gap-2"><Megaphone size={16} className="text-gray-4" /> {t("admin.settings.announcement")}</h2>
          <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.bannerText")}</label><textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="input-premium h-20 resize-none" /><p className="text-xs text-gray-4 mt-1">{t("admin.settings.bannerHint")}</p></div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-base font-medium text-light-3 mb-6 flex items-center gap-2"><Headphones size={16} className="text-gray-4" /> {t("admin.settings.support")}</h2>
          <div className="space-y-4">
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.supportLink")}</label><input type="text" value={supportLink} onChange={(e) => setSupportLink(e.target.value)} className="input-premium" /><p className="text-xs text-gray-4 mt-1">{t("admin.settings.supportLinkHint")}</p></div>
            <div><label className="block text-xs text-gray-4 mb-1.5">{t("admin.settings.supportEmail")}</label><input type="text" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="input-premium" /></div>
          </div>
        </div>
        {/* 管理员账号设置 */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-light-3 flex items-center gap-2">
              <Shield size={16} className="text-gray-4" /> 管理员账号
            </h2>
            <button onClick={handleSavePassword} disabled={passwordSaving} className="btn-primary text-sm flex items-center gap-2">
              {passwordSaved ? <><Check size={14} /> 已更新</> : passwordSaving ? "保存中..." : <><Save size={14} /> 保存账号</>}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">管理员用户名</label>
              <input type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className="input-premium" />
            </div>
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">管理员密码</label>
              <input type="text" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="input-premium" />
            </div>
          </div>
          <p className="text-xs text-gray-4 mt-3">⚠️ 修改后需要重新登录。请牢记新密码。</p>
        </div>
      </div>

      {/* Reset Confirm */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowReset(false)} />
          <div className="relative w-full max-w-sm bg-dark-2 border border-glass-border rounded-2xl shadow-lg p-6 animate-fade-in">
            <h3 className="text-lg font-medium text-light-3 mb-2">确认重置</h3>
            <p className="text-sm text-gray-3 mb-6">将清除所有数据并恢复为默认演示数据，此操作不可撤销。</p>
            <div className="flex justify-end gap-3"><button onClick={() => setShowReset(false)} className="btn-ghost text-sm">{t("common.cancel")}</button><button onClick={handleReset} className="btn-primary text-sm !bg-error hover:!bg-red-600">确认重置</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
