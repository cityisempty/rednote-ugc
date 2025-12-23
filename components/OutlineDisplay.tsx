
import React from 'react';
import { NoteOutline } from '../types';
import { ListChecks, Lightbulb, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface OutlineDisplayProps {
  outline: NoteOutline;
  onConfirm: () => void;
  loading: boolean;
}

const OutlineDisplay: React.FC<OutlineDisplayProps> = ({ outline, onConfirm, loading }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">生成的大纲预览</h2>
          <p className="text-slate-500 text-sm">您可以直接基于大纲进行修改或直接生成全文</p>
        </div>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50"
        >
          {loading ? '生成图文素材中...' : (
            <>
              <CheckCircle2 size={18} />
              确认大纲并生成图文
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold">
              <Lightbulb size={20} />
              <h3>标题建议</h3>
            </div>
            <ul className="space-y-2">
              {outline.titleSuggestions.map((title, i) => (
                <li key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 text-sm">
                  {title}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold">
              <ListChecks size={20} />
              <h3>内容钩子 & 要点</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">开篇钩子</p>
                <p className="text-slate-700 text-sm italic">"{outline.hook}"</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">主要逻辑</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {outline.mainPoints.map((point, i) => (
                    <li key={i}>{point}</li>
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
              <h3>配图构思</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {outline.imagePrompts.map((prompt, i) => (
                <div key={i} className="group bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 hover:border-purple-300 hover:bg-purple-50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600">图片 {i + 1}</span>
                  </div>
                  <p className="text-slate-600 text-sm">{prompt}</p>
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
