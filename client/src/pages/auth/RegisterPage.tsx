import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register, loading, user } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '注册失败，请重试';
      setError(msg);
    }
  };

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 mb-4 shadow-lg shadow-rose-200">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">加入创作平台</h1>
          <p className="text-slate-500 mt-1">注册即获赠 10 积分，立刻开始创作</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>新用户注册即送 <strong>10 积分</strong>，可立即生成内容</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={form.username}
                onChange={update('username')}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition"
                placeholder="创作者昵称"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition"
                placeholder="至少 8 位"
                minLength={8}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-btn font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '免费注册'}
          </button>

          <p className="text-center text-slate-500 text-sm">
            已有账号？{' '}
            <Link to="/login" className="text-rose-500 hover:text-rose-600 font-medium">立即登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
