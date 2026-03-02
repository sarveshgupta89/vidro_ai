import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Zap, Play } from 'lucide-react';
import { cn } from '../components/Sidebar';
import { TEMPLATES, CATEGORIES, SUB_CATEGORIES, FILTER_OPTIONS } from '../data/templates';

type ActiveFilters = {
  season: string[];
  occasion: string[];
  styleAndTone: string[];
  colorPalette: string[];
  videoDuration: string[];
  platform: string[];
};

const EMPTY_FILTERS: ActiveFilters = {
  season: [], occasion: [], styleAndTone: [],
  colorPalette: [], videoDuration: [], platform: [],
};

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white',
    )}
  >
    {label}
  </button>
);

export const TemplatesGallery = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

  const subCategories = activeCategory !== 'All' ? SUB_CATEGORIES[activeCategory] ?? [] : [];

  const toggleFilter = (group: keyof ActiveFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter(v => v !== value)
        : [...prev[group], value],
    }));
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
  };

  const activeFilterCount = Object.values(filters).flat().length;

  const filtered = useMemo(() => {
    return TEMPLATES.filter(t => {
      if (activeCategory !== 'All' && t.category !== activeCategory) return false;
      if (activeSubCategory && t.subCategory !== activeSubCategory) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.description.toLowerCase().includes(search.toLowerCase()) &&
          !t.category.toLowerCase().includes(search.toLowerCase()) &&
          !t.subCategory.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.season.length && !filters.season.some(s => t.filters.season.includes(s))) return false;
      if (filters.occasion.length && !filters.occasion.some(s => t.filters.occasion.includes(s))) return false;
      if (filters.styleAndTone.length && !filters.styleAndTone.some(s => t.filters.styleAndTone.includes(s))) return false;
      if (filters.colorPalette.length && !filters.colorPalette.some(s => t.filters.colorPalette.includes(s))) return false;
      if (filters.platform.length && !filters.platform.some(s => t.filters.platform.includes(s))) return false;
      if (filters.videoDuration.length) {
        const durationLabel = `${t.durationSeconds} seconds`;
        if (!filters.videoDuration.some(d => d.startsWith(String(t.durationSeconds)))) return false;
      }
      return true;
    });
  }, [search, activeCategory, activeSubCategory, filters]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create Video with Templates</h1>
        <p className="text-gray-400 mt-1 text-sm">Select a template</p>
      </div>

      {/* Search + Advanced Filters toggle */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search templates by name, style, occasion, or season..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border',
            showAdvanced || activeFilterCount > 0
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10',
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setActiveSubCategory(''); }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sub-category chips */}
      {subCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {subCategories.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubCategory(activeSubCategory === sub ? '' : sub)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                activeSubCategory === sub
                  ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20',
              )}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Advanced Filters panel */}
      {showAdvanced && (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Advanced Filters</h3>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Clear All
                </button>
              )}
              <button onClick={() => setShowAdvanced(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Season</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.season.map(v => (
                    <FilterChip key={v} label={v} active={filters.season.includes(v)} onClick={() => toggleFilter('season', v)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Style &amp; Tone</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.styleAndTone.map(v => (
                    <FilterChip key={v} label={v} active={filters.styleAndTone.includes(v)} onClick={() => toggleFilter('styleAndTone', v)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Video Duration</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.videoDuration.map(v => (
                    <button
                      key={v}
                      onClick={() => toggleFilter('videoDuration', v)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border',
                        filters.videoDuration.includes(v)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : v === '15 seconds'
                          ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed opacity-60'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white',
                      )}
                      disabled={v === '15 seconds'}
                      title={v === '15 seconds' ? 'Pro plan required' : undefined}
                    >
                      {v}{v === '15 seconds' ? ' 🔒' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Occasion</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.occasion.map(v => (
                    <FilterChip key={v} label={v} active={filters.occasion.includes(v)} onClick={() => toggleFilter('occasion', v)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Color Palette</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.colorPalette.map(v => (
                    <FilterChip key={v} label={v} active={filters.colorPalette.includes(v)} onClick={() => toggleFilter('colorPalette', v)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Platform</p>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.platform.map(v => (
                    <FilterChip key={v} label={v} active={filters.platform.includes(v)} onClick={() => toggleFilter('platform', v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-4">
        Showing {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        {activeCategory !== 'All' ? ` for ${activeCategory}` : ''}
        {activeSubCategory ? ` › ${activeSubCategory}` : ''}
      </p>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <SlidersHorizontal className="w-10 h-10 text-gray-700 mb-4" />
          <p className="text-gray-400 font-medium">No templates match your filters</p>
          <button onClick={() => { setFilters(EMPTY_FILTERS); setActiveCategory('All'); setActiveSubCategory(''); setSearch(''); }}
            className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(template => (
            <div
              key={template.id}
              onClick={() => navigate('/templates-5s', { state: { templateId: template.id } })}
              className="group cursor-pointer bg-[#111111] border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/40 transition-colors"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-[#0a0a0a]">
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </div>
                </div>
                <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {template.category}
                </span>
                <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />{template.creditCost}
                </span>
              </div>
              <div className="p-3">
                <p className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors truncate">{template.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{template.subCategory}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.marketing.bestFor.slice(0, 2).map(b => (
                    <span key={b} className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
