import React, { useState, useEffect } from 'react';
import { templatesApi, generateApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { LayoutTemplate, Search, Zap, Eye, AlertCircle, Loader2, Wand2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  titlePattern: string;
  description?: string;
  styleGuide?: { tone: string; emojiFrequency: string };
  hashtagStrategy?: string[];
}

const TemplatePage: React.FC = () => {
  const { user, updateCredits } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Template | null>(null);

  // Note imitation state
  const [imitateContent, setImitateContent] = useState('');
  const [imitateLoading, setImitateLoading] = useState(false);
  const [imitateResult, setImitateResult] = useState<Template | null>(null);
  const [showImitate, setShowImitate] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await templatesApi.list({ search: search || undefined, category: category || undefined });
      setTemplates(res.data.data.items || []);
    } catch {
      setError('加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [search, category]);

  const handleAnalyze = async () => {
    if (!imitateContent.trim()) return;
    setImitateLoading(true);
    setError('');
    try {
      const res = await generateApi.analyzeNote({ content: imitateContent });
      setImitateResult(res.data.data.template);
      updateCredits(res.data.data.remainingCredits);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '分析失败，请重试';
      setError(msg);
    } finally {
      setImitateLoading(false);
    }
  };

  const categories = ['美妆', '美食', '旅行', '生活', '穿搭', '健身', '宠物', '数码'];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">模板广场</h1>
          <p className="text-slate-500 mt-1">精选写作模板，让创作更高效</p>
        </div>
        <button
          onClick={() => setShowImitate(!showImitate)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-btn text-sm font-medium"
        >
          <Wand2 className="w-4 h-4" />
          笔记模仿
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Note Imitation Panel */}
      {showImitate && (
        <div className="card p-6 border-rose-100 bg-gradient-to-br from-rose-50/50 to-pink-50/50">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-rose-500" />
            笔记模仿分析
          </h3>
          <p className="text-sm text-slate-500 mb-4">粘贴一篇你喜欢的小红书笔记，AI 将分析其写作风格并生成可复用模板</p>

          <textarea
            value={imitateContent}
            onChange={(e) => setImitateContent(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition resize-none text-sm"
            placeholder="在这里粘贴你想模仿的小红书笔记内容..."
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Zap className="w-4 h-4 text-rose-400" />
              分析消耗 <strong className="text-rose-500">8</strong> 积分（当前：{user?.credits ?? 0}）
            </span>
            <button
              onClick={handleAnalyze}
              disabled={!imitateContent.trim() || imitateLoading}
              className="px-5 py-2.5 rounded-xl gradient-btn text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {imitateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              开始分析
            </button>
          </div>

          {imitateResult && (
            <div className="mt-5 p-4 bg-white rounded-xl border border-rose-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800">{imitateResult.name}</h4>
                <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded-full text-xs">{imitateResult.category}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">标题模式</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 font-mono">{imitateResult.titlePattern}</p>
              </div>
              {imitateResult.styleGuide && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">语气</p>
                    <p className="text-sm font-medium text-slate-700">{imitateResult.styleGuide.tone}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Emoji 频率</p>
                    <p className="text-sm font-medium text-slate-700">{imitateResult.styleGuide.emojiFrequency}</p>
                  </div>
                </div>
              )}
              {imitateResult.hashtagStrategy && imitateResult.hashtagStrategy.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {imitateResult.hashtagStrategy.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-xs">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition"
            placeholder="搜索模板..."
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${!category ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'}`}>全部</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c === category ? '' : c)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${category === c ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'}`}>{c}</button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutTemplate className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-500">暂无模板，请稍后再试</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="card p-5 hover:border-rose-200 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelected(t)}>
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded-full text-xs font-medium">{t.category}</span>
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{t.name}</h3>
              <p className="text-xs text-slate-500 font-mono bg-slate-50 rounded-lg px-2 py-1.5 line-clamp-2">{t.titlePattern}</p>
            </div>
          ))}
        </div>
      )}

      {/* Template Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded-full text-xs font-medium">{selected.category}</span>
                <h3 className="font-bold text-slate-800 text-lg mt-2">{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">标题模式</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 font-mono">{selected.titlePattern}</p>
              </div>
              {selected.styleGuide && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500">语气</p><p className="text-sm font-medium">{selected.styleGuide.tone}</p></div>
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs text-slate-500">Emoji 使用</p><p className="text-sm font-medium">{selected.styleGuide.emojiFrequency}</p></div>
                </div>
              )}
              {selected.hashtagStrategy && selected.hashtagStrategy.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">推荐标签</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.hashtagStrategy.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-xs">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePage;
