import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, addDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { captureEvent } from '../lib/posthog';
import { Loader2, Play, Download, RefreshCw, CheckCircle2, Maximize2, Settings, Image as ImageIcon, Video, Film, Wand2 } from 'lucide-react';
import { cn } from '../components/Sidebar';

export const VideoCreator = () => {
  const { user, userData } = useUserStore();
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [duration, setDuration] = useState('30s');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  
  // Customization State
  const [ethnicity, setEthnicity] = useState('Asian, 20s, Sharp Jawline');
  const [wardrobe, setWardrobe] = useState('Casual Denim');
  const [stage, setStage] = useState('Marble Pedestal');
  const [atmosphere, setAtmosphere] = useState('God rays');

  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState('');

  // Listen to project updates
  useEffect(() => {
    if (!projectId || !isFirebaseConfigured) return;
    
    const unsubscribe = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      }
    });
    
    return () => unsubscribe();
  }, [projectId]);

  const handleStartSetup = async () => {
    if (!user || !url) return;
    if ((userData?.credits_balance || 0) < 10) { // Assuming full flow costs 10
      setError('Insufficient credits. Please upgrade.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Mock flow if no real DB connection
    if (!isFirebaseConfigured) {
      setProjectId('mock-long-form');
      setProject({ status: 'generating_images' });
      
      setTimeout(() => {
        setProject({
          status: 'awaiting_image_review',
          generated_images_json: Array.from({ length: 7 }).map((_, i) => ({
            id: `img_${i}`,
            url: `https://picsum.photos/seed/mock_${i}/800/1200`,
            status: 'approved'
          }))
        });
        setLoading(false);
      }, 3000);
      return;
    }

    try {
      // 1. Scrape Product (Mock)
      const scrapeRes = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const scrapeData = await scrapeRes.json();
      
      // 2. Create Project
      const docRef = await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        type: 'long_form',
        status: 'generating_images',
        scraped_assets_json: scrapeData.data,
        customization_settings: {
          category, duration, aspectRatio, ethnicity, wardrobe, stage, atmosphere
        },
        createdAt: serverTimestamp(),
      });
      
      setProjectId(docRef.id);
      captureEvent('long_form_started', { projectId: docRef.id });
      
      // 3. Trigger Image Generation
      await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: docRef.id })
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
      setProject({ ...project, status: 'generating_videos' });
      setTimeout(() => {
        setProject({
          ...project,
          status: 'awaiting_video_review',
          generated_clips_json: Array.from({ length: 6 }).map((_, i) => ({
            id: `clip_${i}`,
            url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            status: 'approved'
          }))
        });
        setLoading(false);
      }, 4000);
      return;
    }

    try {
      await fetch('/api/generate-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
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
      setProject({ ...project, status: 'generating_final' });
      setTimeout(() => {
        setProject({
          ...project,
          status: 'completed',
          final_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4'
        });
        setLoading(false);
      }, 4000);
      return;
    }

    try {
      await fetch('/api/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateImage = async (imageId: string) => {
    if (!isFirebaseConfigured) {
      alert(`Mock regenerating image ${imageId}`);
      return;
    }
    await fetch('/api/regenerate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, imageId })
    });
  };

  const handleRegenerateVideo = async (clipId: string) => {
    if (!isFirebaseConfigured) {
      alert(`Mock regenerating video clip ${clipId}`);
      return;
    }
    await fetch('/api/regenerate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, clipId })
    });
  };

  const resetCreator = () => {
    setProjectId(null);
    setProject(null);
    setUrl('');
  };

  // Determine current step for Stepper
  let currentStep = 1;
  if (project?.status === 'generating_images' || project?.status === 'awaiting_image_review') currentStep = 2;
  if (project?.status === 'generating_videos' || project?.status === 'awaiting_video_review') currentStep = 3;
  if (project?.status === 'generating_final' || project?.status === 'completed') currentStep = 4;

  const STEPS = [
    { num: 1, label: 'Setup', icon: Settings },
    { num: 2, label: 'AI Images', icon: ImageIcon },
    { num: 3, label: 'Video Clips', icon: Video },
    { num: 4, label: 'Final Video', icon: Film }
  ];

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      {/* Header & Stepper */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Long-Form Video Creator</h1>
        <p className="text-gray-400 mt-2">Transform your product URLs into engaging marketing videos.</p>
        
        <div className="flex items-center mt-8 space-x-4 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center space-x-2 shrink-0">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                  currentStep >= s.num ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-400",
                  currentStep === s.num && "ring-4 ring-indigo-500/20"
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  currentStep >= s.num ? "text-indigo-400" : "text-gray-500"
                )}>
                  {s.label}
                </span>
              </div>
              {i < 3 && <div className="flex-1 h-px bg-white/10 min-w-[2rem]" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-12">
        {/* Step 1: Setup */}
        {!projectId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#111111] rounded-2xl border border-white/10 p-8 space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Wand2 className="w-5 h-5 mr-2 text-indigo-400" />
                Product Ingestion
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product URL (Amazon, Walmart, Myntra)</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://amazon.com/dp/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                    <option>Apparel</option>
                    <option>Beauty</option>
                    <option>Jewelry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                    <option>15s</option>
                    <option>30s</option>
                    <option>60s</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                    <option>9:16</option>
                    <option>3:4</option>
                    <option>1:1</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#111111] rounded-2xl border border-white/10 p-8 space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-indigo-400" />
                Customization Engine
              </h2>
              
              {(category === 'Apparel' || category === 'Beauty') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Human Model (Ethnicity & Profile)</label>
                    <select value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                      <option>Asian, 20s, Sharp Jawline</option>
                      <option>Caucasian, 30s, Soft Features</option>
                      <option>Black, 20s, Athletic Build</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wardrobe</label>
                    <select value={wardrobe} onChange={(e) => setWardrobe(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                      <option>Casual Denim</option>
                      <option>Silk Evening Gown</option>
                      <option>Athleisure</option>
                    </select>
                  </div>
                </div>
              )}

              {(category === 'Beauty' || category === 'Jewelry') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Product Stage</label>
                    <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                      <option>Marble Pedestal</option>
                      <option>Reflective Water</option>
                      <option>Mossy Rock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Atmosphere / Lighting</label>
                    <select value={atmosphere} onChange={(e) => setAtmosphere(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                      <option>God rays</option>
                      <option>Volumetric fog</option>
                      <option>Harsh neon studio lights</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/10">
                <button
                  onClick={handleStartSetup}
                  disabled={loading || !url}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/5 disabled:text-gray-500 rounded-xl font-bold text-lg transition-colors flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Scrape & Generate Images</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Generating Images */}
        {project?.status === 'generating_images' && (
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
            <h3 className="text-2xl font-bold text-white">Generating 7 AI Images...</h3>
            <p className="text-gray-400 mt-2 max-w-md">Scraping product data, removing background, and generating 7 distinct camera angles using RunPod GPUs.</p>
          </div>
        )}

        {/* Step 2: Review Images */}
        {project?.status === 'awaiting_image_review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#111111] p-6 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">Review Generated Images</h3>
                <p className="text-sm text-gray-400 mt-1">Regenerate any images you don't like before animating them.</p>
              </div>
              <button
                onClick={handleApproveImages}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                <span>Approve & Generate Video Clips</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {project.generated_images_json?.map((img: any, i: number) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4] bg-[#111111]">
                  <img src={img.url} alt={`Generated ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleRegenerateImage(img.id)}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-medium text-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate</span>
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

        {/* Step 3: Generating Videos */}
        {project?.status === 'generating_videos' && (
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
            <h3 className="text-2xl font-bold text-white">Generating 6 Video Clips...</h3>
            <p className="text-gray-400 mt-2 max-w-md">Applying motion prompts (pans, zooms) to your approved images using Image-to-Video models.</p>
          </div>
        )}

        {/* Step 3: Review Videos */}
        {project?.status === 'awaiting_video_review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#111111] p-6 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">Review Video Clips</h3>
                <p className="text-sm text-gray-400 mt-1">Check the motion of each clip. Re-roll if there are unwanted artifacts.</p>
              </div>
              <button
                onClick={handleApproveVideos}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
                <span>Stitch Final Video</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {project.generated_clips_json?.map((clip: any, i: number) => (
                <div key={clip.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4] bg-[#111111]">
                  <video src={clip.url} autoPlay loop muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleRegenerateVideo(clip.id)}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-medium text-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Re-roll Motion</span>
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

        {/* Step 4: Generating Final */}
        {project?.status === 'generating_final' && (
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
            <h3 className="text-2xl font-bold text-white">Assembling Final Video...</h3>
            <p className="text-gray-400 mt-2 max-w-md">Stitching clips, applying crossfades, generating AI voiceover, and adding background music.</p>
          </div>
        )}

        {/* Step 4: Completed */}
        {project?.status === 'completed' && (
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mr-3" />
                  Your Video is Ready!
                </h3>
                <p className="text-gray-400 mt-1">Project ID: {projectId}</p>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={resetCreator}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  Create Another
                </button>
                <a 
                  href={project.final_video_url} 
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download MP4</span>
                </a>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-full max-w-[400px] aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group">
                <video 
                  src={project.final_video_url} 
                  controls 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
