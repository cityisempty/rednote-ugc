import React, { useState, useEffect } from 'react';
import { xhsApi } from '../../../api';
import { Loader2, Heart, MessageCircle, Bookmark, X, Send } from 'lucide-react';

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

const XhsContentTab: React.FC = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<FeedDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const res = await xhsApi.listFeeds();
        setFeeds(res.data.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchFeeds();
  }, []);

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

  const handleLike = async (feed: Feed) => {
    setActionLoading('like');
    try {
      await xhsApi.likeFeed({ feed_id: feed.noteCard.noteId, xsec_token: feed.noteCard.xsecToken });
    } catch {
      // silent
    } finally {
      setActionLoading('');
    }
  };

  const handleFavorite = async (feed: Feed) => {
    setActionLoading('fav');
    try {
      await xhsApi.favoriteFeed({ feed_id: feed.noteCard.noteId, xsec_token: feed.noteCard.xsecToken });
    } catch {
      // silent
    } finally {
      setActionLoading('');
    }
  };

  const handleComment = async () => {
    if (!detail || !comment.trim()) return;
    setActionLoading('comment');
    try {
      const feed = feeds.find((f) => f.noteCard.noteId === detail.noteId);
      if (feed) {
        await xhsApi.commentOnFeed({
          feed_id: detail.noteId,
          xsec_token: feed.noteCard.xsecToken,
          content: comment,
        });
        setComment('');
      }
    } catch {
      // silent
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Feed Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {feeds.map((feed) => (
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
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{feed.noteCard.interactInfo?.likedCount || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{feed.noteCard.interactInfo?.commentCount || 0}</span>
                <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{feed.noteCard.interactInfo?.collectedCount || 0}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(feed); }}
                  disabled={actionLoading === 'like'}
                  className="px-2 py-1 rounded-lg bg-rose-50 text-rose-500 text-[10px] font-medium hover:bg-rose-100 transition"
                >
                  点赞
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFavorite(feed); }}
                  disabled={actionLoading === 'fav'}
                  className="px-2 py-1 rounded-lg bg-amber-50 text-amber-500 text-[10px] font-medium hover:bg-amber-100 transition"
                >
                  收藏
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {feeds.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <p className="text-slate-400 text-sm">暂无笔记</p>
        </div>
      )}

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
                  {/* Images */}
                  {detail.imageList && detail.imageList.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {detail.imageList.map((img, idx) => (
                        <img key={idx} src={img.urlDefault} alt="" className="rounded-xl w-full aspect-square object-cover" />
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{detail.desc}</p>

                  {/* Tags */}
                  {detail.tagList && detail.tagList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {detail.tagList.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-medium">#{tag.name}</span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-50">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" />{detail.interactInfo?.likedCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-blue-400" />{detail.interactInfo?.commentCount || 0}</span>
                    <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-amber-400" />{detail.interactInfo?.collectedCount || 0}</span>
                  </div>

                  {/* Comments */}
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

                {/* Comment Input */}
                <div className="p-4 border-t border-slate-100 flex items-center gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="写评论..."
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleComment(); }}
                  />
                  <button
                    onClick={handleComment}
                    disabled={actionLoading === 'comment' || !comment.trim()}
                    className="p-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default XhsContentTab;
