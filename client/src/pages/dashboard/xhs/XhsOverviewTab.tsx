import React, { useState, useEffect } from 'react';
import { xhsApi } from '../../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Heart, MessageCircle, Bookmark, Share2, Loader2 } from 'lucide-react';

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

const COLORS = ['#f43f5e', '#3b82f6', '#f59e0b', '#10b981'];

const XhsOverviewTab: React.FC = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>;
  }

  const totalLikes = feeds.reduce((s, f) => s + Number(f.noteCard?.interactInfo?.likedCount || 0), 0);
  const totalComments = feeds.reduce((s, f) => s + Number(f.noteCard?.interactInfo?.commentCount || 0), 0);
  const totalCollects = feeds.reduce((s, f) => s + Number(f.noteCard?.interactInfo?.collectedCount || 0), 0);
  const totalShares = feeds.reduce((s, f) => s + Number(f.noteCard?.interactInfo?.shareCount || 0), 0);

  const statCards = [
    { label: '笔记总数', value: feeds.length, icon: Share2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: '总点赞', value: totalLikes, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: '总评论', value: totalComments, icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '总收藏', value: totalCollects, icon: Bookmark, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const barData = feeds.slice(0, 10).map((f) => ({
    name: (f.noteCard?.displayTitle || '无标题').slice(0, 8),
    点赞: Number(f.noteCard?.interactInfo?.likedCount || 0),
    评论: Number(f.noteCard?.interactInfo?.commentCount || 0),
    收藏: Number(f.noteCard?.interactInfo?.collectedCount || 0),
    分享: Number(f.noteCard?.interactInfo?.shareCount || 0),
  }));

  const pieData = [
    { name: '点赞', value: totalLikes },
    { name: '评论', value: totalComments },
    { name: '收藏', value: totalCollects },
    { name: '分享', value: totalShares },
  ].filter((d) => d.value > 0);

  const topPosts = [...feeds]
    .sort((a, b) => {
      const totalA = Number(a.noteCard?.interactInfo?.likedCount || 0) + Number(a.noteCard?.interactInfo?.commentCount || 0) + Number(a.noteCard?.interactInfo?.collectedCount || 0);
      const totalB = Number(b.noteCard?.interactInfo?.likedCount || 0) + Number(b.noteCard?.interactInfo?.commentCount || 0) + Number(b.noteCard?.interactInfo?.collectedCount || 0);
      return totalB - totalA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {feeds.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-bold text-sm text-slate-700 mb-4">互动数据对比</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="点赞" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="评论" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="收藏" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="分享" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-bold text-sm text-slate-700 mb-4">互动分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Posts Table */}
      {topPosts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50">
            <h3 className="font-bold text-sm text-slate-700">热门笔记</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {topPosts.map((feed) => (
              <div key={feed.noteCard.noteId} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition">
                <img
                  src={feed.noteCard.cover?.urlPre || feed.noteCard.cover?.urlDefault}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{feed.noteCard.displayTitle || '无标题'}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" />{feed.noteCard.interactInfo?.likedCount || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-blue-400" />{feed.noteCard.interactInfo?.commentCount || 0}</span>
                  <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-amber-400" />{feed.noteCard.interactInfo?.collectedCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {feeds.length === 0 && (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center">
          <p className="text-slate-400 text-sm">暂无笔记数据</p>
        </div>
      )}
    </div>
  );
};

export default XhsOverviewTab;
