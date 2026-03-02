import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Zap } from 'lucide-react';
import { cn } from '../components/Sidebar';
import { TEMPLATES, CATEGORIES } from '../data/templates';

export const TemplatesGallery = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = TEMPLATES.filter(t => activeCategory === 'All' || t.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Video Templates</h1>
        <p className="text-gray-400 mt-2">
          Browse our library of 5-second product video templates. Each template includes an AI prompt layer,
          editing configuration, and marketing copy.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
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

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(template => (
          <div key={template.id} className="group bg-[#111111] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-colors flex flex-col">
            {/* Thumbnail */}
            <div className="aspect-[9/16] relative overflow-hidden bg-[#0a0a0a]">
              <img
                src={template.thumbnailUrl}
                alt={template.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-7 h-7 text-white ml-1" />
                </div>
              </div>
              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {template.category}
              </span>
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-white text-base">{template.name}</h3>
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 whitespace-nowrap shrink-0">
                  <Zap className="w-3 h-3" />{template.creditCost} credits
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3 flex-1">{template.description}</p>

              {/* Marketing hook */}
              <p className="text-xs italic text-gray-500 mb-3 border-l-2 border-indigo-500/30 pl-3">
                "{template.marketing.hook}"
              </p>

              {/* Best For badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {template.marketing.bestFor.map(b => (
                  <span key={b} className="text-[11px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {b}
                  </span>
                ))}
              </div>

              {/* Style modifiers */}
              <div className="flex flex-wrap gap-1 mb-5">
                {template.prompt.styleModifiers.slice(0, 3).map(m => (
                  <span key={m} className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                    {m}
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate('/templates-5s', { state: { templateId: template.id } })}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
