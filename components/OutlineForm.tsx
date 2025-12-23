
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

  const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

  return (
    <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">创作灵感输入</h2>
        <p className="text-slate-500 text-sm">提供详细的主题信息，AI将为您构建爆款文案架构</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>主题内容</label>
            <input
              type="text"
              required
              placeholder="例如："
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
              placeholder="例如：职场白领, 25-35岁"
              className={inputClass}
              value={formData.audience}
              onChange={e => setFormData({ ...formData, audience: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>输入你的创意主题，让 AI 帮你生成爆款标题、正文和封面图</label>
          <textarea
            rows={4}
            required
            placeholder="输入你的创意主题，让 AI 帮你生成爆款标题、正文和封面图"
            className={inputClass}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>核心功能 (关键词)</label>
          <input
            type="text"
            placeholder="例如：极简设计、24小时长效、环保材质"
            className={inputClass}
            value={formData.features}
            onChange={e => setFormData({ ...formData, features: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>爆款风格</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STYLES.map(style => (
              <button
                key={style.value}
                type="button"
                onClick={() => setFormData({ ...formData, style: style.value })}
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all border ${
                  formData.style === style.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
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
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
          {loading ? '生成中...' : '开始生成大纲'}
        </button>
      </form>
    </section>
  );
};

export default OutlineForm;
