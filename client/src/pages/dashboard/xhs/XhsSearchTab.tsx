import React, { useState } from 'react';
import { xhsApi } from '../../../api';
import { Search, Loader2, Heart, MessageCircle, Bookmark, X } from 'lucide-react';

interface Feed {
  noteCard: {
    noteId: string;
    displayTitle: string;
    type: string;
    user: { userId: string; nickname: string; avatar: string };
    cover: { urlDefault: string; urlPre: string; width: number; height: number };
    interactInfo: { likedCount: string; commentCount: string; collectedCount: string; shareCount: string };
    xsecToken: string;
  };
}

interface FeedDetail {
  noteId: string;
  title: string;
  desc: string;
  type: string;
  imageList: { urlDefault: string }[];
  interactInfo: { likedCount: string; commentCount: string; collectedCount: string; shareCount: string };
  tagList: { name: string }[];
  comments: { id: string; content: string; userName: string; createTime: string; likeCount: string }[];
}

const SORT_OPTIONS = [
  { value: '', label: '综合' },
  { value: '最新', label: '最新' },
  { value: '最多点赞', label: '最多点赞' },
  { value: '最多评论', label: '最多评论' },
  { value: '最多收藏', label: '最多收藏' },
];

const NOTE_TYPE_OPTIONS = [
  { value: '', label: '不限' },
  { value: '图文', label: '图文' },
  { value: '视频', label: '视频' },
];

const TIME_OPTIONS = [
  { value: '', label: '不限' },
  { value: '一天内', label: '一天内' },
  { value: '一周内', label: '一周内' },
  { value: '半年内', label: '半年内' },
];

const XhsSearchTab: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [noteType, setNoteType] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [results, setResults] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [detail, setDetail] = useState<FeedDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await xhsApi.searchFeeds({
        keyword,
        ...(sortBy && { sort_by: sortBy }),
        ...(noteType && { note_type: noteType }),
        ...(publishTime && { publish_time: publishTime }),
      });
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (feed: Feed) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await xhsApi.getFeedDetail({
        feed_id: feed.noteCard.noteId,
        xsec_token: feed.noteCard.xsecToken,
      });
      setDetail(res.data.data);
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="搜索小红书笔记..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
            className="px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            搜索
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 focus:border-rose-300 outline-none">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 focus:border-rose-300 outline-none">
            {NOTE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={publishTime} onChange={(e) => setPublishTime(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 focus:border-rose-300 outline-none">
            {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((feed) => (
            <div
              key={feed.noteCard.noteId}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              onClick={() => openDetail(feed)}
            >
              <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                <img
                  src={feed.noteCard.cover?.urlPre || feed.noteCard.cover?.urlDefault}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-slate-800 line-clamp-2">{feed.noteCard.displayTitle || '无标题'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <img src={feed.noteCard.user?.avatar} alt="" className="w-4 h-4 rounded-full" />
                  <span className="text-[10px] text-slate-400 truncate">{feed.noteCard.user?.nickname}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{feed.noteCard.interactInfo?.likedCount || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{feed.noteCard.interactInfo?.commentCount || 0}</span>
                  <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{feed.noteCard.interactInfo?.collectedCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searched ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <p className="text-slate-400 text-sm">未找到相关笔记</p>
        </div>
      ) : null}

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => { setDetail(null); setDetailLoading(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
              </div>
            ) : detail ? (
              <>
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 truncate">{detail.title || '笔记详情'}</h3>
                  <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {detail.imageList && detail.imageList.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {detail.imageList.map((img, idx) => (
                        <img key={idx} src={img.urlDefault} alt="" className="rounded-xl w-full aspect-square object-cover" />
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{detail.desc}</p>
                  {detail.tagList && detail.tagList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {detail.tagList.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-medium">#{tag.name}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-50">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" />{detail.interactInfo?.likedCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-blue-400" />{detail.interactInfo?.commentCount || 0}</span>
                    <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-amber-400" />{detail.interactInfo?.collectedCount || 0}</span>
                  </div>
                  {detail.comments && detail.comments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">评论</h4>
                      {detail.comments.map((c) => (
                        <div key={c.id} className="p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-700">{c.userName}</span>
                            <span className="text-[10px] text-slate-400">{c.createTime}</span>
                          </div>
                          <p className="text-xs text-slate-600">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default XhsSearchTab;
