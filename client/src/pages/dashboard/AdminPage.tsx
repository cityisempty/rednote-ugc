import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import { Shield, Users, CreditCard, BarChart3, AlertCircle, Loader2, Plus, ChevronDown } from 'lucide-react';

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

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'users' | 'cards'>('overview');

  // Card generation
  const [cardForm, setCardForm] = useState({ count: 1, credits: 100 });
  const [cardLoading, setCardLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [cardSuccess, setCardSuccess] = useState('');

  useEffect(() => {
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
    loadStats();
    loadUsers();
  }, []);

  const handleGenerateCards = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardLoading(true);
    setError('');
    setCardSuccess('');
    try {
      const res = await adminApi.generateCards(cardForm);
      setGeneratedCodes(res.data.data.cards || []);
      setCardSuccess(`成功生成 ${cardForm.count} 张充值卡`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || '生成失败');
    } finally {
      setCardLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`确定将此用户设置为 ${newRole === 'ADMIN' ? '管理员' : '普通用户'}？`)) return;
    try {
      await adminApi.updateUser(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      setError('操作失败');
    }
  };

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
    <div className={`card p-5 border-l-4 ${color}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
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
    </div>
  );
};

export default AdminPage;
