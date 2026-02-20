
import React, { useState } from 'react';
import { ProductInfo, AppView } from '../types';
import { STYLES } from '../constants';
import { Sparkles, Loader2 } from 'lucide-react';

interface OutlineFormProps {
  onGenerate: (info: ProductInfo) => void;
  loading: boolean;
}

const OutlineForm: React.FC<OutlineFormProps> = ({ onGenerate, loading }) => {
  const [formData, setFormData] = useState<ProductInfo>({
    name: '',
    audience: '',
    description: '',
    features: '',
    style: STYLES[0].value
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300 shadow-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2";

  return (
    <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">创作灵感输入</h2>
        <p className="text-slate-500 text-sm">提供详细的发布主题信息，AI 将为您构建爆款文案架构</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>发布主题名称</label>
            <input
              type="text"
              required
              placeholder="例如：夏日极简穿搭、职场解压神器"
              className={inputClass}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>目标受众</label>
            <input
              type="text"
              required
              placeholder="例如：职场白领, 大学生, 25-35岁女性"
              className={inputClass}
              value={formData.audience}
              onChange={e => setFormData({ ...formData, audience: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>主题详细创意描述</label>
          <textarea
            rows={4}
            required
            placeholder="输入你的创意主题或内容草案，让 AI 帮你扩展成爆款标题、正文和封面图构思..."
            className={inputClass}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>核心关键词 / 卖点</label>
          <input
            type="text"
            placeholder="例如：极简主义、性价比、氛围感、新手友好"
            className={inputClass}
            value={formData.features}
            onChange={e => setFormData({ ...formData, features: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>期望文案风格</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STYLES.map(style => (
              <button
                key={style.value}
                type="button"
                onClick={() => setFormData({ ...formData, style: style.value })}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all border ${
                  formData.style === style.value
                    ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-100'
                    : 'bg-white text-slate-500 border-slate-100 hover:border-red-200'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-500 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
          {loading ? 'AI 内容深度挖掘中...' : '生成主题大纲'}
        </button>
      </form>
    </section>
  );
};

export default OutlineForm;
