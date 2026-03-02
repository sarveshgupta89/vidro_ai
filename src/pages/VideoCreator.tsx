import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { captureEvent } from '../lib/posthog';
import {
  Loader2, Download, RefreshCw, CheckCircle2,
  Image as ImageIcon, Video, Film, ChevronDown, ChevronUp,
  Link2, Upload, Zap, AlertCircle, X, Info,
} from 'lucide-react';
import { cn } from '../components/Sidebar';

// ── Static Data ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'None',        label: 'None',        emoji: '⊘' },
  { id: 'Apparel',     label: 'Apparel',      emoji: '👕' },
  { id: 'Beauty',      label: 'Beauty',       emoji: '💄' },
  { id: 'Jewelry',     label: 'Jewelry',      emoji: '💍' },
  { id: 'Home Decor',  label: 'Home decor',   emoji: '🛋️' },
  { id: 'Electronics', label: 'Electronics',  emoji: '💻' },
];

const ASPECT_RATIOS = ['9:16', '3:4', '1:1', '16:9'];

const ETHNICITY_OPTIONS = [
  'South Asian – Indian',
  'East Asian – Chinese',
  'East Asian – Japanese',
  'South East Asian',
  'Middle Eastern',
  'Caucasian – Northern European',
  'Caucasian – Southern European',
  'Hispanic / Latina',
  'Black – West African',
  'Black – East African',
  'Mixed Heritage',
];

const SUB_ETHNICITY_OPTIONS = [
  'Fair / Porcelain',
  'Light Beige',
  'Medium / Olive',
  'Warm Tan',
  'Deep Brown',
  'Rich Ebony',
];

type OptionItem = { id: string; label: string; img: string | null };

const CLOTHING_TOPS: OptionItem[] = [
  { id: 'None', label: 'None', img: null },
  { id: 'white-tee',     label: 'Classic White Tee',       img: 'https://picsum.photos/seed/top1/160/220' },
  { id: 'black-blazer',  label: 'Black Blazer',             img: 'https://picsum.photos/seed/top2/160/220' },
  { id: 'silk-blouse',   label: 'Silk Blouse',              img: 'https://picsum.photos/seed/top3/160/220' },
  { id: 'crop-top',      label: 'Linen Crop Top',           img: 'https://picsum.photos/seed/top4/160/220' },
  { id: 'denim-jacket',  label: 'Denim Jacket',             img: 'https://picsum.photos/seed/top5/160/220' },
  { id: 'knit-sweater',  label: 'Knit Sweater',             img: 'https://picsum.photos/seed/top6/160/220' },
];

const CLOTHING_BOTTOMS: OptionItem[] = [
  { id: 'None', label: 'None', img: null },
  { id: 'tailored-trousers', label: 'High-Waisted Tailored Trousers', img: 'https://picsum.photos/seed/bot1/160/220' },
  { id: 'saree-skirt',       label: 'Silk Saree Skirt',               img: 'https://picsum.photos/seed/bot2/160/220' },
  { id: 'sharara',           label: 'Flared Sharara Pants',           img: 'https://picsum.photos/seed/bot3/160/220' },
  { id: 'cigarette',         label: 'Cigarette Pants',                img: 'https://picsum.photos/seed/bot4/160/220' },
  { id: 'lehenga',           label: 'Embroidered Lehenga Skirt',      img: 'https://picsum.photos/seed/bot5/160/220' },
  { id: 'satin-bias',        label: 'Satin Bias Cut Skirt',           img: 'https://picsum.photos/seed/bot6/160/220' },
];

const FOOTWEAR_OPTIONS: OptionItem[] = [
  { id: 'None', label: 'None', img: null },
  { id: 'stilettos',   label: 'Stiletto Heels',   img: 'https://picsum.photos/seed/shoe1/160/160' },
  { id: 'ballet',      label: 'Ballet Flats',      img: 'https://picsum.photos/seed/shoe2/160/160' },
  { id: 'block-heels', label: 'Block Heels',       img: 'https://picsum.photos/seed/shoe3/160/160' },
  { id: 'ankle-boots', label: 'Ankle Boots',       img: 'https://picsum.photos/seed/shoe4/160/160' },
  { id: 'strappy',     label: 'Strappy Sandals',   img: 'https://picsum.photos/seed/shoe5/160/160' },
];

const HAIRSTYLE_OPTIONS: OptionItem[] = [
  { id: 'None', label: 'None', img: null },
  { id: 'high-bun',      label: 'High Sleek Bun',                 img: 'https://picsum.photos/seed/hair1/160/160' },
  { id: 'long-waves',    label: 'Long Beachwaves (Centre Part)',  img: 'https://picsum.photos/seed/hair2/160/160' },
  { id: 'side-braid',    label: 'Side Swept Braid (French)',      img: 'https://picsum.photos/seed/hair3/160/160' },
  { id: 'low-ponytail',  label: 'Low Sleek Ponytail',             img: 'https://picsum.photos/seed/hair4/160/160' },
  { id: 'half-up',       label: 'Half-Up do with Bangs',          img: 'https://picsum.photos/seed/hair5/160/160' },
];

const MAKEUP_OPTIONS: OptionItem[] = [
  { id: 'None', label: 'None', img: null },
  { id: 'natural',   label: 'Natural Glow',    img: 'https://picsum.photos/seed/make1/160/160' },
  { id: 'bold-lip',  label: 'Bold Red Lip',    img: 'https://picsum.photos/seed/make2/160/160' },
  { id: 'smoky',     label: 'Smoky Eye',       img: 'https://picsum.photos/seed/make3/160/160' },
  { id: 'editorial', label: 'Editorial Glam',  img: 'https://picsum.photos/seed/make4/160/160' },
];

const BACKGROUND_OPTIONS: OptionItem[] = [
  { id: 'None', label: 'None', img: null },
  { id: 'studio-black', label: 'Studio – Dramatic Black',  img: 'https://picsum.photos/seed/bg1/200/120' },
  { id: 'studio-pink',  label: 'Studio – Pink Inter',      img: 'https://picsum.photos/seed/bg2/200/120' },
  { id: 'botanical',    label: 'Botanical – Lush Green',   img: 'https://picsum.photos/seed/bg3/200/120' },
  { id: 'urban',        label: 'Urban Street – City',      img: 'https://picsum.photos/seed/bg4/200/120' },
  { id: 'earthy',       label: 'Earthy – City Tones',      img: 'https://picsum.photos/seed/bg5/200/120' },
  { id: 'minimalist',   label: 'Minimalist White Studio',  img: 'https://picsum.photos/seed/bg6/200/120' },
];

const SURFACE_OPTIONS: OptionItem[] = [
  { id: 'None', label: 'None', img: null },
  { id: 'surface-pink', label: 'Surface – Pink',        img: 'https://picsum.photos/seed/surf1/200/120' },
  { id: 'velvet',       label: 'Royal Velvet Cushion',  img: 'https://picsum.photos/seed/surf2/200/120' },
  { id: 'mannequin',    label: 'Mannequin Display',     img: 'https://picsum.photos/seed/surf3/200/120' },
  { id: 'wood',         label: 'Rustic Wood Table',     img: 'https://picsum.photos/seed/surf4/200/120' },
  { id: 'marble',       label: 'Marble Platform',       img: 'https://picsum.photos/seed/surf5/200/120' },
];

// ── Image Option Card ─────────────────────────────────────────────────────────

function ImageCard({
  item, selected, onSelect, tall = false,
}: { item: OptionItem; selected: boolean; onSelect: () => void; tall?: boolean }) {
  const sizeClass = tall ? 'w-[72px] h-[96px]' : 'w-[112px] h-[72px]';

  if (item.id === 'None') {
    return (
      <button
        onClick={onSelect}
        className={cn(
          'shrink-0 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all',
          sizeClass,
          selected
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/10 bg-white/5 hover:border-white/20',
        )}
      >
        <X className={cn('w-5 h-5', selected ? 'text-indigo-400' : 'text-gray-500')} />
        <span className={cn('text-[11px] font-medium', selected ? 'text-indigo-400' : 'text-gray-500')}>None</span>
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      title={item.label}
      className={cn(
        'shrink-0 rounded-xl border-2 overflow-hidden transition-all relative group',
        sizeClass,
        selected ? 'border-indigo-500' : 'border-white/10 hover:border-white/30',
      )}
    >
      {item.img && <img src={item.img} alt={item.label} className="w-full h-full object-cover" />}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 flex items-end p-1 transition-opacity',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <span className="text-[10px] text-white font-medium leading-tight line-clamp-2">{item.label}</span>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

// ── Horizontal Carousel ───────────────────────────────────────────────────────

function HorizontalCarousel({
  items, value, onChange, tall = false,
}: { items: OptionItem[]; value: string; onChange: (id: string) => void; tall?: boolean }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
      {items.map(item => (
        <React.Fragment key={item.id}>
          <ImageCard
            item={item}
            selected={value === item.id}
            onSelect={() => onChange(item.id)}
            tall={tall}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Accordion Section ─────────────────────────────────────────────────────────

function AccordionSection({
  num, title, subtitle, open, onToggle, children,
}: {
  num: number | string; title: string; subtitle?: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">
            {num}
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-6 pb-5 pt-1 space-y-4">{children}</div>}
    </div>
  );
}

// ── Summary Row ───────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={cn('font-medium', value === 'None' ? 'text-gray-400' : 'text-white')}>{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export const VideoCreator = () => {
  const { user, userData } = useUserStore();

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [category,    setCategory]    = useState('None');
  const [duration,    setDuration]    = useState(30);
  const [aspectRatio, setAspectRatio] = useState('3:4');
  const [inputMode,   setInputMode]   = useState<'url' | 'upload'>('url');
  const [url,         setUrl]         = useState('');

  // Model customization
  const [gender,         setGender]         = useState<'Female' | 'Male'>('Female');
  const [ethnicity,      setEthnicity]      = useState('None');
  const [subEthnicity,   setSubEthnicity]   = useState('None');
  const [clothingTop,    setClothingTop]    = useState('None');
  const [clothingBottom, setClothingBottom] = useState('None');
  const [footwear,       setFootwear]       = useState('None');
  const [hairstyle,      setHairstyle]      = useState('None');
  const [makeup,         setMakeup]         = useState('None');

  // Background & surface
  const [background,   setBackground]   = useState('None');
  const [bgColor,      setBgColor]      = useState('#ffffff');
  const [surface,      setSurface]      = useState('None');
  const [surfaceColor, setSurfaceColor] = useState('#ffffff');

  // Accordion state
  const [open, setOpen] = useState<Record<string, boolean>>({
    s1: true, s2: true, s3: true, s4: true,
    ethnicity: false, subEthnicity: false,
    top: false, bottom: true, footwear: true, hair: true, makeup: false,
  });
  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Project state ─────────────────────────────────────────────────────────
  const [loading,   setLoading]   = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project,   setProject]   = useState<any>(null);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!projectId || !isFirebaseConfigured) return;
    const unsub = onSnapshot(doc(db, 'projects', projectId), snap => {
      if (snap.exists()) setProject({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [projectId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStartSetup = async () => {
    if (!user) return;
    if ((userData?.credits_balance || 0) < 7) {
      setError('Insufficient credits. Please upgrade.');
      return;
    }
    setLoading(true);
    setError('');

    const customization = {
      category, duration: `${duration}s`, aspectRatio,
      gender, ethnicity, subEthnicity,
      clothingTop, clothingBottom, footwear, hairstyle, makeup,
      background, bgColor, surface, surfaceColor,
    };

    if (!isFirebaseConfigured) {
      setProjectId('mock-long-form');
      setProject({ status: 'generating_images' });
      setTimeout(() => {
        setProject({
          status: 'awaiting_image_review',
          generated_images_json: Array.from({ length: 7 }).map((_, i) => ({
            id: `img_${i}`, url: `https://picsum.photos/seed/mock_${i}/800/1200`, status: 'approved',
          })),
        });
        setLoading(false);
      }, 3000);
      return;
    }

    try {
      const scrapeRes = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const scrapeData = await scrapeRes.json();

      const docRef = await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        type: 'long_form',
        status: 'generating_images',
        scraped_assets_json: scrapeData.data,
        customization_settings: customization,
        createdAt: serverTimestamp(),
      });

      setProjectId(docRef.id);
      captureEvent('long_form_started', { projectId: docRef.id });

      await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: docRef.id }),
      });
    } catch (err: any) {
      setError(err.message);
      setProjectId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveImages = async () => {
    if (!user || !projectId) return;
    setLoading(true);

    if (!isFirebaseConfigured) {
      setProject((p: any) => ({ ...p, status: 'generating_videos' }));
      setTimeout(() => {
        setProject((p: any) => ({
          ...p,
          status: 'awaiting_video_review',
          generated_clips_json: Array.from({ length: 6 }).map((_, i) => ({
            id: `clip_${i}`, url: 'https://www.w3schools.com/html/mov_bbb.mp4', status: 'approved',
          })),
        }));
        setLoading(false);
      }, 4000);
      return;
    }

    try {
      await fetch('/api/generate-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVideos = async () => {
    if (!user || !projectId) return;
    setLoading(true);

    if (!isFirebaseConfigured) {
      setProject((p: any) => ({ ...p, status: 'generating_final' }));
      setTimeout(() => {
        setProject((p: any) => ({
          ...p, status: 'completed',
          final_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        }));
        setLoading(false);
      }, 4000);
      return;
    }

    try {
      await fetch('/api/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateImage = async (imageId: string) => {
    if (!isFirebaseConfigured) { alert(`Mock regenerating image ${imageId}`); return; }
    await fetch('/api/regenerate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, imageId }),
    });
  };

  const handleRegenerateVideo = async (clipId: string) => {
    if (!isFirebaseConfigured) { alert(`Mock regenerating video ${clipId}`); return; }
    await fetch('/api/regenerate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, clipId }),
    });
  };

  const resetCreator = () => { setProjectId(null); setProject(null); setUrl(''); };

  // ── Stepper ───────────────────────────────────────────────────────────────
  let currentStep = 1;
  if (project?.status === 'generating_images' || project?.status === 'awaiting_image_review') currentStep = 2;
  if (project?.status === 'generating_videos'  || project?.status === 'awaiting_video_review')  currentStep = 3;
  if (project?.status === 'generating_final'   || project?.status === 'completed')              currentStep = 4;

  const STEPS = [
    { num: 1, label: 'Setup',       sub: 'Product & Template' },
    { num: 2, label: 'AI Images',   sub: 'Review & Select' },
    { num: 3, label: 'Video Clips', sub: 'Review & Select' },
    { num: 4, label: 'Final',       sub: 'Generate Video' },
  ];

  // Derived label helpers
  const labelOf = (options: OptionItem[], id: string) =>
    options.find(o => o.id === id)?.label ?? id;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Long-Form Video Creator</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-start mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center text-center shrink-0" style={{ minWidth: 80 }}>
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors mb-1',
                currentStep >= s.num ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-500',
                currentStep === s.num && 'ring-4 ring-indigo-500/20',
              )}>
                {s.num}
              </div>
              <p className={cn('text-xs font-semibold leading-tight', currentStep >= s.num ? 'text-indigo-400' : 'text-gray-500')}>
                {s.label}
              </p>
              <p className="text-[10px] text-gray-600 leading-tight mt-0.5">{s.sub}</p>
            </div>
            {i < 3 && (
              <div className={cn('flex-1 h-px mt-4 mx-1', currentStep > s.num ? 'bg-indigo-500/40' : 'bg-white/10')} />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-5 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* ── STEP 1: Setup ─────────────────────────────────────────────────── */}
      {!projectId && (
        <div className="flex-1 overflow-y-auto pb-12 space-y-4">

          {/* ── Section 1: Video Setup ─────────────────────────────────────── */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggle('s1')}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">1</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Video Setup</p>
                  <p className="text-xs text-gray-500">Step 1: Core Configuration</p>
                </div>
              </div>
              {open.s1 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {open.s1 && (
              <div className="px-6 pb-6 space-y-6">

                {/* Product Category */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product Category</p>
                  <div className="flex flex-wrap gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 w-20 h-20 transition-all text-sm font-medium',
                          category === cat.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20',
                        )}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-[11px]">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration + Aspect Ratio */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Video Duration</p>
                      <span className="text-sm font-bold text-indigo-400">{duration.toFixed(1)}s</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Length</span>
                      <input
                        type="range" min={15} max={60} step={0.5}
                        value={duration}
                        onChange={e => setDuration(Number(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Aspect Ratio</p>
                    <select
                      value={aspectRatio}
                      onChange={e => setAspectRatio(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      {ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* What to Expect */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <ImageIcon className="w-4 h-4" />, value: '7 Images',    desc: 'Model shots & product close-ups' },
                    { icon: <Video className="w-4 h-4" />,     value: '6 Video Clips', desc: 'Smooth, cinematic clips' },
                    { icon: <Film className="w-4 h-4" />,      value: `~${duration}s`, desc: 'Final video duration' },
                  ].map(item => (
                    <div key={item.value} className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{item.value}</p>
                        <p className="text-[11px] text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Tabs */}
                <div>
                  <div className="flex rounded-xl overflow-hidden border border-white/10 w-fit mb-4">
                    {(['url', 'upload'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setInputMode(mode)}
                        className={cn(
                          'flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors',
                          inputMode === mode ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10',
                        )}
                      >
                        {mode === 'url' ? <Link2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {mode === 'url' ? 'Scrape From URL' : 'Manual Upload'}
                      </button>
                    ))}
                  </div>

                  {inputMode === 'url' && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Product URL</p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={e => setUrl(e.target.value)}
                          placeholder="Enter Product URL..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          disabled={!url}
                          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/10 disabled:text-gray-500 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          Scrape
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1.5">Hint: Only Amazon, Walmart, and Myntra product URLs are supported.</p>
                    </div>
                  )}

                  {inputMode === 'upload' && (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all">
                      <Upload className="w-6 h-6 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400">Click to upload product images</p>
                      <p className="text-xs text-gray-600">PNG, JPEG up to 15 MB</p>
                      <input type="file" accept="image/*" multiple className="hidden" />
                    </label>
                  )}
                </div>

                {/* Project Assets placeholder */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project Assets</p>
                  <div className="h-16 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                    <p className="text-xs text-gray-600">No assets uploaded yet</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Model Customization ────────────────────────────── */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggle('s2')}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">2</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Model Customization</p>
                  <p className="text-xs text-gray-500">Ethnicity, facial profiles, and wardrobe</p>
                </div>
              </div>
              {open.s2 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {open.s2 && (
              <div className="px-6 pb-6 space-y-3">

                {/* Gender Toggle */}
                <div className="flex rounded-xl overflow-hidden border border-white/10 w-full mb-4">
                  {(['Female', 'Male'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors',
                        gender === g ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10',
                      )}
                    >
                      <span>{g === 'Female' ? '♀' : '♂'}</span>{g}
                    </button>
                  ))}
                </div>

                {/* 01 Primary Identity & Ethnicity */}
                <AccordionSection
                  num="01" title="Primary Identity & Ethnicity"
                  open={open.ethnicity} onToggle={() => toggle('ethnicity')}
                >
                  <div className="flex flex-wrap gap-2">
                    {['None', ...ETHNICITY_OPTIONS].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setEthnicity(opt)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          ethnicity === opt
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20',
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </AccordionSection>

                {/* 02 Sub-Ethnicity & Tone */}
                <AccordionSection
                  num="02" title="Sub-Ethnicity & Tone"
                  open={open.subEthnicity} onToggle={() => toggle('subEthnicity')}
                >
                  <div className="flex flex-wrap gap-2">
                    {['None', ...SUB_ETHNICITY_OPTIONS].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSubEthnicity(opt)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          subEthnicity === opt
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20',
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </AccordionSection>

                {/* 03 Clothing: Top */}
                <AccordionSection
                  num="03" title="Clothing: Top Selection"
                  open={open.top} onToggle={() => toggle('top')}
                >
                  <HorizontalCarousel items={CLOTHING_TOPS} value={clothingTop} onChange={setClothingTop} tall />
                </AccordionSection>

                {/* 04 Clothing: Bottom */}
                <AccordionSection
                  num="04" title="Clothing: Bottom Selection"
                  open={open.bottom} onToggle={() => toggle('bottom')}
                >
                  <HorizontalCarousel items={CLOTHING_BOTTOMS} value={clothingBottom} onChange={setClothingBottom} tall />
                </AccordionSection>

                {/* 05 Footwear */}
                <AccordionSection
                  num="05" title="Footwear"
                  open={open.footwear} onToggle={() => toggle('footwear')}
                >
                  <HorizontalCarousel items={FOOTWEAR_OPTIONS} value={footwear} onChange={setFootwear} tall />
                </AccordionSection>

                {/* 06 Hairstyle & Grooming */}
                <AccordionSection
                  num="06" title="Hairstyle & Grooming"
                  open={open.hair} onToggle={() => toggle('hair')}
                >
                  <HorizontalCarousel items={HAIRSTYLE_OPTIONS} value={hairstyle} onChange={setHairstyle} />
                </AccordionSection>

                {/* 07 Makeup & Presentation */}
                <AccordionSection
                  num="07" title="Makeup & Presentation"
                  open={open.makeup} onToggle={() => toggle('makeup')}
                >
                  <HorizontalCarousel items={MAKEUP_OPTIONS} value={makeup} onChange={setMakeup} />
                </AccordionSection>
              </div>
            )}
          </div>

          {/* ── Section 3: Background & Surface ───────────────────────────── */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggle('s3')}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">3</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Background & Surface Customization</p>
                  <p className="text-xs text-gray-500">Detailed Atmosphere and Product Stage</p>
                </div>
              </div>
              {open.s3 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {open.s3 && (
              <div className="px-6 pb-6 space-y-5">

                {/* 01 Model Background Environment */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center">01</span>
                      <p className="text-xs font-semibold text-gray-300">Model Background Environment</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Color</span>
                      <label className="relative cursor-pointer">
                        <div
                          className="w-7 h-7 rounded-lg border border-white/20 overflow-hidden"
                          style={{ backgroundColor: bgColor }}
                        />
                        <input
                          type="color" value={bgColor}
                          onChange={e => setBgColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                  </div>
                  <HorizontalCarousel items={BACKGROUND_OPTIONS} value={background} onChange={setBackground} />
                </div>

                {/* 02 Product Placement Surface */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center">02</span>
                      <p className="text-xs font-semibold text-gray-300">Product Placement Surface</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Color</span>
                      <label className="relative cursor-pointer">
                        <div
                          className="w-7 h-7 rounded-lg border border-white/20 overflow-hidden"
                          style={{ backgroundColor: surfaceColor }}
                        />
                        <input
                          type="color" value={surfaceColor}
                          onChange={e => setSurfaceColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                  </div>
                  <HorizontalCarousel items={SURFACE_OPTIONS} value={surface} onChange={setSurface} />
                </div>
              </div>
            )}
          </div>

          {/* ── Section 4: Finalize Image Production ──────────────────────── */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggle('s4')}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">4</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Finalize Image Production</p>
                  <p className="text-xs text-gray-500">Review settings and execute generation</p>
                </div>
              </div>
              {open.s4 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {open.s4 && (
              <div className="px-6 pb-6 space-y-5">

                {/* Configuration Summary + Preview */}
                <div className="grid grid-cols-3 gap-4">

                  {/* Core Specifications */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-4 h-4 text-indigo-400">⚙</span>
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Core Specifications</p>
                    </div>
                    <SummaryRow label="Category"     value={category === 'None' ? 'None' : category} />
                    <SummaryRow label="Duration"     value={`${duration.toFixed(1)}s`} />
                    <SummaryRow label="Aspect Ratio" value={aspectRatio} />
                  </div>

                  {/* Environment & Surface */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-4 h-4 text-indigo-400">🌿</span>
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Environment & Surface</p>
                    </div>
                    <SummaryRow label="Background"   value={labelOf(BACKGROUND_OPTIONS, background)} />
                    <SummaryRow label="Surface"      value={labelOf(SURFACE_OPTIONS, surface)} />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Model background color</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm border border-white/20" style={{ backgroundColor: bgColor }} />
                        <span className="font-medium text-gray-300">
                          {bgColor === '#ffffff' ? 'White' : bgColor.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Product placement surface color</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm border border-white/20" style={{ backgroundColor: surfaceColor }} />
                        <span className="font-medium text-gray-300">
                          {surfaceColor === '#ffffff' ? 'White' : surfaceColor.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider self-start">Image Preview</p>
                    <div className="flex-1 w-full flex items-center justify-center rounded-lg bg-white/5 min-h-[100px]">
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <ImageIcon className="w-8 h-8" />
                        <p className="text-[11px] text-center">No Preview Generated</p>
                      </div>
                    </div>
                    <button
                      disabled={category === 'None'}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-white transition-colors"
                    >
                      <span>Generate 1 Preview Image</span>
                      <span className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-indigo-400">
                        <Zap className="w-3 h-3" />1
                      </span>
                    </button>
                    {category === 'None' && (
                      <p className="text-[10px] text-red-400 text-center">Product category is required to generate preview</p>
                    )}
                  </div>
                </div>

                {/* Model Identity + Styling */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-indigo-400 text-sm">👤</span>
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Model Identity</p>
                    </div>
                    <SummaryRow label="Gender"       value={gender} />
                    <SummaryRow label="Ethnicity"    value={ethnicity} />
                    <SummaryRow label="Sub-Ethnicity" value={subEthnicity} />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-indigo-400 text-sm">👗</span>
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Model Styling</p>
                    </div>
                    <SummaryRow label="Top"                   value={labelOf(CLOTHING_TOPS, clothingTop)} />
                    <SummaryRow label="Bottom"                value={labelOf(CLOTHING_BOTTOMS, clothingBottom)} />
                    <SummaryRow label="Footwear"              value={labelOf(FOOTWEAR_OPTIONS, footwear)} />
                    <SummaryRow label="Hairstyle & Grooming"  value={labelOf(HAIRSTYLE_OPTIONS, hairstyle)} />
                    <SummaryRow label="Makeup & Presentation" value={labelOf(MAKEUP_OPTIONS, makeup)} />
                  </div>
                </div>

                {/* Credit Info */}
                <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Image generation will cost <span className="text-indigo-400 font-bold">7 credits</span> for 7 images (1 per image)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 bg-white/5 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-gray-500">Your Credits</span>
                    <span className="text-sm font-bold text-white">{userData?.credits_balance ?? 0}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleStartSetup}
                    disabled={loading || category === 'None'}
                    className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <span className="text-base">⚡</span>
                        <span>Confirm & Generate Sequence</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetCreator}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Start a new project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Generating Images ──────────────────────────────────────── */}
      {project?.status === 'generating_images' && (
        <div className="flex-1 bg-[#111111] rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center p-16">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
          <h3 className="text-2xl font-bold text-white">Generating 7 AI Images...</h3>
          <p className="text-gray-400 mt-2 max-w-md">Scraping product data, removing background, and generating 7 distinct camera angles.</p>
        </div>
      )}

      {/* ── STEP 2: Review Images ──────────────────────────────────────────── */}
      {project?.status === 'awaiting_image_review' && (
        <div className="flex-1 overflow-y-auto pb-12 space-y-6">
          <div className="flex items-center justify-between bg-[#111111] p-6 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-xl font-bold text-white">Review Generated Images</h3>
              <p className="text-sm text-gray-400 mt-1">Regenerate any images you don't like before animating them.</p>
            </div>
            <button
              onClick={handleApproveImages}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>Approve & Generate Video Clips</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.generated_images_json?.map((img: any, i: number) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4] bg-[#111111]">
                <img src={img.url} alt={`Shot ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRegenerateImage(img.id)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-medium text-white"
                  >
                    <RefreshCw className="w-4 h-4" /><span>Regenerate</span>
                  </button>
                </div>
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs font-mono text-white">
                  Shot {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Generating Videos ──────────────────────────────────────── */}
      {project?.status === 'generating_videos' && (
        <div className="flex-1 bg-[#111111] rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center p-16">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
          <h3 className="text-2xl font-bold text-white">Generating 6 Video Clips...</h3>
          <p className="text-gray-400 mt-2 max-w-md">Applying motion prompts (pans, zooms) to your approved images.</p>
        </div>
      )}

      {/* ── STEP 3: Review Videos ─────────────────────────────────────────── */}
      {project?.status === 'awaiting_video_review' && (
        <div className="flex-1 overflow-y-auto pb-12 space-y-6">
          <div className="flex items-center justify-between bg-[#111111] p-6 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-xl font-bold text-white">Review Video Clips</h3>
              <p className="text-sm text-gray-400 mt-1">Check the motion of each clip. Re-roll if there are unwanted artifacts.</p>
            </div>
            <button
              onClick={handleApproveVideos}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
              <span>Stitch Final Video</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {project.generated_clips_json?.map((clip: any, i: number) => (
              <div key={clip.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4] bg-[#111111]">
                <video src={clip.url} autoPlay loop muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRegenerateVideo(clip.id)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-medium text-white"
                  >
                    <RefreshCw className="w-4 h-4" /><span>Re-roll Motion</span>
                  </button>
                </div>
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded text-xs font-mono text-white">
                  Clip {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 4: Generating Final ───────────────────────────────────────── */}
      {project?.status === 'generating_final' && (
        <div className="flex-1 bg-[#111111] rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center p-16">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
          <h3 className="text-2xl font-bold text-white">Assembling Final Video...</h3>
          <p className="text-gray-400 mt-2 max-w-md">Stitching clips, applying crossfades, generating AI voiceover, and adding background music.</p>
        </div>
      )}

      {/* ── STEP 4: Completed ─────────────────────────────────────────────── */}
      {project?.status === 'completed' && (
        <div className="flex-1 overflow-y-auto pb-12">
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-indigo-500" />
                  Your Video is Ready!
                </h3>
                <p className="text-gray-400 mt-1 text-sm">Project ID: {projectId}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={resetCreator} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-sm transition-colors">
                  Create Another
                </button>
                <a
                  href={project.final_video_url}
                  download target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold text-sm transition-colors"
                >
                  <Download className="w-5 h-5" /><span>Download MP4</span>
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                <video src={project.final_video_url} controls autoPlay loop className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
