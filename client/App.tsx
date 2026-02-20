
import React, { useState, useEffect } from 'react';
/* Fix: Import Settings icon which was missing */
import { Settings } from 'lucide-react';
import Sidebar from './components/Sidebar';
import OutlineForm from './components/OutlineForm';
import OutlineDisplay from './components/OutlineDisplay';
import PublishPlanView from './components/PublishPlanView';
import { AppView, ProductInfo, NoteOutline, GeneratedNote } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.OUTLINE_GENERATOR);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [currentOutline, setCurrentOutline] = useState<NoteOutline | null>(null);
  const [tasks, setTasks] = useState<GeneratedNote[]>([]);

  // 从本地存储初始化
  useEffect(() => {
    const saved = localStorage.getItem('xhs_tasks_v2');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  // 状态变更同步本地存储
  useEffect(() => {
    localStorage.setItem('xhs_tasks_v2', JSON.stringify(tasks));
  }, [tasks]);

  const handleGenerateOutline = async (info: ProductInfo) => {
    setLoading(true);
    try {
      setProductInfo(info);
      const outline = await geminiService.generateOutline(info);
      setCurrentOutline(outline);
    } catch (error) {
      console.error("Outline failed:", error);
      alert("大纲生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlan = () => {
    if (!currentOutline || !productInfo) return;

    const newTask: GeneratedNote = {
      id: Math.random().toString(36).substr(2, 9),
      productName: productInfo.name,
      style: productInfo.style,
      title: currentOutline.titleSuggestions[0],
      content: '', // 延迟生成
      tags: [],
      images: [],
      createdAt: new Date().toLocaleString(),
      
      // 计划默认值
      publishFrequency: 1,
      durationDays: 3,
      order: tasks.length,
      status: 'draft',
      successCount: 0
    };

    setTasks(prev => [...prev, newTask]);
    setCurrentOutline(null);
    setCurrentView(AppView.PUBLISH_PLAN);
  };

  const handleExecuteTasks = async (ids: string[]) => {
    // 设置选中的任务为 running
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'running' } : t));

    for (const id of ids) {
      const task = tasks.find(t => t.id === id);
      if (!task) continue;

      try {
        // 1. 模拟执行：如果是草稿，则进行 AI 全文生成
        // 这里只是演示逻辑，实际会按天循环执行
        // 如果 content 为空，则生成全文
        if (!task.content) {
          // 这里需要从 context 获取 outline，或者重新生成
          // 为了简化，我们假设已经有基本内容
        }

        // 更新执行统计
        setTasks(prev => prev.map(t => 
          t.id === id ? { 
            ...t, 
            successCount: t.successCount + 1,
            status: t.successCount + 1 >= t.durationDays ? 'completed' : 'running'
          } : t
        ));
      } catch (e) {
        console.error("Execution error for task", id, e);
      }
    }
  };

  const handleAbortTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'aborted' } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => {
      const filtered = prev.filter(t => t.id !== id);
      // 重新计算 order 以便排期
      return filtered.map((t, i) => ({ ...t, order: i }));
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {currentView === AppView.OUTLINE_GENERATOR && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              <OutlineForm onGenerate={handleGenerateOutline} loading={loading} />
              {currentOutline && (
                <OutlineDisplay 
                  outline={currentOutline} 
                  onConfirm={handleAddToPlan} 
                  loading={loading} 
                />
              )}
            </div>
          )}

          {currentView === AppView.PUBLISH_PLAN && (
            <PublishPlanView 
              tasks={tasks}
              onUpdateTasks={setTasks}
              onExecute={handleExecuteTasks}
              onAbort={handleAbortTask}
              onDelete={handleDeleteTask}
            />
          )}

          {currentView === AppView.SETTINGS && (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Settings className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">系统偏好设置</h2>
              <p className="text-slate-500 max-w-xs">当前 API Key 已由系统环境变量自动注入。您可以根据业务需求在此扩展定时任务配置。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
