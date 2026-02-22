import React, { useState } from 'react';
import { generateApi } from '../../api';
import { getFullImageUrl } from '../../utils/format';
import { useAuthStore } from '../../store/authStore';
import {
  Sparkles, Wand2, Image as ImageIcon, Copy, Check,
  AlertCircle, ChevronRight, Zap, Loader2,
  Search, Globe, Upload, ChevronDown, MousePointer2,
  X, Maximize2, RefreshCw, Download
} from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  audience: string;
  features: string;
  style: string;
}

interface NotePage {
  pageNumber: number;
  type: 'cover' | 'content' | 'summary';
  title: string;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
}

interface Outline {
  titleSuggestions: string[];
  pages: NotePage[];
}

interface GeneratedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

const STYLES = ['种草', '测评', '教程', '故事', '对比', '生活方式'];

const PRESETS = [
  {
    name: '✨ 美妆护肤',
    data: { name: '超能量焕白面霜', audience: '20-35岁爱美女性', description: '含有高浓度烟酰胺，温和不刺激，28天见证皮肤透亮过程。', features: '美白祛斑, 深层滋润, 敏感肌友好', style: '教程' }
  },
  {
    name: '🎧 数码测评',
    data: { name: '未来派降噪耳机 Pro', audience: '学生/上班族', description: '自适应主动降噪技术，40小时长续航，支持全场景空间音频。', features: '45dB降噪, 触控交互, 无感佩戴', style: '测评' }
  },
  {
    name: '🍰 探店分享',
    data: { name: '抹茶熔岩蛋糕', audience: '甜品爱好者', description: '选用顶级宇治抹茶，切开后流心如绸缎般丝滑，颜值与口感并存。', features: '纯手工制作, 现点现烤, 爆浆口感', style: '生活方式' }
  }
];

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
  const [form, setForm] = useState<ProductForm>({ name: '', description: '', audience: '小红书社交媒体用户', features: '', style: '插画风格' });
  const [magicTopic, setMagicTopic] = useState('');
  const [pageCount, setPageCount] = useState(5);
  const [mode, setMode] = useState<'magic' | 'detailed'>('magic');
  const [outline, setOutline] = useState<Outline | null>(null);
  const [note, setNote] = useState<GeneratedNote | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; pageNumber: number } | null>(null);

  const updateForm = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleGenerateOutline = async (overrideForm?: Partial<ProductForm>) => {
    const formData = overrideForm ? { ...form, ...overrideForm } : form;
    setLoading('outline');
    setError('');
    try {
      const res = await generateApi.generateOutline({ ...formData, pageCount });
      const data = res.data.data;
      setOutline(data.outline);
      updateCredits(data.remainingCredits);
      setSelectedTitle(data.outline.titleSuggestions[0] || '');
      setStep('outline');
    } catch (err: any) {
      setError(err.response?.data?.error || '生成失败');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateNote = async () => {
    if (!outline) return;
    setLoading('note');
    setError('');
    try {
      const res = await generateApi.generateNote({
        outline: { ...outline, titleSuggestions: [selectedTitle] },
        productInfo: form
      });
      setNote(res.data.data.note);
      updateCredits(res.data.data.remainingCredits);
      setStep('note');
    } catch (err: any) {
      setError(err.response?.data?.error || '生成失败');
    } finally {
      setLoading(null);
    }
  };

  const handleGeneratePageImage = async (pageNumber: number) => {
    if (!outline || !note) return;
    const page = outline.pages.find(p => p.pageNumber === pageNumber);
    if (!page) return;

    setLoading(`image-${pageNumber}`);
    try {
      const res = await generateApi.generateImage({
        prompt: page.imagePrompt,
        noteId: note.id,
        pageNumber
      });

      const newImageUrl = res.data.data.imageUrl;
      setOutline(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pages: prev.pages.map(p => p.pageNumber === pageNumber ? { ...p, imageUrl: newImageUrl } : p)
        };
      });
      setImages(prev => [...prev, newImageUrl]);
      updateCredits(res.data.data.remainingCredits);
    } catch (err: any) {
      setError(err.response?.data?.error || '图片生成失败');
    } finally {
      setLoading(null);
    }
  };

  const handleBatchGenerateImages = async () => {
    if (!outline || !note) return;
    const pendingPages = outline.pages.filter(p => !p.imageUrl);
    if (pendingPages.length === 0) return;

    for (const page of pendingPages) {
      await handleGeneratePageImage(page.pageNumber);
    }
  };

  const updateOutlinePage = (pageNumber: number, field: keyof NotePage, value: string) => {
    setOutline(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pages: prev.pages.map(p => p.pageNumber === pageNumber ? { ...p, [field]: value } : p)
      };
    });
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      {step === 'form' && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-1000 slide-in-from-bottom-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-xs font-bold mb-8 hover:bg-white hover:shadow-sm transition-all cursor-default text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">
            妙记
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900 mb-6 drop-shadow-sm leading-tight">
            灵感<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">一触即发</span><br />
            让创作从未如此简单
          </h1>

          <p className="max-w-xl text-lg text-slate-500 mb-12 leading-relaxed">
            输入你的创意主题，让 AI 帮你生成<span className="text-rose-500 font-bold mx-1">爆款标题</span>、<span className="text-rose-500 font-bold mx-1">正文</span>和<span className="text-rose-500 font-bold mx-1">封面图</span>。
          </p>

          {/* Magic Search Bar */}
          <div className="w-full max-w-2xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-orange-300 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative card rounded-[30px] p-2 pr-4 shadow-xl shadow-rose-100/50 flex flex-col gap-4 border-2 border-slate-100/50 backdrop-blur-xl bg-white/80">
              <div className="flex items-center gap-3 pl-4">
                <Search className="w-6 h-6 text-slate-300 group-focus-within:text-rose-400 transition-colors" />
                <input
                  value={magicTopic}
                  onChange={(e) => setMagicTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && magicTopic) {
                      const magicForm = { name: magicTopic, description: `关于${magicTopic}的小红书笔记` };
                      setForm(f => ({ ...f, ...magicForm }));
                      handleGenerateOutline(magicForm);
                    }
                  }}
                  placeholder="输入主题，也支持粘贴/拖拽图片作为参考"
                  className="w-full py-4 text-lg bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-300 font-medium"
                />
              </div>

              <div className="h-px bg-slate-100/60 mx-4" />

              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-2">
                  <div className="relative group/sel">
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold transition-all border border-slate-100">
                      页数 <span className="text-rose-500">{pageCount}</span> <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-full left-0 mb-2 invisible group-hover/sel:visible bg-white border border-slate-100 rounded-xl shadow-xl p-1 grid grid-cols-2 gap-1 min-w-[120px] transition-all z-20">
                      {[3, 5, 7, 9, 12].map(n => (
                        <button key={n} onClick={() => setPageCount(n)} className={`px-4 py-2 text-xs font-bold rounded-lg text-left ${pageCount === n ? 'bg-rose-50 text-rose-500' : 'text-slate-500 hover:bg-slate-50'}`}>
                          {n} 页
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold transition-all border border-slate-100 opacity-60 cursor-not-allowed">
                    <ImageIcon className="w-3.5 h-3.5" /> 上传图片
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold transition-all border border-slate-100 opacity-60 cursor-not-allowed">
                    <Globe className="w-3.5 h-3.5" /> 联网搜索
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (!magicTopic) return;
                    const magicForm = { name: magicTopic, description: `关于${magicTopic}的小红书笔记` };
                    setForm(f => ({ ...f, ...magicForm }));
                    handleGenerateOutline(magicForm);
                  }}
                  disabled={!magicTopic || !!loading}
                  className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-30 disabled:grayscale text-white text-sm font-bold shadow-lg shadow-rose-200 transition-all flex items-center gap-2"
                >
                  {loading === 'outline' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                  生成 <span className="text-white/60 font-medium font-serif">↵</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-8 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Tab</span> 获取历史记录
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Enter</span> 开始生成
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-rose-400 transition-colors" onClick={() => setMode(mode === 'magic' ? 'detailed' : 'magic')}>
              <MousePointer2 className="w-3.5 h-3.5" /> {mode === 'magic' ? '切换到详细模式' : '回到极简模式'}
            </div>
          </div>

          {/* Detailed mode fallback */}
          {mode === 'detailed' && (
            <div className="mt-16 w-full max-w-4xl text-left animate-in fade-in zoom-in-95 duration-500">
              <div className="card p-6 space-y-5 bg-white shadow-lg border-2 border-slate-50">
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-orange-700">快速测试：选择一个主题自动填充</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const preset = PRESETS.find(p => p.name === e.target.value);
                      if (preset) setForm(preset.data);
                    }}
                    className="bg-white border border-orange-200 text-[10px] font-bold text-orange-600 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="">-- 选择预设主题 --</option>
                    {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

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
                    消耗 <strong className="text-rose-500">{CREDIT_COSTS.outline}</strong> 积分即可获得爆款大纲
                  </div>
                  <button
                    onClick={() => handleGenerateOutline()}
                    disabled={!form.name || !form.description || loading === 'outline'}
                    className="px-6 py-3 rounded-xl gradient-btn font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading === 'outline' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    生成大纲
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step indicator (Only show after step 1) */}
      {step !== 'form' && (
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
      )}

      {/* Step 2: Outline Editor */}
      {step === 'outline' && outline && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" /> 选择标题
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outline.titleSuggestions.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTitle(t)}
                  className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${selectedTitle === t ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-100 hover:border-rose-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {outline.pages.map((page) => (
              <div key={page.pageNumber} className="card p-4 space-y-3 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${page.type === 'cover' ? 'bg-rose-100 text-rose-600' : page.type === 'summary' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    P{page.pageNumber} · {page.type === 'cover' ? '封面' : page.type === 'summary' ? '总结' : '内容'}
                  </span>
                </div>
                <input
                  value={page.title}
                  onChange={(e) => updateOutlinePage(page.pageNumber, 'title', e.target.value)}
                  className="w-full font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0"
                  placeholder="页面标题"
                />
                <textarea
                  value={page.content}
                  onChange={(e) => updateOutlinePage(page.pageNumber, 'content', e.target.value)}
                  rows={4}
                  className="w-full text-xs text-slate-600 bg-slate-50 rounded-lg p-2 border-none focus:ring-0 resize-none"
                  placeholder="页面文案内容..."
                />
                <div className="pt-2 border-t border-slate-50 mt-auto">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">生图提示词</label>
                  <textarea
                    value={page.imagePrompt}
                    onChange={(e) => updateOutlinePage(page.pageNumber, 'imagePrompt', e.target.value)}
                    rows={2}
                    className="w-full text-[10px] text-slate-500 bg-transparent border-none focus:ring-0 p-0 leading-tight"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep('form')} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
              上一步
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Zap className="w-4 h-4 text-rose-400" />
                消耗 <strong className="text-rose-500">10</strong> 积分即可获得笔记详情
              </span>
              <button
                onClick={handleGenerateNote}
                disabled={loading === 'note'}
                className="px-8 py-3 rounded-xl gradient-btn font-bold shadow-lg shadow-rose-200 flex items-center gap-2"
              >
                {loading === 'note' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                生成完整笔记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Full Note */}
      {step === 'note' && note && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
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

          {/* Batch Image generation */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-rose-500" /> 批量配图生成
                </h3>
                <p className="text-xs text-slate-500 mt-1">根据大纲页面为每一页生成对应的视觉内容</p>
              </div>
              <button
                onClick={handleBatchGenerateImages}
                disabled={!!loading && loading.startsWith('image-')}
                className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold hover:bg-orange-100 transition-all flex items-center gap-2"
              >
                {!!loading && loading.startsWith('image-') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                批量开始生成
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {outline?.pages.map((page) => (
                <div key={page.pageNumber} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                  {page.imageUrl ? (
                    <>
                      <img
                        src={getFullImageUrl(page.imageUrl)}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewImage({ url: getFullImageUrl(page.imageUrl!), pageNumber: page.pageNumber })}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewImage({ url: getFullImageUrl(page.imageUrl!), pageNumber: page.pageNumber })}
                          className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white shadow-lg transition-all"
                          title="放大查看"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGeneratePageImage(page.pageNumber)}
                          disabled={loading === `image-${page.pageNumber}`}
                          className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white shadow-lg transition-all disabled:opacity-50"
                          title="重新生成"
                        >
                          {loading === `image-${page.pageNumber}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <a
                          href={getFullImageUrl(page.imageUrl!)}
                          download={`page-${page.pageNumber}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white shadow-lg transition-all"
                          title="下载图片"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-[10px] text-slate-400 mb-3 line-clamp-2">{page.title}</p>
                      <button
                        onClick={() => handleGeneratePageImage(page.pageNumber)}
                        disabled={loading === `image-${page.pageNumber}`}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:border-rose-400 hover:text-rose-500 transition-all flex items-center gap-1"
                      >
                        {loading === `image-${page.pageNumber}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Wand2 className="w-3 h-3" /> 生成图片</>}
                      </button>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/20 backdrop-blur-sm text-[8px] font-bold text-white uppercase tracking-wider">
                    P{page.pageNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => { setStep('form'); setOutline(null); setNote(null); setImages([]); setMagicTopic(''); }} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
              重新创作
            </button>
            <button onClick={() => setStep('outline')} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium">
              回到大纲
            </button>
          </div>
        </div>
      )}
      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); handleGeneratePageImage(previewImage.pageNumber); }}
              disabled={loading === `image-${previewImage.pageNumber}`}
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all disabled:opacity-50"
              title="重新生成"
            >
              {loading === `image-${previewImage.pageNumber}` ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </button>
            <a
              href={previewImage.url}
              download={`page-${previewImage.pageNumber}.png`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
              title="下载图片"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setPreviewImage(null)}
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={previewImage.url}
            alt={`Preview P${previewImage.pageNumber}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium">
            P{previewImage.pageNumber}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratorPage;
