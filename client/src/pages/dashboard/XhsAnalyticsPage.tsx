import React, { useState, useEffect } from 'react';
import { xhsApi } from '../../api';
import { BarChart2, Link2, Loader2, LogOut, AlertTriangle } from 'lucide-react';
import XhsLoginModal from './xhs/XhsLoginModal';
import XhsOverviewTab from './xhs/XhsOverviewTab';
import XhsContentTab from './xhs/XhsContentTab';
import XhsSearchTab from './xhs/XhsSearchTab';
import XhsPublishTab from './xhs/XhsPublishTab';

type Tab = 'overview' | 'content' | 'search' | 'publish';
type ConnectionState = 'checking' | 'connected' | 'not_logged_in' | 'mcp_error';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: '账号总览' },
  { key: 'content', label: '内容分析' },
  { key: 'search', label: '搜索竞品' },
  { key: 'publish', label: '发布笔记' },
];

const XhsAnalyticsPage: React.FC = () => {
  const [connState, setConnState] = useState<ConnectionState>('checking');
  const [username, setUsername] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  const checkConnection = async () => {
    setConnState('checking');
    try {
      const res = await xhsApi.checkLogin();
      const data = (res.data as any).data;
      if (data?.logged_in) {
        setConnState('connected');
        if (data.username) setUsername(data.username);
      } else {
        setConnState('not_logged_in');
      }
    } catch {
      setConnState('mcp_error');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleLoginSuccess = (name?: string) => {
    setConnState('connected');
    if (name) setUsername(name);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    try {
      await xhsApi.logout();
      setConnState('not_logged_in');
      setUsername('');
    } catch {
      // silent
    }
  };

  if (connState === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        <p className="text-sm text-slate-400">正在检查小红书登录状态...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">XHS 数据</h1>
          <p className="text-slate-500 mt-1">
            {connState === 'connected' && `已连接: ${username || '小红书账号'}`}
            {connState === 'not_logged_in' && '连接你的小红书账号查看数据'}
            {connState === 'mcp_error' && 'MCP 服务连接失败'}
          </p>
        </div>
        {connState === 'connected' ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
          >
            <LogOut className="w-4 h-4" /> 断开连接
          </button>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-bold hover:from-rose-600 hover:to-pink-600 transition shadow-lg shadow-rose-200"
          >
            <Link2 className="w-4 h-4" /> 连接小红书
          </button>
        )}
      </div>

      {/* MCP Error State */}
      {connState === 'mcp_error' && (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">MCP 服务不可用</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            无法连接到小红书 MCP 服务，请检查服务是否正常运行
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={checkConnection}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition"
            >
              重新检测
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm hover:from-rose-600 hover:to-pink-600 transition shadow-lg shadow-rose-200"
            >
              <Link2 className="w-4 h-4" /> 尝试连接
            </button>
          </div>
        </div>
      )}

      {/* Not Logged In State */}
      {connState === 'not_logged_in' && (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 flex items-center justify-center">
            <BarChart2 className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">连接小红书账号</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            扫描二维码登录小红书，即可查看账号数据、内容分析、搜索竞品、一键发布笔记
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm hover:from-rose-600 hover:to-pink-600 transition shadow-lg shadow-rose-200"
          >
            <Link2 className="w-4 h-4" /> 扫码登录
          </button>
        </div>
      )}

      {/* Connected State */}
      {connState === 'connected' && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-100">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                  tab === key
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'overview' && <XhsOverviewTab />}
          {tab === 'content' && <XhsContentTab />}
          {tab === 'search' && <XhsSearchTab />}
          {tab === 'publish' && <XhsPublishTab />}
        </>
      )}

      {/* Login Modal */}
      {showLogin && (
        <XhsLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};

export default XhsAnalyticsPage;
