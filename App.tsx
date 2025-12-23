
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import OutlineForm from './components/OutlineForm';
import OutlineDisplay from './components/OutlineDisplay';
import NoteGeneratorView from './components/NoteGeneratorView';
import HistoryTable from './components/HistoryTable';
import { AppView, ProductInfo, NoteOutline, GeneratedNote } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.OUTLINE_GENERATOR);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [currentOutline, setCurrentOutline] = useState<NoteOutline | null>(null);
  const [history, setHistory] = useState<GeneratedNote[]>([]);
  const [activeNote, setActiveNote] = useState<GeneratedNote | null>(null);

  // Load history from local storage
  useEffect(() => {
    const saved = localStorage.getItem('xhs_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('xhs_history', JSON.stringify(history));
  }, [history]);

  const handleGenerateOutline = async (info: ProductInfo) => {
    setLoading(true);
    try {
      setProductInfo(info);
      const outline = await geminiService.generateOutline(info);
      setCurrentOutline(outline);
    } catch (error) {
      console.error("Failed to generate outline:", error);
      alert("生成大纲失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOutline = async () => {
    if (!currentOutline || !productInfo) return;
    
    setLoading(true);
    setCurrentView(AppView.NOTE_GENERATION);
    
    const newNote: GeneratedNote = {
      id: Date.now().toString(),
      productName: productInfo.name,
      style: productInfo.style,
      title: '',
      content: '',
      tags: [],
      images: [],
      createdAt: new Date().toLocaleString(),
      status: 'pending'
    };
    
    setActiveNote(newNote);

    try {
      // 1. Generate text content
      const fullNoteText = await geminiService.generateFullNote(currentOutline, productInfo);
      
      // 2. Generate images in parallel
      const imagePromises = currentOutline.imagePrompts.map(prompt => geminiService.generateImage(prompt));
      const images = await Promise.all(imagePromises);

      const completedNote: GeneratedNote = {
        ...newNote,
        title: fullNoteText.title,
        content: fullNoteText.content,
        tags: fullNoteText.tags,
        images: images,
        status: 'completed'
      };

      setActiveNote(completedNote);
      setHistory(prev => [completedNote, ...prev]);
    } catch (error) {
      console.error("Failed to generate full note:", error);
      setActiveNote(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    setHistory(prev => prev.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const handleViewNote = (note: GeneratedNote) => {
    setActiveNote(note);
    setCurrentView(AppView.NOTE_GENERATION);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {currentView === AppView.OUTLINE_GENERATOR && (
            <>
              <OutlineForm onGenerate={handleGenerateOutline} loading={loading} />
              {currentOutline && (
                <OutlineDisplay 
                  outline={currentOutline} 
                  onConfirm={handleConfirmOutline} 
                  loading={loading} 
                />
              )}
              <div className="mt-12">
                <HistoryTable 
                  history={history} 
                  onView={handleViewNote} 
                  onDelete={handleDeleteNote} 
                />
              </div>
            </>
          )}

          {currentView === AppView.NOTE_GENERATION && (
            <NoteGeneratorView 
              note={activeNote} 
              loading={loading} 
              onBack={() => setCurrentView(AppView.OUTLINE_GENERATOR)} 
            />
          )}

          {currentView === AppView.SETTINGS && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4">系统设置</h2>
              <p className="text-slate-500">API Key 已通过环境变量配置。此处可扩展其他偏好设置。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
