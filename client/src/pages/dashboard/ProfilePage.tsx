import React, { useState, useEffect } from 'react';
import { rechargeApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { User, Coins, CreditCard, History, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateCredits } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await rechargeApi.transactions({ limit: 20 });
      setTransactions(res.data.data.items || []);
    } catch {
      // ignore
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await rechargeApi.redeem(code.trim());
      const { credits, newBalance } = res.data.data;
      updateCredits(newBalance);
      setSuccess(`充值成功！获得 ${credits} 积分`);
      setCode('');
      fetchTransactions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '充值失败，请检查卡号';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">个人中心</h1>
        <p className="text-slate-500 mt-1">管理您的账户和积分</p>
      </div>

      {/* User Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-rose-200">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.username}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
              {user?.role === 'ADMIN' ? '管理员' : '普通用户'}
            </span>
          </div>
        </div>
      </div>

      {/* Credits Card */}
      <div className="card p-6 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-5 h-5 text-rose-500" />
              <span className="text-sm font-medium text-slate-600">当前积分</span>
            </div>
            <p className="text-4xl font-bold text-slate-800">{user?.credits ?? 0}</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>生成大纲：5 积分</p>
            <p>生成笔记：10 积分</p>
            <p>生成图片：15 积分</p>
          </div>
        </div>
      </div>

      {/* Recharge Card */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-rose-500" />
          充值卡兑换
        </h3>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-sm mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleRedeem} className="flex gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition font-mono"
            placeholder="输入充值卡号 (如: REDINK-XXXX-XXXX-XXXX)"
          />
          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="px-6 py-3 rounded-xl gradient-btn font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '兑换'}
          </button>
        </form>
      </div>

      {/* Transaction History */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-rose-500" />
          积分记录
        </h3>

        {txLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-slate-400 py-8">暂无积分记录</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{tx.description}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-rose-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  <p className="text-xs text-slate-400">余额: {tx.balance}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
