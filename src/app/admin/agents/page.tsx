"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Check,
} from "lucide-react";
import {
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  toggleAgentStatus,
} from "@/lib/mock-data";
import type { Agent } from "@/lib/mock-data";
import Modal from "@/components/ui/modal";

// ============================================
// 表单类型
// ============================================
interface AgentFormData {
  name: string;
  username: string;
  password: string;
  contactInfo: string;
  commissionRate: number;
}

const emptyFormData: AgentFormData = {
  name: "",
  username: "",
  password: "",
  contactInfo: "",
  commissionRate: 10,
};

export default function AgentsPage() {
  // ============================================
  // 状态管理
  // ============================================
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [addForm, setAddForm] = useState<AgentFormData>(emptyFormData);
  const [editForm, setEditForm] = useState<AgentFormData>(emptyFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // ============================================
  // 数据加载
  // ============================================
  const loadData = () => {
    setAgents(getAgents());
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================
  // Toast 提示
  // ============================================
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ============================================
  // 复制到剪贴板
  // ============================================
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast("已复制到剪贴板");
    });
  };

  // ============================================
  // 添加代理
  // ============================================
  const handleAdd = () => {
    if (!addForm.name || !addForm.username || !addForm.password) {
      showToast("请填写必填字段");
      return;
    }
    createAgent(addForm);
    showToast("代理添加成功");
    setShowAddModal(false);
    setAddForm(emptyFormData);
    loadData();
  };

  // ============================================
  // 编辑代理
  // ============================================
  const handleEdit = () => {
    if (!editAgent || !editForm.name) {
      showToast("请填写名称");
      return;
    }
    updateAgent(editAgent.id, {
      name: editForm.name,
      contactInfo: editForm.contactInfo,
      commissionRate: editForm.commissionRate,
      status: editAgent.status,
    });
    showToast("代理信息已更新");
    setEditAgent(null);
    setEditForm(emptyFormData);
    loadData();
  };

  // ============================================
  // 删除代理
  // ============================================
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAgent(deleteTarget.id);
    showToast("代理已删除");
    setDeleteTarget(null);
    loadData();
  };

  // ============================================
  // 切换代理状态
  // ============================================
  const handleToggle = (agent: Agent) => {
    toggleAgentStatus(agent.id);
    showToast(
      agent.status === "active" ? "代理已禁用" : "代理已启用"
    );
    loadData();
  };

  // ============================================
  // 切换 API Key 可见性
  // ============================================
  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ============================================
  // 打开编辑弹窗
  // ============================================
  const openEditModal = (agent: Agent) => {
    setEditAgent(agent);
    setEditForm({
      name: agent.name,
      username: agent.username,
      password: "",
      contactInfo: agent.contactInfo,
      commissionRate: agent.commissionRate,
    });
  };

  // ============================================
  // 统计数据
  // ============================================
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalCommission = agents.reduce(
    (sum, a) => sum + a.totalEarnings,
    0
  );
  const totalOrders = agents.reduce((sum, a) => sum + a.totalOrders, 0);

  // ============================================
  // 渲染
  // ============================================
  return (
    <div className="animate-fade-in">
      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-card px-4 py-3 flex items-center gap-2 animate-fade-in">
          <Check size={16} className="text-success" />
          <span className="text-sm text-light-3">{toast}</span>
        </div>
      )}

      {/* 顶部标题 + 添加按钮 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-light-3 mb-1 flex items-center gap-2">
            <Users size={24} />
            代理管理
          </h1>
          <p className="text-sm text-gray-3">管理推广代理，查看佣金数据</p>
        </div>
        <button
          onClick={() => {
            setAddForm(emptyFormData);
            setShowAddModal(true);
          }}
          className="btn-primary text-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          添加代理
        </button>
      </div>

      {/* 统计卡片行 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <p className="text-xs text-gray-4 mb-1">代理总数</p>
          <p className="text-2xl font-bold text-light-3">{totalAgents}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-4 mb-1">活跃代理</p>
          <p className="text-2xl font-bold text-success">{activeAgents}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-4 mb-1">总佣金支出</p>
          <p className="text-2xl font-bold text-light-3">
            ¥{totalCommission.toFixed(2)}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-4 mb-1">总推广订单</p>
          <p className="text-2xl font-bold text-light-3">{totalOrders}</p>
        </div>
      </div>

      {/* 代理列表表格 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  名称
                </th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  用户名
                </th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  联系方式
                </th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  佣金比例
                </th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  余额
                </th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  累计收益
                </th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  推广订单
                </th>
                <th className="text-left text-xs font-medium text-gray-4 px-6 py-3">
                  状态
                </th>
                <th className="text-right text-xs font-medium text-gray-4 px-6 py-3">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-gray-4 text-sm"
                  >
                    暂无代理数据
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="border-b border-glass-border last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* 名称 */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-light-3 font-medium">
                        {agent.name}
                      </span>
                    </td>
                    {/* 用户名 */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-4 font-mono">
                        {agent.username}
                      </span>
                    </td>
                    {/* 联系方式 */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-4">
                        {agent.contactInfo || "-"}
                      </span>
                    </td>
                    {/* 佣金比例 */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-light-3">
                        {agent.commissionRate}%
                      </span>
                    </td>
                    {/* 余额 */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-light-3">
                        ¥{agent.balance.toFixed(2)}
                      </span>
                    </td>
                    {/* 累计收益 */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-light-3">
                        ¥{agent.totalEarnings.toFixed(2)}
                      </span>
                    </td>
                    {/* 推广订单 */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-light-3">
                        {agent.totalOrders}
                      </span>
                    </td>
                    {/* 状态 */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          agent.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-gray-4/10 text-gray-4"
                        }`}
                      >
                        {agent.status === "active" ? "活跃" : "已禁用"}
                      </span>
                    </td>
                    {/* 操作 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* 推广链接 */}
                        <button
                          onClick={() => copyToClipboard(agent.apiKey)}
                          className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer"
                          title="复制推广链接"
                        >
                          <Copy size={14} />
                        </button>
                        {/* 显示/隐藏 API Key */}
                        <button
                          onClick={() => toggleKeyVisibility(agent.id)}
                          className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer"
                          title={
                            visibleKeys.has(agent.id)
                              ? "隐藏 API Key"
                              : "显示 API Key"
                          }
                        >
                          {visibleKeys.has(agent.id) ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                        {/* 启用/禁用 */}
                        <button
                          onClick={() => handleToggle(agent)}
                          className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer"
                          title={
                            agent.status === "active" ? "禁用代理" : "启用代理"
                          }
                        >
                          {agent.status === "active" ? (
                            <ToggleRight size={14} className="text-success" />
                          ) : (
                            <ToggleLeft size={14} />
                          )}
                        </button>
                        {/* 编辑 */}
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-1.5 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer"
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        {/* 删除 */}
                        <button
                          onClick={() => setDeleteTarget(agent)}
                          className="p-1.5 rounded-lg text-gray-4 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Key 显示区域 */}
      {agents.length > 0 && (
        <div className="mt-4 glass-card p-5">
          <p className="text-xs text-gray-4 mb-3">代理推广链接格式</p>
          <div className="space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-3/50 border border-glass-border"
              >
                <span className="text-xs text-gray-4 shrink-0 w-20">
                  {agent.name}
                </span>
                <code className="text-xs text-light-3 font-mono flex-1 truncate">
                  {visibleKeys.has(agent.id)
                    ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${agent.apiKey}`
                    : `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${"*".repeat(agent.apiKey.length)}`}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${agent.apiKey}`
                    )
                  }
                  className="p-1 rounded-lg text-gray-4 hover:text-light-3 hover:bg-glass-bg transition-colors cursor-pointer shrink-0"
                >
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 添加代理弹窗 */}
      {/* ============================================ */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加代理"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* 名称 */}
          <div>
            <label className="block text-xs text-gray-4 mb-1.5">
              名称 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) =>
                setAddForm({ ...addForm, name: e.target.value })
              }
              placeholder="代理名称"
              className="input-premium w-full"
            />
          </div>
          {/* 用户名 */}
          <div>
            <label className="block text-xs text-gray-4 mb-1.5">
              用户名 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={addForm.username}
              onChange={(e) =>
                setAddForm({ ...addForm, username: e.target.value })
              }
              placeholder="登录用户名"
              className="input-premium w-full"
            />
          </div>
          {/* 密码 */}
          <div>
            <label className="block text-xs text-gray-4 mb-1.5">
              密码 <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={addForm.password}
                onChange={(e) =>
                  setAddForm({ ...addForm, password: e.target.value })
                }
                placeholder="登录密码"
                className="input-premium w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-4 hover:text-light-3 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {/* 联系方式 */}
          <div>
            <label className="block text-xs text-gray-4 mb-1.5">
              联系方式
            </label>
            <input
              type="text"
              value={addForm.contactInfo}
              onChange={(e) =>
                setAddForm({ ...addForm, contactInfo: e.target.value })
              }
              placeholder="微信 / QQ / Telegram"
              className="input-premium w-full"
            />
          </div>
          {/* 佣金比例 */}
          <div>
            <label className="block text-xs text-gray-4 mb-1.5">
              佣金比例 (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={addForm.commissionRate}
              onChange={(e) =>
                setAddForm({
                  ...addForm,
                  commissionRate: parseFloat(e.target.value) || 0,
                })
              }
              className="input-premium w-full"
            />
            <p className="text-xs text-gray-4 mt-1">
              例如输入 10 表示每笔订单佣金的 10%
            </p>
          </div>
          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="btn-secondary text-sm cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="btn-primary text-sm cursor-pointer"
            >
              确认添加
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* 编辑代理弹窗 */}
      {/* ============================================ */}
      <Modal
        isOpen={!!editAgent}
        onClose={() => setEditAgent(null)}
        title="编辑代理"
        maxWidth="max-w-lg"
      >
        {editAgent && (
          <div className="space-y-4">
            {/* 名称 */}
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">
                名称 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="input-premium w-full"
              />
            </div>
            {/* 用户名（只读） */}
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={editForm.username}
                disabled
                className="input-premium w-full opacity-50 cursor-not-allowed"
              />
            </div>
            {/* 联系方式 */}
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">
                联系方式
              </label>
              <input
                type="text"
                value={editForm.contactInfo}
                onChange={(e) =>
                  setEditForm({ ...editForm, contactInfo: e.target.value })
                }
                placeholder="微信 / QQ / Telegram"
                className="input-premium w-full"
              />
            </div>
            {/* 佣金比例 */}
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">
                佣金比例 (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={editForm.commissionRate}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    commissionRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="input-premium w-full"
              />
            </div>
            {/* 状态 */}
            <div>
              <label className="block text-xs text-gray-4 mb-1.5">状态</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditAgent({
                      ...editAgent,
                      status: "active",
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors cursor-pointer ${
                    editAgent.status === "active"
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-dark-3 border-glass-border text-gray-4 hover:border-white/10"
                  }`}
                >
                  <ToggleRight size={16} />
                  启用
                </button>
                <button
                  onClick={() => {
                    setEditAgent({
                      ...editAgent,
                      status: "disabled",
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors cursor-pointer ${
                    editAgent.status === "disabled"
                      ? "bg-gray-4/10 border-gray-4/30 text-gray-4"
                      : "bg-dark-3 border-glass-border text-gray-4 hover:border-white/10"
                  }`}
                >
                  <ToggleLeft size={16} />
                  禁用
                </button>
              </div>
            </div>
            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditAgent(null)}
                className="btn-secondary text-sm cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                className="btn-primary text-sm cursor-pointer"
              >
                保存修改
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================ */}
      {/* 删除确认弹窗 */}
      {/* ============================================ */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        maxWidth="max-w-sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-3">
              确定要删除代理{" "}
              <span className="text-light-3 font-medium">
                {deleteTarget.name}
              </span>{" "}
              吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-sm cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
