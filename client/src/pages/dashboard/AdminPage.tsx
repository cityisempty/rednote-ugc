import React, { useState, useEffect } from 'react';
import { adminApi, adminConfigApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Shield, Users, CreditCard, BarChart3, AlertCircle, Loader2, Plus, Settings, Zap, Edit, Trash2, CheckCircle, Globe, Key, Layers } from 'lucide-react';

interface Stats {
  users: { total: number; newThisWeek: number };
  notes: { total: number };
  transactions: { totalRecharges: number; totalSpent: number };
  credits: { totalDistributed: number };
}

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  credits: number;
  createdAt: string;
}

interface AIConfig {
  id: string;
  name: string;
  type: 'TEXT' | 'IMAGE';
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  isActive: boolean;
  settings?: any;
}

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<AIConfig[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'users' | 'cards' | 'settings'>('overview');

  // Card generation
  const [cardForm, setCardForm] = useState({ count: 1, credits: 100 });
  const [cardLoading, setCardLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [cardSuccess, setCardSuccess] = useState('');

  // AI Provider Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Partial<AIConfig> | null>(null);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; error?: string; success?: boolean }>({ loading: false });

  useEffect(() => {
    loadStats();
    loadUsers();
    loadProviders();
  }, []);

  const loadStats = async () => {
    try {
      const res = await adminApi.stats();
      setStats(res.data.data);
    } catch {
      setError('加载统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await adminApi.users({ limit: 50 });
      setUsers(res.data.data.items || []);
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const res = await adminConfigApi.getProviders();
      setProviders(res.data.data);
    } catch {
      setError('加载提供商配置失败');
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardLoading(true);
    setError('');
    setCardSuccess('');
    try {
      const res = await adminApi.generateCards(cardForm);
      setGeneratedCodes(res.data.data.cards || []);
      setCardSuccess(`成功生成 ${cardForm.count} 张充值卡`);
    } catch (err: any) {
      setError(err.response?.data?.error || '生成失败');
    } finally {
      setCardLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`确定将此用户设置为 ${newRole === 'ADMIN' ? '管理员' : '普通用户'}？`)) return;
    try {
      const res = await adminApi.updateUser(userId, { role: newRole });
      const updatedUser = res.data.data;
      setUsers((prev: User[]) => prev.map((u: User) => u.id === userId ? { ...u, role: newRole, credits: updatedUser.credits } : u));

      const { user: authUser, updateCredits } = useAuthStore.getState();
      if (authUser?.id === updatedUser.id) {
        updateCredits(updatedUser.credits);
      }
    } catch {
      setError('操作失败');
    }
  };

  const handleActivateProvider = async (id: string) => {
    try {
      await adminConfigApi.activateProvider(id);
      loadProviders();
    } catch (err: any) {
      setError(err.response?.data?.error || '激活失败');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('确定删除此配置吗？')) return;
    try {
      await adminConfigApi.deleteProvider(id);
      loadProviders();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  const handleTestProvider = async () => {
    if (!editingProvider) return;
    setTestStatus({ loading: true });
    try {
      await adminConfigApi.testProvider(editingProvider);
      setTestStatus({ loading: false, success: true });
    } catch (err: any) {
      setTestStatus({ loading: false, error: err.response?.data?.error || '测试失败' });
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    try {
      if (editingProvider.id) {
        await adminConfigApi.updateProvider(editingProvider.id, editingProvider);
      } else {
        await adminConfigApi.createProvider(editingProvider);
      }
      setIsModalOpen(false);
      loadProviders();
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败');
    }
  };

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
    <div className={`card p-5 border-l-4 ${color}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  const ProviderTable = ({ type, title, items }: { type: 'TEXT' | 'IMAGE'; title: string; items: AIConfig[] }) => (
    <div className="card overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{type === 'TEXT' ? '用于生成小红书图文大纲' : '用于生成小红书配图'}</p>
        </div>
        <button
          onClick={() => {
            setEditingProvider({ type, provider: 'openai', isActive: false });
            setTestStatus({ loading: false });
            setIsModalOpen(true);
          }}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-rose-400 hover:text-rose-500 transition-all flex items-center gap-1.5 font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> 添加
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white border-b border-slate-100 text-slate-400 font-medium">
            <th className="text-left px-5 py-3 font-medium">状态</th>
            <th className="text-left px-5 py-3 font-medium">名称</th>
            <th className="text-left px-5 py-3 font-medium">模型</th>
            <th className="text-left px-5 py-3 font-medium">API KEY</th>
            <th className="text-right px-5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4">
                {item.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-tight">
                    已激活
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-400 uppercase tracking-tight">
                    激活
                  </span>
                )}
              </td>
              <td className="px-5 py-4">
                <div className="font-medium text-slate-800 flex items-center gap-2">
                  {item.name}
                </div>
              </td>
              <td className="px-5 py-4">
                <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600">{item.model}</code>
              </td>
              <td className="px-5 py-4 font-mono text-slate-400 text-xs">
                {item.apiKey.substring(0, 8)}****************{item.apiKey.slice(-4)}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleActivateProvider(item.id)}
                    disabled={item.isActive}
                    title="激活"
                    className={`p-1.5 rounded-lg border transition-all ${item.isActive ? 'border-slate-100 text-slate-200' : 'border-slate-200 text-slate-500 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingProvider(item);
                      setTestStatus({ loading: false });
                      setIsModalOpen(true);
                    }}
                    title="编辑"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(item.id)}
                    title="删除"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-xs">暂无配置</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">管理后台</h1>
          <p className="text-slate-500 text-sm">系统概览与用户管理</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'overview', label: '数据概览', icon: BarChart3 },
          { key: 'users', label: '用户管理', icon: Users },
          { key: 'cards', label: '充值卡', icon: CreditCard },
          { key: 'settings', label: '系统设置', icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        statsLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="注册用户" value={stats.users.total} sub={`本周新增 ${stats.users.newThisWeek}`} color="border-blue-400" />
            <StatCard label="生成笔记" value={stats.notes.total} color="border-rose-400" />
            <StatCard label="充值笔数" value={stats.transactions.totalRecharges} color="border-green-400" />
            <StatCard label="消耗积分" value={stats.transactions.totalSpent} color="border-orange-400" />
          </div>
        ) : null
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          {usersLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">用户</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">邮箱</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">积分</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">角色</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3 text-center font-medium">{u.credits}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role === 'ADMIN' ? '管理员' : '用户'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        {u.role === 'ADMIN' ? '取消管理员' : '设为管理员'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Cards Tab */}
      {tab === 'cards' && (
        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-500" />
              生成充值卡
            </h3>

            {cardSuccess && (
              <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm mb-4">{cardSuccess}</div>
            )}

            <form onSubmit={handleGenerateCards} className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">数量</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={cardForm.count}
                  onChange={(e) => setCardForm((f) => ({ ...f, count: +e.target.value }))}
                  className="w-24 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">每张积分</label>
                <input
                  type="number"
                  min={1}
                  value={cardForm.credits}
                  onChange={(e) => setCardForm((f) => ({ ...f, credits: +e.target.value }))}
                  className="w-28 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition"
                />
              </div>
              <button type="submit" disabled={cardLoading} className="px-5 py-2.5 rounded-xl gradient-btn font-medium disabled:opacity-50 flex items-center gap-2">
                {cardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                生成
              </button>
            </form>
          </div>

          {generatedCodes.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-3">生成的充值卡</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {generatedCodes.map((code, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <code className="text-sm font-mono text-slate-700">{code}</code>
                    <button onClick={() => navigator.clipboard.writeText(code)} className="text-xs text-rose-500 hover:text-rose-600">复制</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const text = generatedCodes.join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="mt-3 text-sm text-rose-500 hover:text-rose-600 font-medium"
              >
                复制全部
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-center py-2">
            <h2 className="text-lg font-bold text-slate-800">系统设置</h2>
            <p className="text-xs text-slate-500 mt-1">配置文本生成和图片生成的 API 服务</p>
          </div>

          {providersLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-rose-400 animate-spin" /></div>
          ) : (
            <>
              <ProviderTable
                type="TEXT"
                title="文本生成配置"
                items={providers.filter(p => p.type === 'TEXT')}
              />
              <ProviderTable
                type="IMAGE"
                title="图片生成配置"
                items={providers.filter(p => p.type === 'IMAGE')}
              />
            </>
          )}

          {/* Provider Modal */}
          {isModalOpen && editingProvider && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {editingProvider.id ? '编辑服务商' : '添加服务商'}
                    {editingProvider.type === 'TEXT' ? (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">TEXT</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">IMAGE</span>
                    )}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <form onSubmit={handleSaveProvider} className="p-6 space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> 服务商名称
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="例如: google_genai"
                        value={editingProvider.name || ''}
                        onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-50 outline-none transition-all placeholder:text-slate-300"
                      />
                      <p className="text-[10px] text-slate-400 mt-1.5 ml-1">唯一标识，用于区分不同服务商</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> 类型
                      </label>
                      <select
                        value={editingProvider.provider || 'openai'}
                        onChange={(e) => setEditingProvider({ ...editingProvider, provider: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-50 outline-none transition-all appearance-none bg-white"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI 兼容接口</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" /> API Key
                      </label>
                      <input
                        required
                        type="password"
                        placeholder="输入 API Key"
                        value={editingProvider.apiKey || ''}
                        onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition-all"
                      />
                    </div>

                    {editingProvider.provider === 'openai' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Base URL
                        </label>
                        <input
                          type="text"
                          placeholder="例如: https://api.openai.com/v1"
                          value={editingProvider.baseUrl || ''}
                          onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition-all"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        < Zap className="w-3.5 h-3.5" /> 模型
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="例如: gpt-4o 或 gemini-pro"
                        value={editingProvider.model || ''}
                        onChange={(e) => setEditingProvider({ ...editingProvider, model: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      取消
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleTestProvider}
                        disabled={testStatus.loading}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${testStatus.success ? 'bg-green-50 border-green-200 text-green-600' : testStatus.error ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                      >
                        {testStatus.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : testStatus.success ? <CheckCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        {testStatus.success ? '测试成功' : '测试连接'}
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all shadow-lg shadow-rose-200"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                  {testStatus.error && (
                    <p className="text-[10px] text-red-500 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">{testStatus.error}</p>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
