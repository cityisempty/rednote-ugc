import React, { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { History as HistoryIcon, Search, Trash2, Eye, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getFullImageUrl } from '../../utils/format';

interface NotePage {
  pageNumber: number;
  type: 'cover' | 'content' | 'summary';
  title: string;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
}

interface NoteOutline {
  titleSuggestions: string[];
  pages: NotePage[];
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  images: string[];
  outline?: NoteOutline;
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

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      await notesApi.update(selected.id, selected);
      setNotes(prev => prev.map(n => n.id === selected.id ? selected : n));
      // alert('保存成功');
    } catch {
      setError('保存失败');
    }
  };

  const downloadAllImages = async () => {
    if (!selected || selected.images.length === 0) return;
    const zip = new JSZip();
    const folder = zip.folder(`${selected.title}_images`);

    setLoading(true);
    try {
      for (let i = 0; i < selected.images.length; i++) {
        const url = selected.images[i];
        const res = await fetch(url);
        const blob = await res.blob();
        folder?.file(`image_${i + 1}.png`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${selected.title}_images.zip`);
    } catch (err) {
      setError('打包下载失败');
    } finally {
      setLoading(false);
    }
  };

  const copyContent = () => {
    if (!selected) return;
    navigator.clipboard.writeText(`${selected.title}\n\n${selected.content}\n\n${selected.tags.map((t) => `#${t}`).join(' ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSelectedOutline = (pageNumber: number, field: keyof NotePage, value: string) => {
    if (!selected || !selected.outline) return;
    const updatedOutline = {
      ...selected.outline,
      pages: selected.outline.pages.map(p => p.pageNumber === pageNumber ? { ...p, [field]: value } : p)
    };
    setSelected({ ...selected, outline: updatedOutline });
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

      {/* Notes Grid */}
      {loading && notes.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-100">
          <HistoryIcon className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">暂无创作记录</p>
          <p className="text-sm text-slate-400 mt-1">你的爆款小红书笔记将出现在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {notes.map((note) => (
            <div key={note.id} className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div
                className="aspect-[3/4] bg-slate-100 relative cursor-pointer overflow-hidden"
                onClick={() => setSelected(note)}
              >
                {(note.images && note.images.length > 0) ? (
                  <img src={getFullImageUrl(note.images[0])} alt={note.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50">
                    {note.status === 'COMPLETED' ? (
                      <HistoryIcon className="w-6 h-6 text-slate-200 mb-2" />
                    ) : (
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin mb-2" />
                    )}
                    <span className="text-[10px] text-slate-400">{note.status === 'COMPLETED' ? '暂无图片' : '生成中...'}</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white uppercase backdrop-blur-md ${note.status === 'COMPLETED' ? 'bg-green-500/60' : 'bg-orange-500/60'}`}>
                    {note.status === 'COMPLETED' ? '已完成' : '草稿'}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-slate-800 line-clamp-2 text-sm leading-snug group-hover:text-rose-500 transition-colors">{note.title}</h3>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-400">R</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{note.images?.length || 0}P · {new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-sm font-medium text-slate-600 disabled:opacity-50 hover:border-rose-200 hover:text-rose-500 transition-all">上一页</button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === i + 1 ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white border border-slate-100 text-slate-400 hover:border-rose-100'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-sm font-medium text-slate-600 disabled:opacity-50 hover:border-rose-200 hover:text-rose-500 transition-all">下一页</button>
        </div>
      )}

      {/* Advanced Preview Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-slate-50 text-slate-400">&times;</button>
                <div>
                  <h3 className="font-bold text-slate-800 truncate max-w-md">{selected.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{selected.images?.length || 0} 张图片 · 2/21</span>
                    <button className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:bg-slate-200 transition-all">
                      <Eye className="w-3 h-3" /> 查看大纲
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadAllImages}
                  disabled={!selected.images?.length}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
                >
                  <Copy className="w-4 h-4" /> 打包下载
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-8 py-2.5 rounded-2xl bg-rose-500 text-white text-sm font-extrabold flex items-center gap-2 hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                >
                  <Check className="w-4 h-4" /> 保存修改
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Image Gallery */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(selected.outline?.pages || []).map((page) => (
                    <div key={page.pageNumber} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
                      {page.imageUrl ? (
                        <img src={getFullImageUrl(page.imageUrl)} alt={`P${page.pageNumber}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-100 font-bold uppercase text-[20px] bg-slate-50">P{page.pageNumber}</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-[10px] font-bold text-white uppercase tracking-tighter">Page {page.pageNumber}</p>
                      </div>
                      {page.imageUrl && (
                        <a href={page.imageUrl} download={`P${page.pageNumber}.png`} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all text-[8px] font-bold">下载</a>
                      )}
                    </div>
                  ))}
                  {(!selected.outline?.pages || selected.outline.pages.length === 0) && (
                    <div className="col-span-full py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">此笔记采用旧版结构，无法预览分页详情</p>
                    </div>
                  )}
                </div>

                {/* Content Editor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="card p-5 bg-white">
                      <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">标题建议</label>
                      <textarea
                        value={selected.title}
                        onChange={(e) => setSelected({ ...selected, title: e.target.value })}
                        rows={2}
                        className="w-full font-bold text-lg text-slate-800 bg-transparent border-none focus:ring-0 resize-none p-0"
                      />
                    </div>
                    <div className="card p-5 bg-white">
                      <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">正文内容</label>
                      <textarea
                        value={selected.content}
                        onChange={(e) => setSelected({ ...selected, content: e.target.value })}
                        rows={12}
                        className="w-full text-sm text-slate-600 leading-relaxed bg-transparent border-none focus:ring-0 resize-none p-0"
                      />
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                        {(selected.tags || []).map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-bold">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pages Detail Editor */}
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">详细大钢编辑</label>
                    <div className="space-y-3">
                      {(selected.outline?.pages || []).map((page) => (
                        <div key={page.pageNumber} className="card p-4 bg-white hover:border-rose-200 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-extrabold text-white bg-slate-800 px-1.5 py-0.5 rounded uppercase">P{page.pageNumber}</span>
                            <input
                              value={page.title || ''}
                              onChange={(e) => updateSelectedOutline(page.pageNumber, 'title', e.target.value)}
                              className="flex-1 font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 text-xs"
                            />
                          </div>
                          <textarea
                            value={page.content || ''}
                            onChange={(e) => updateSelectedOutline(page.pageNumber, 'content', e.target.value)}
                            rows={3}
                            className="w-full text-[11px] text-slate-500 leading-normal bg-slate-50 rounded-xl p-3 border-none focus:ring-0 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
