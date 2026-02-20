import React, { useState } from 'react';
import { generateApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import {
  Sparkles, Wand2, Image as ImageIcon, Copy, Check,
  AlertCircle, ChevronRight, Zap
} from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  audience: string;
  features: string;
  style: string;
}

interface Outline {
  titleSuggestions: string[];
  hook: string;
  mainPoints: string[];
  imagePrompts: string[];
}

interface GeneratedNote {
  title: string;
  content: string;
  tags: string[];
}

const STYLES = ['种草', '测评', '教程', '故事', '对比', '生活方式'];

const CREDIT_COSTS = {
  outline: 5,
  note: 10,
  image: 15,
};

const GeneratorPage: React.FC = () => {
  const { user, updateCredits } = useAuthStore();
  const [step, setStep] = useState<'form' | 'outline' | 'note'>('form');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProductForm>({ name: '', description: '', audience: '', features: '', style: '种草' });
  const [outline, setOutline] = useState<Outline | null>(null);
  const [note, setNote] = useState<GeneratedNote | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const updateForm = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleGenerateOutline = async () => {
    setLoading('outline');
    setError('');
    try {
      const res = await generateApi.generateOutline(form);
      setOutline(res.data.data.outline);
      updateCredits(res.data.data.remainingCredits);
      setSelectedTitle(res.data.data.outline.titleSuggestions[0]);
      setStep('outline');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '生成失败，请重试';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateNote = async () => {
    if (!outline) return;
    setLoading('note');
    setError('');
    try {
      const res = await generateApi.generateNote({ outline: { ...outline, titleSuggestions: [selectedTitle] }, productInfo: form });
      setNote(res.data.data.note);
      updateCredits(res.data.data.remainingCredits);
      setStep('note');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '生成失败，请重试';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    setLoading(`image-${prompt}`);
    setError('');
    try {
      const res = await generateApi.generateImage({ prompt });
      setImages((prev) => [...prev, res.data.data.imageUrl]);
      updateCredits(res.data.data.remainingCredits);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '图片生成失败';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">创作中心</h1>
        <p className="text-slate-500 mt-1">AI 驱动的小红书爆款内容生成器</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { key: 'form', label: '填写信息' },
          { key: 'outline', label: '生成大纲' },
          { key: 'note', label: '完整笔记' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.key}>
            <span className={`px-3 py-1 rounded-full font-medium ${step === s.key ? 'bg-rose-500 text-white' : (step === 'note' && i < 2) || (step === 'outline' && i < 1) ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              {s.label}
            </span>
            {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Form */}
      {step === 'form' && (
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">产品名称 *</label>
              <input value={form.name} onChange={updateForm('name')} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition" placeholder="如：超能量防晒霜" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">目标受众 *</label>
              <input value={form.audience} onChange={updateForm('audience')} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition" placeholder="如：18-25岁爱美女生" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">产品描述 *</label>
            <textarea value={form.description} onChange={updateForm('description')} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition resize-none" placeholder="简要描述产品特点、优势..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">核心功能</label>
            <input value={form.features} onChange={updateForm('features')} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition" placeholder="如：SPF50+, 防水, 轻薄透气" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">内容风格</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button key={s} onClick={() => setForm((f) => ({ ...f, style: s }))} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${form.style === s ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Zap className="w-4 h-4 text-rose-400" />
              生成大纲消耗 <strong className="text-rose-500">{CREDIT_COSTS.outline}</strong> 积分（当前：{user?.credits ?? 0}）
            </div>
            <button
              onClick={handleGenerateOutline}
              disabled={!form.name || !form.description || !form.audience || loading === 'outline'}
              className="px-6 py-3 rounded-xl gradient-btn font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading === 'outline' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              生成大纲
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Outline */}
      {step === 'outline' && outline && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-rose-500" />选择标题</h3>
            <div className="space-y-2">
              {outline.titleSuggestions.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTitle(t)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedTitle === t ? 'border-rose-400 bg-rose-50' : 'border-slate-100 hover:border-rose-200'}`}
                >
                  <span className="text-sm font-medium text-slate-800">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-3">开头钩子</h3>
            <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-4">{outline.hook}</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-3">内容要点</h3>
            <ul className="space-y-2">
              {outline.mainPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep('form')} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
              重新填写
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Zap className="w-4 h-4 text-rose-400" />
                生成全文 <strong className="text-rose-500">{CREDIT_COSTS.note}</strong> 积分
              </span>
              <button onClick={handleGenerateNote} disabled={loading === 'note'} className="px-6 py-3 rounded-xl gradient-btn font-medium disabled:opacity-50 flex items-center gap-2">
                {loading === 'note' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                生成笔记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Full Note */}
      {step === 'note' && note && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="font-bold text-lg text-slate-800">{note.title}</h3>
              <button onClick={() => copyText(note.title, 'title')} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0">
                {copied === 'title' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <pre className="whitespace-pre-wrap text-sm text-slate-600 font-sans leading-relaxed bg-slate-50 rounded-xl p-4">{note.content}</pre>
              <button onClick={() => copyText(note.content, 'content')} className="absolute top-3 right-3 p-2 rounded-lg bg-white text-slate-400 hover:text-rose-500 shadow-sm transition-colors">
                {copied === 'content' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {note.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-xs font-medium">#{tag}</span>
              ))}
            </div>
          </div>

          {/* Image generation */}
          {outline && (
            <div className="card p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-rose-500" />配图生成</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {outline.imagePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleGenerateImage(prompt)}
                    disabled={loading === `image-${prompt}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-left disabled:opacity-50"
                  >
                    {loading === `image-${prompt}` ? (
                      <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="text-xs text-slate-600 line-clamp-2">{prompt}</span>
                    <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{CREDIT_COSTS.image}分</span>
                  </button>
                ))}
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((src, i) => (
                    <img key={i} src={src} alt={`生成图片 ${i + 1}`} className="w-full aspect-square object-cover rounded-xl" />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={() => { setStep('form'); setOutline(null); setNote(null); setImages([]); }} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
              重新创作
            </button>
            <button onClick={() => setStep('outline')} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
              回到大纲
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorPage;
