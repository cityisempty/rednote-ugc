import React, { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { History, Search, Trash2, Eye, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  status: string;
}

const HistoryPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Note | null>(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await notesApi.list({ page, limit, search: search || undefined });
      setNotes(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch {
      setError('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条笔记吗？')) return;
    try {
      await notesApi.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
      if (selected?.id === id) setSelected(null);
    } catch {
      setError('删除失败');
    }
  };

  const copyContent = () => {
    if (!selected) return;
    navigator.clipboard.writeText(`${selected.title}\n\n${selected.content}\n\n${selected.tags.map((t) => `#${t}`).join(' ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">历史记录</h1>
        <p className="text-slate-500 mt-1">查看和管理您生成的所有笔记</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition"
          placeholder="搜索笔记标题或内容..."
        />
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-500">暂无历史记录</p>
          <p className="text-sm text-slate-400 mt-1">开始创作您的第一篇笔记吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="card p-4 flex items-start gap-4 hover:border-rose-200 transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{note.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{note.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleDateString('zh-CN')}</span>
                  <div className="flex gap-1">
                    {note.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-xs">#{tag}</span>
                    ))}
                    {note.tags.length > 3 && <span className="text-xs text-slate-400">+{note.tags.length - 3}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setSelected(note)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(note.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-50">上一页</button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-50 hover:bg-slate-50">下一页</button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg pr-4">{selected.title}</h3>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={copyContent} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-600 font-sans leading-relaxed bg-slate-50 rounded-xl p-4">{selected.content}</pre>
            <div className="flex flex-wrap gap-2 mt-4">
              {selected.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-xs font-medium">#{tag}</span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">创建于 {new Date(selected.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
