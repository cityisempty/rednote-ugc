
import React from 'react';
import { LayoutGrid, PenTool, CalendarRange, Settings, LogOut } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: AppView.OUTLINE_GENERATOR, label: '笔记大纲生成', icon: PenTool },
    { id: AppView.PUBLISH_PLAN, label: '发布计划管理', icon: CalendarRange },
    { id: AppView.SETTINGS, label: '系统设置', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0 z-50">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
          <LayoutGrid className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 tracking-tight">XHS Creator</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Plan & Generate</p>
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
                  ? 'bg-red-500 text-white shadow-lg shadow-red-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 text-red-600 font-bold flex items-center justify-center rounded-full text-sm">
            Admin
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">内容运营负责人</p>
            <p className="text-xs text-slate-400 truncate">高级管理员</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
