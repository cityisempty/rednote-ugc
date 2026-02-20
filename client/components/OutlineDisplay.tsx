
import React from 'react';
import { NoteOutline } from '../types';
import { ListChecks, Lightbulb, Image as ImageIcon, CalendarPlus } from 'lucide-react';

interface OutlineDisplayProps {
  outline: NoteOutline;
  onConfirm: () => void;
  loading: boolean;
}

const OutlineDisplay: React.FC<OutlineDisplayProps> = ({ outline, onConfirm, loading }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">生成的大纲预览</h2>
          <p className="text-slate-500 text-sm">预览无误后，将其加入您的“发布计划”队列</p>
        </div>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
        >
          <CalendarPlus size={18} />
          加入发布计划
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3 text-red-500 font-bold">
              <Lightbulb size={20} />
              <h3 className="text-sm">选定的爆款标题</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-800 font-bold">{outline.titleSuggestions[0]}</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3 text-red-500 font-bold">
              <ListChecks size={20} />
              <h3 className="text-sm">内容架构</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">钩子开头</p>
                <p className="text-slate-700 text-sm leading-relaxed">"{outline.hook}"</p>
              </div>
              <div className="h-px bg-slate-200 w-full"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">主要逻辑</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {outline.mainPoints.map((point, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-red-400 font-bold">{i+1}.</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3 text-purple-600 font-bold">
              <ImageIcon size={20} />
              <h3 className="text-sm">视觉封面构思</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {outline.imagePrompts.slice(0, 3).map((prompt, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-[10px] font-bold text-purple-500">SCENE {i + 1}</span>
                  </div>
                  <p className="text-slate-500 text-xs italic line-clamp-2">{prompt}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OutlineDisplay;
