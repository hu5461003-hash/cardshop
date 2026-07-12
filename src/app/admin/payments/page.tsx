"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Smartphone,
  Wallet,
  Bitcoin,
  Plus,
  ToggleLeft,
  ToggleRight,
  Save,
  Check,
  Globe,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { t } from "@/lib/i18n";
import {
  getPaymentChannels,
  updatePaymentChannel,
  togglePaymentChannel,
  createPaymentChannel,
  deletePaymentChannel,
  getSettings,
  updateSettings,
  type PaymentChannel,
} from "@/lib/mock-data";
import Modal from "@/components/ui/modal";

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone size={20} />,
  Wallet: <Wallet size={20} />,
  CreditCard: <CreditCard size={20} />,
  Bitcoin: <Bitcoin size={20} />,
};

const channelTemplates = [
  { name: "微信支付", code: "wechat" as const, icon: "Smartphone", config: { mchId: "", appId: "", apiKey: "", apiV3Key: "", notifyUrl: "", description: "微信支付商户号、APPID、API密钥" } },
  { name: "支付宝", code: "alipay" as const, icon: "Wallet", config: { appId: "", privateKey: "", alipayPublicKey: "", notifyUrl: "", description: "支付宝应用APPID、商户私钥、支付宝公钥" } },
  { name: "Stripe (信用卡)", code: "stripe" as const, icon: "CreditCard", config: { publishableKey: "", secretKey: "", webhookSecret: "", currency: "usd", description: "Stripe 发布密钥、密钥、Webhook 密钥" } },
  { name: "USDT-TRC20", code: "crypto" as const, icon: "Bitcoin", config: { walletAddress: "", network: "TRC20", confirmations: "3", description: "USDT 收款钱包地址、网络、确认数" } },
];

const configLabels: Record<string, Record<string, string>> = {
  wechat: { mchId: "商户号 (Mch ID)", appId: "应用 APPID", apiKey: "API 密钥", apiV3Key: "APIv3 密钥", notifyUrl: "回调通知 URL", description: "说明" },
  alipay: { appId: "应用 APPID", privateKey: "商户私钥", alipayPublicKey: "支付宝公钥", notifyUrl: "回调通知 URL", description: "说明" },
  stripe: { publishableKey: "发布密钥 (Public)", secretKey: "密钥 (Secret)", webhookSecret: "Webhook 密钥", currency: "货币", description: "说明" },
  crypto: { walletAddress: "收款钱包地址", network: "网络", confirmations: "确认数", description: "说明" },
};

export default function PaymentsPage() {
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editConfigs, setEditConfigs] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({});

  const loadData = () => {
    setChannels(getPaymentChannels());
    setSettings(getSettings());
    const configs: Record<string, Record<string, string>> = {};
    getPaymentChannels().forEach((ch) => { configs[ch.id] = { ...ch.config }; });
    setEditConfigs(configs);
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string) => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleSave = (channelId: string) => {
    const config = editConfigs[channelId];
    if (!config) return;
    updatePaymentChannel(channelId, { config });
    showToast("保存成功");
  };

  const handleSaveAll = () => {
    channels.forEach((ch) => {
      const config = editConfigs[ch.id];
      if (config) updatePaymentChannel(ch.id, { config });
    });
    showToast("全部保存成功");
  };

  const handleToggle = (id: string) => {
    togglePaymentChannel(id);
    loadData();
  };

  const handleAdd = (template: typeof channelTemplates[0]) => {
    createPaymentChannel({
      name: template.name,
      code: template.code,
      icon: template.icon,
      isActive: true,
      sortOrder: channels.length + 1,
      config: { ...template.config } as unknown as Record<string, string>,
    });
    setShowAdd(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    deletePaymentChannel(id);
    setDeleteConfirm(null);
    loadData();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfigChange = (channelId: string, key: string, value: string) => {
    setEditConfigs((prev) => ({
      ...prev,
      [channelId]: { ...prev[channelId], [key]: value },
    }));
  };

  const domain = settings.customDomain || "zap534.site";

  return (
    <div className="animate-fade-in">
      {saved && (
        <div className="fixed top-4 right-4 z-50 glass-card px-4 py-3 flex items-center gap-2 animate-fade-in">
          <Check size={16} className="text-success" /><span className="text-sm text-light-3">保存成功</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-light-3 mb-1">{t("admin.payments.title")}</h1>
          <p className="text-sm text-gray-3">配置支付通道和收款参数</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveAll} className="btn-primary text-sm flex items-center gap-2"><Save size={14} /> 保存全部</button>
          <button onClick={() => setShowAdd(true)} className="btn-secondary text-sm flex items-center gap-2"><Plus size={14} /> 添加通道</button>
        </div>
      </div>

      {/* Domain Info Banner */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-white/[0.04] text-gray-4"><Globe size={20} /></div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-light-3 mb-2">站点域名</h3>
            <div className="flex items-center gap-3 mb-3">
              <code className="text-sm text-light-3 bg-dark-3 px-3 py-1.5 rounded-lg font-mono">https://{domain}</code>
              <button onClick={() => handleCopy(domain, "domain")} className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer">
                {copied === "domain" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-4">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Webhook 回调地址：https://{domain}/api/payments/notify
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-4">
                <Info size={12} />
                部署后需在支付平台配置回调 URL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Channel Cards */}
      <div className="space-y-4">
        {channels.map((channel) => {
          const isExpanded = expandedId === channel.id;
          const labels = configLabels[channel.code] || {};
          const config = editConfigs[channel.id] || {};

          return (
            <div key={channel.id} className="glass-card overflow-hidden">
              {/* Channel Header */}
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${channel.isActive ? "bg-white/[0.06]" : "bg-dark-3"} text-gray-4`}>
                    {iconMap[channel.icon] || <CreditCard size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-light-3">{channel.name}</h3>
                    <p className="text-xs text-gray-4 mt-0.5">
                      {channel.code.toUpperCase()} {channel.isActive ? "· 已启用" : "· 已禁用"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggle(channel.id)} className="text-gray-4 hover:text-light-3 cursor-pointer">
                    {channel.isActive ? <ToggleRight size={24} className="text-success" /> : <ToggleLeft size={24} />}
                  </button>
                  <button onClick={() => setExpandedId(isExpanded ? null : channel.id)} className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <button onClick={() => setDeleteConfirm(channel.id)} className="p-1.5 rounded-lg text-gray-4 hover:text-error hover:bg-error/10 transition-colors cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded Config */}
              {isExpanded && (
                <div className="border-t border-glass-border p-6 animate-fade-in">
                  <div className="space-y-4">
                    {Object.entries(labels).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-4 mb-1.5">{label}</label>
                        {key === "description" ? (
                          <p className="text-xs text-gray-3">{config[key] || ""}</p>
                        ) : (
                          <input
                            type="text"
                            value={config[key] || ""}
                            onChange={(e) => handleConfigChange(channel.id, key, e.target.value)}
                            className="input-premium font-mono text-xs"
                            placeholder={`请输入${label}`}
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <button onClick={() => handleSave(channel.id)} className="btn-primary text-sm">保存</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Channel Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="添加支付通道" maxWidth="max-w-md">
        <div className="space-y-3">
          {channelTemplates.map((tpl) => (
            <button
              key={tpl.code}
              onClick={() => handleAdd(tpl)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-glass-border hover:bg-white/[0.03] hover:border-white/15 transition-colors text-left cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-dark-3 text-gray-4">
                {iconMap[tpl.icon] || <CreditCard size={20} />}
              </div>
              <div>
                <p className="text-sm text-light-3">{tpl.name}</p>
                <p className="text-xs text-gray-4">{tpl.code.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="确认删除" maxWidth="max-w-sm">
        <p className="text-sm text-gray-3 mb-6">确定要删除这个支付通道吗？</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-sm">{t("common.cancel")}</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-primary text-sm !bg-error hover:!bg-red-600">{t("common.delete")}</button>
        </div>
      </Modal>
    </div>
  );
}
