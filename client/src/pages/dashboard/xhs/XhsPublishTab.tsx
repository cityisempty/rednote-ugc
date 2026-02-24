import React, { useState } from 'react';
import { xhsApi, notesApi } from '../../../api';
import { Send, Loader2, Plus, Trash2, FileText, AlertCircle, Check, Image } from 'lucide-react';

interface HistoryNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  images: string[];
}

const XhsPublishTab: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [tags, setTags] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Import from history
  const [showImport, setShowImport] = useState(false);
  const [historyNotes, setHistoryNotes] = useState<HistoryNote[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handlePublish = async () => {
    setError('');
    setSuccess('');
    if (!title.trim()) { setError('请输入标题'); return; }
    if (!content.trim()) { setError('请输入内容'); return; }
    if (title.length > 20) { setError('标题不能超过20个字符'); return; }
    if (content.length > 1000) { setError('内容不能超过1000个字符'); return; }

    setPublishing(true);
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await xhsApi.publish({ title, content, images, tags: tagList.length > 0 ? tagList : undefined });
      setSuccess('发布成功！');
      setTitle('');
      setContent('');
      setImages([]);
      setTags('');
    } catch (e: unknown) {
      setError((e as Error).message || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setImages((prev) => [...prev, imageInput.trim()]);
      setImageInput('');
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const openImport = async () => {
    setShowImport(true);
    setHistoryLoading(true);
    try {
      const res = await notesApi.list({ status: 'COMPLETED', limit: 50 });
      setHistoryNotes(res.data.data.items || []);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  const importNote = (note: HistoryNote) => {
    setTitle(note.title?.slice(0, 20) || '');
    setContent(note.content?.slice(0, 1000) || '');
    setTags(note.tags?.join(', ') || '');
    setImages(note.images || []);
    setShowImport(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700">发布笔记</h3>
          <button
            onClick={openImport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition"
          >
            <FileText className="w-3.5 h-3.5" /> 从历史导入
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-sm">
            <Check className="w-4 h-4 flex-shrink-0" />{success}
          </div>
        )}

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-500">标题</label>
            <span className={`text-[10px] ${title.length > 20 ? 'text-red-500' : 'text-slate-400'}`}>{title.length}/20</span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={20}
            placeholder="输入笔记标题..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-500">正文</label>
            <span className={`text-[10px] ${content.length > 1000 ? 'text-red-500' : 'text-slate-400'}`}>{content.length}/1000</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            rows={8}
            placeholder="输入笔记内容..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition resize-none"
          />
        </div>

        {/* Images */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">图片</label>
          <div className="space-y-2">
            {images.map((img, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                <Image className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 truncate flex-1">{img}</span>
                <button onClick={() => removeImage(idx)} className="p-1 text-slate-400 hover:text-red-500 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addImage(); }}
                placeholder="输入图片 URL..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-rose-300 outline-none transition"
              />
              <button
                onClick={addImage}
                disabled={!imageInput.trim()}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">标签（逗号分隔）</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签1, 标签2, 标签3..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition"
          />
        </div>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={publishing || !title.trim() || !content.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-sm hover:from-orange-600 hover:to-rose-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          发布到小红书
        </button>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[70vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">选择笔记</h3>
              <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <span className="text-lg">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
                </div>
              ) : historyNotes.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">暂无已完成的笔记</p>
              ) : (
                <div className="space-y-2">
                  {historyNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => importNote(note)}
                      className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/50 transition"
                    >
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{note.title}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {note.images?.length > 0 && <span className="text-[10px] text-slate-400">{note.images.length} 张图片</span>}
                        {note.tags?.length > 0 && <span className="text-[10px] text-slate-400">{note.tags.length} 个标签</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XhsPublishTab;
