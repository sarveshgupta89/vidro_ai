import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Search, RefreshCw, Loader2, Film, Image as ImageIcon } from 'lucide-react';
import { cn } from '../components/Sidebar';

type Project = {
  id: string;
  type: string;
  status: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: { toDate: () => Date } | null;
};

const MOCK_PROJECTS: Project[] = [
  { id: 'mock1', type: '5s_template', status: 'video_generated', imageUrl: 'https://picsum.photos/seed/proj1/300/400', createdAt: null },
  { id: 'mock2', type: 'long_form', status: 'video_generated', imageUrl: 'https://picsum.photos/seed/proj2/300/400', createdAt: null },
  { id: 'mock3', type: '5s_template', status: 'video_generated', imageUrl: 'https://picsum.photos/seed/proj3/300/400', createdAt: null },
];

const SORT_OPTIONS = ['Date Created', 'Date Modified'];
const MEDIA_OPTIONS = ['All Media', 'Images', 'Videos'];

export const Assets = () => {
  const { user } = useUserStore();
  const [tab, setTab] = useState<'short' | 'long'>('short');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Date Created');
  const [mediaFilter, setMediaFilter] = useState('All Media');

  const fetchProjects = async () => {
    setLoading(true);
    if (!user || !isFirebaseConfigured) {
      setProjects(MOCK_PROJECTS);
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const filtered = projects
    .filter(p => tab === 'short' ? p.type === '5s_template' : p.type !== '5s_template')
    .filter(p => {
      if (mediaFilter === 'Images') return !!p.imageUrl && !p.videoUrl;
      if (mediaFilter === 'Videos') return !!p.videoUrl;
      return true;
    })
    .filter(p => !search || p.id.toLowerCase().includes(search.toLowerCase()));

  const formatDate = (ts: Project['createdAt']) => {
    if (!ts) return '';
    try { return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return ''; }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Assets</h1>
        <button
          onClick={fetchProjects}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6">
        {(['short', 'long'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white',
            )}
          >
            {t === 'short' ? 'Short Form Videos' : 'Long Form Videos'}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {SORT_OPTIONS.map(o => <option key={o} value={o} className="bg-[#1a1a1a]">{o}</option>)}
        </select>
        <select
          value={mediaFilter}
          onChange={e => setMediaFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {MEDIA_OPTIONS.map(o => <option key={o} value={o} className="bg-[#1a1a1a]">{o}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Film className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-400 font-medium">No {tab === 'short' ? 'short form' : 'long form'} assets yet</p>
          <p className="text-gray-600 text-sm mt-1">Generated videos will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(project => (
            <div key={project.id} className="group cursor-pointer">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#111111] border border-white/10 group-hover:border-indigo-500/40 transition-colors relative">
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={`Project ${project.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                {project.videoUrl && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Film className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2 truncate">Project {project.id.slice(0, 6).toUpperCase()}</p>
              {project.createdAt && (
                <p className="text-[10px] text-gray-600">{formatDate(project.createdAt)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
