
import React from 'react';
import { GeneratedNote } from '../types';
import { STYLES } from '../constants';
import { Eye, Edit3, Trash2, Clock, Image as ImageIcon } from 'lucide-react';

interface HistoryTableProps {
  history: GeneratedNote[];
  onView: (note: GeneratedNote) => void;
  onDelete: (id: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ history, onView, onDelete }) => {
  const getStyleLabel = (val: string) => STYLES.find(s => s.value === val)?.label || val;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">生成历史</h2>
          <p className="text-xs text-slate-400 mt-1">查看和管理已生成的笔记与视觉素材</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">产品/创意</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">风格</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">标题预览</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">生成时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  暂无生成记录，立即开始创作吧！
                </td>
              </tr>
            ) : (
              history.map((note) => (
                <tr key={note.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 overflow-hidden border border-slate-100">
                        {note.images[0] ? (
                          <img src={note.images[0]} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                      </div>
                      <span className="font-semibold text-slate-700">{note.productName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium">
                      {getStyleLabel(note.style)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 truncate max-w-[200px]">{note.title || '大纲已生成...'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock size={14} />
                      {note.createdAt}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onView(note)}
                        title="查看详情"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(note.id)}
                        title="删除记录"
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
