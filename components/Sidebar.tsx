
import React from 'react';
import { LayoutGrid, PenTool, Image, Settings, LogOut } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: AppView.OUTLINE_GENERATOR, label: '笔记大纲生成', icon: PenTool },
    { id: AppView.NOTE_GENERATION, label: '图文素材库', icon: Image },
    { id: AppView.SETTINGS, label: '系统设置', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <LayoutGrid className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 tracking-tight">内容制作平台</h1>
          <p className="text-xs text-slate-400">小红书创作助手</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-full text-sm">
            李
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">李明明</p>
            <p className="text-xs text-slate-400 truncate">内容制作组</p>
          </div>
          <button className="text-slate-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
