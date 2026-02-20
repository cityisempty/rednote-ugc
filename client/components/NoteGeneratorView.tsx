
import React from 'react';
import { GeneratedNote } from '../types';
import { ArrowLeft, Copy, Download, Share2, Loader2, AlertCircle } from 'lucide-react';

interface NoteGeneratorViewProps {
  note: GeneratedNote | null;
  loading: boolean;
  onBack: () => void;
}

const NoteGeneratorView: React.FC<NoteGeneratorViewProps> = ({ note, loading, onBack }) => {
  if (!note) {
    return (
      <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-slate-200">
        <p className="text-slate-400">暂无生成中的内容，请先从大纲开始</p>
        <button 
          onClick={onBack}
          className="mt-4 text-blue-600 font-semibold hover:underline"
        >
          返回大纲生成器
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    const text = `${note.title}\n\n${note.content}\n\n${note.tags.join(' ')}`;
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板！');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={20} />
          返回编辑
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleCopy}
            disabled={note.status !== 'completed'}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <Copy size={16} />
            复制文案
          </button>
          <button 
            disabled={note.status !== 'completed'}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
          >
            <Share2 size={16} />
            发布素材
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mobile Preview Style Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden relative aspect-[9/19]">
            <div className="h-full overflow-y-auto bg-white scrollbar-hide">
              {/* Image Carousel Preview */}
              <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                {note.status === 'pending' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm text-white">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p className="text-sm font-medium">AI 绘画中...</p>
                  </div>
                )}
                {note.images.length > 0 ? (
                  <img src={note.images[0]} className="w-full h-full object-cover" alt="Primary" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <AlertCircle size={48} />
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md">
                  1/{note.images.length || 1}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {note.title || (note.status === 'pending' ? '文案生成中...' : '未生成标题')}
                </h1>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="text-blue-500 text-sm">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Phone Bottom Bar Mock */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-slate-100 px-6 flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-slate-100" />
              <div className="flex-1 mx-4 h-8 rounded-full bg-slate-100" />
              <div className="flex gap-4 text-slate-400">
                <div className="w-5 h-5 bg-slate-100 rounded" />
                <div className="w-5 h-5 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Assets Gallery Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">生成的视觉素材</h3>
            {note.status === 'pending' && note.images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl">
                <div className="relative">
                  <Loader2 className="animate-spin text-blue-600" size={40} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 bg-blue-600 rounded-full" />
                  </div>
                </div>
                <p className="mt-4 text-slate-500 font-medium">AI 正在根据大纲绘制多张素材图...</p>
                <p className="text-slate-400 text-xs mt-1">预计需要 15-30 秒</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {note.images.map((img, idx) => (
                  <div key={idx} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                    <img src={img} className="w-full h-full object-cover" alt={`Generated ${idx}`} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button className="p-3 bg-white text-slate-800 rounded-full shadow-lg hover:bg-slate-50">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">文案详情</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1 block">文案标题</span>
                <p className="text-slate-800 font-semibold">{note.title || '生成中...'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1 block">正文内容</span>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {note.content || '生成中...'}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1 block">热门标签</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-blue-600 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default NoteGeneratorView;
