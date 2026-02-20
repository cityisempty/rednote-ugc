
import React, { useState, useMemo } from 'react';
import { GeneratedNote, TaskStatus } from '../types';
import { 
  Play, Pause, XCircle, GripVertical, 
  Search, MoreHorizontal, Filter, Plus, ChevronLeft, ChevronRight,
  X, Image as ImageIcon, Layout, Type as TypeIcon, List
} from 'lucide-react';

interface PublishPlanViewProps {
  tasks: GeneratedNote[];
  onUpdateTasks: (tasks: GeneratedNote[]) => void;
  onExecute: (ids: string[]) => void;
  onAbort: (id: string) => void;
  onDelete: (id: string) => void;
}

const PublishPlanView: React.FC<PublishPlanViewProps> = ({ tasks, onUpdateTasks, onExecute, onAbort, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<GeneratedNote | null>(null);

  // 核心逻辑：自动计算时间轴
  const processedTasks = useMemo(() => {
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return [...tasks].sort((a, b) => a.order - b.order).map(task => {
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      end.setDate(end.getDate() + (task.durationDays || 1));
      
      const taskWithDates = {
        ...task,
        startDate: start.toLocaleDateString(),
        endDate: end.toLocaleDateString()
      };

      if (task.status !== 'aborted') {
        currentDate = new Date(end);
      }
      
      return taskWithDates;
    });
  }, [tasks]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBatchExecute = () => {
    onExecute(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const getStatusBadge = (status: TaskStatus) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-500 border-slate-200',
      running: 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse',
      paused: 'bg-amber-50 text-amber-600 border-amber-200',
      aborted: 'bg-red-50 text-red-600 border-red-200',
      completed: 'bg-green-50 text-green-600 border-green-200'
    };
    const labels = {
      draft: '草稿',
      running: '执行中',
      paused: '已暂停',
      aborted: '已中止',
      completed: '已完成'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 relative">
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">发布计划管理</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200">
              <Plus size={16} /> 新建发布主题
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200">
              草稿箱
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 py-2 border-y border-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="搜索主题、内容关键词..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-slate-50 border border-slate-100 rounded-xl text-sm px-3 py-2 outline-none">
              <option>主题分类 全部</option>
            </select>
            <button className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-500">
              <Filter size={16} />
            </button>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold">重置</button>
            <button className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-100">查询</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">已选 {selectedIds.size} 项主题</span>
          <button 
            disabled={selectedIds.size === 0}
            onClick={handleBatchExecute}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-30 transition-all hover:bg-blue-700 active:scale-95"
          >
            启动计划任务
          </button>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">批量中止</button>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">导出列表</button>
        </div>
      </div>

      {/* 任务列表表格 */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(tasks.map(t => t.id)));
                      else setSelectedIds(new Set());
                    }}
                    checked={selectedIds.size === tasks.length && tasks.length > 0}
                    className="rounded border-slate-300 text-red-500 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">发布主题信息</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">发布频次</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">持续时长</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">预定排期</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">执行统计</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">状态</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {processedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Layout size={48} className="mb-4" />
                      <p className="text-sm italic">暂无计划任务，点击左侧“大纲生成”开始创建主题</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedTasks.map((task, index) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors group relative">
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-2">
                        <div className="cursor-grab text-slate-300 hover:text-slate-500">
                          <GripVertical size={16} />
                        </div>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(task.id)}
                          onChange={() => toggleSelect(task.id)}
                          className="rounded border-slate-300 text-red-500 focus:ring-red-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                          {task.images[0] ? (
                            <img src={task.images[0]} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <button 
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="text-sm font-bold text-slate-700 truncate block hover:text-blue-600 transition-colors text-left w-full"
                          >
                            {task.productName}
                          </button>
                          <p className="text-[10px] text-slate-400 font-medium">#{task.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={task.publishFrequency}
                          className="w-10 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-red-500 outline-none text-sm font-medium text-slate-700 transition-all text-center"
                          onChange={(e) => {
                             const newTasks = [...tasks];
                             const idx = newTasks.findIndex(t => t.id === task.id);
                             newTasks[idx].publishFrequency = Math.max(1, parseInt(e.target.value) || 1);
                             onUpdateTasks(newTasks);
                          }}
                        />
                        <span className="text-xs text-slate-400">次/日</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={task.durationDays}
                          className="w-10 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-red-500 outline-none text-sm font-medium text-slate-700 transition-all text-center"
                          onChange={(e) => {
                             const newTasks = [...tasks];
                             const idx = newTasks.findIndex(t => t.id === task.id);
                             newTasks[idx].durationDays = Math.max(1, parseInt(e.target.value) || 1);
                             onUpdateTasks(newTasks);
                          }}
                        />
                        <span className="text-xs text-slate-400">天</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-700">{task.startDate}</p>
                        <p className="text-[10px] text-slate-400 italic">至 {task.endDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-blue-600">{task.successCount}</span>
                         <span className="text-[10px] text-slate-300">/ {task.durationDays * task.publishFrequency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {task.status === 'running' ? (
                          <button 
                            onClick={() => onAbort(task.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="暂停执行"
                          >
                            <Pause size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => onExecute([task.id])}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="开始执行"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => onDelete(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="中止并移除"
                        >
                          <XCircle size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="bg-white border border-slate-200 rounded-lg text-xs px-2 py-1 outline-none font-medium">
              <option>10 条/页</option>
              <option>20 条/页</option>
            </select>
            <span className="text-xs text-slate-400 font-medium">共 {tasks.length} 个主题计划</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ChevronLeft size={18} /></button>
            <span className="bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded text-xs font-bold shadow-md shadow-red-100">1</span>
            <button className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* 主题详情弹窗 */}
      {selectedTaskForDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTaskForDetail(null)}
          />
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                  <Layout size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">{selectedTaskForDetail.productName}</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Topic Detailed Intelligence</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTaskForDetail(null)}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 封面预览 */}
                <div className="md:col-span-1 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-red-400" />
                    视觉封面预设
                  </h4>
                  <div className="aspect-[3/4] rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center relative group">
                    {selectedTaskForDetail.images[0] ? (
                      <img src={selectedTaskForDetail.images[0]} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon size={32} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[10px] text-slate-300 italic font-medium">任务执行后将自动渲染高质封面</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <ImageIcon size={12} className="text-slate-200" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 大纲与内容 */}
                <div className="md:col-span-2 space-y-6">
                  <section className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <TypeIcon size={14} className="text-red-400" />
                      当前发布标题
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-slate-800 font-bold text-lg leading-tight">{selectedTaskForDetail.title}</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <List size={14} className="text-red-400" />
                      核心内容逻辑
                    </h4>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-red-200 pl-4 py-1">
                        {selectedTaskForDetail.content || "正文内容将在执行阶段根据大纲自动填充，确保每篇笔记内容的唯一性与活跃度。"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTaskForDetail.tags.map((tag, i) => (
                          <span key={i} className="text-xs text-blue-500 font-medium">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">任务执行排期</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">开始日期</p>
                        <p className="font-bold">{processedTasks.find(t => t.id === selectedTaskForDetail.id)?.startDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">预计结束</p>
                        <p className="font-bold">{processedTasks.find(t => t.id === selectedTaskForDetail.id)?.endDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">发布频次</p>
                        <p className="font-bold">{selectedTaskForDetail.publishFrequency} 次/日</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">成功率</p>
                        <p className="font-bold">100%</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedTaskForDetail(null)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                关闭预览
              </button>
              <button 
                onClick={() => {
                  onExecute([selectedTaskForDetail.id]);
                  setSelectedTaskForDetail(null);
                }}
                className="px-8 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-600 active:scale-95 transition-all"
              >
                立即启动该主题
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishPlanView;
