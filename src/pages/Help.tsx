import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+971', flag: '🇦🇪', label: 'AE' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
];

export const Help = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    countryCode: '+1',
    phone: '',
    source: '',
    purpose: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission delay
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const inputClass = "w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
        <p className="text-gray-400">Thanks for reaching out. We'll follow up at {form.email} shortly.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', countryCode: '+1', phone: '', source: '', purpose: '', message: '' }); }}
          className="mt-8 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium text-white transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-white text-center mb-10">Get In Touch</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="What should we call you?"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            required
            placeholder="We'll send you a follow-up email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Phone <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={form.countryCode}
              onChange={e => handleChange('countryCode', e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code} value={c.code} className="bg-[#1a1a1a]">
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              required
              placeholder="We'll send you a follow-up text"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* How did you hear */}
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            How did you hear about us? <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="X (Twitter), LinkedIn, Word of mouth..."
            value={form.source}
            onChange={e => handleChange('source', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Purpose <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Why are you interested in using Vidro AI?"
            value={form.purpose}
            onChange={e => handleChange('purpose', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={5}
            placeholder="Provide more information - your website link, requirements, or name of person who referred you"
            value={form.message}
            onChange={e => handleChange('message', e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl font-semibold text-white text-sm transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Submit'}
        </button>
      </form>
    </div>
  );
};
