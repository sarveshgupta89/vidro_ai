import React from 'react';

export const DummyPage = ({ title, description }: { title: string, description: string }) => (
  <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>
    <div className="bg-[#111111] rounded-2xl border border-white/10 p-8 text-gray-300 leading-relaxed">
      <p>{description}</p>
      <div className="mt-8 space-y-4">
        <div className="h-4 bg-white/5 rounded w-3/4"></div>
        <div className="h-4 bg-white/5 rounded w-full"></div>
        <div className="h-4 bg-white/5 rounded w-5/6"></div>
        <div className="h-4 bg-white/5 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);
