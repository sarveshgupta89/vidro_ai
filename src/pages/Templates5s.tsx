import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { db, isFirebaseConfigured, storage } from '../lib/firebase';
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { captureEvent } from '../lib/posthog';
import { Loader2, Upload, LayoutTemplate, Play, Download, Maximize2, History, X } from 'lucide-react';
import { cn } from '../components/Sidebar';
import { useLocation } from 'react-router-dom';
import { TEMPLATES, CATEGORIES } from '../data/templates';

export const Templates5s = () => {
  const { user, userData } = useUserStore();
  const location = useLocation();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    (location.state as { templateId?: string } | null)?.templateId ?? null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState('');

  // Listen to project updates
  useEffect(() => {
    if (!projectId || !isFirebaseConfigured) return;
    
    const unsubscribe = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProject({ id: docSnap.id, ...data });
        if (data.status === 'video_generated') {
          setStep(4);
        }
      }
    });
    
    return () => unsubscribe();
  }, [projectId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15 MB limit.');
      return;
    }
    
    setImageFile(file);
    
    // Create a local preview URL
    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
    
    if (step === 1) setStep(2);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsModalOpen(false);
  };

  const handleGenerate = async () => {
    if (!user || !imageFile || !selectedTemplate) return;
    if ((userData?.credits_balance || 0) < 5) {
      setError('Insufficient credits. Please upgrade.');
      return;
    }
    
    setLoading(true);
    setError('');
    setStep(3);
    
    // Mock flow if no real DB connection
    if (!isFirebaseConfigured) {
      setProjectId('mock-project-5s');
      setProject({ status: 'generating_video' });
      
      setTimeout(() => {
        setProject({
          status: 'video_generated',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        });
        setStep(4);
        setLoading(false);
      }, 5000);
      return;
    }

    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const uploadedImageUrl = await getDownloadURL(storageRef);

      // 2. Create project in Firestore
      const docRef = await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        imageUrl: uploadedImageUrl,
        templateId: selectedTemplate,
        type: '5s_template',
        status: 'generating_video',
        createdAt: serverTimestamp(),
      });
      
      setProjectId(docRef.id);
      captureEvent('5s_video_generation_started', { projectId: docRef.id, templateId: selectedTemplate });
      
      // 3. Call backend to deduct credits and start GPU job
      const templateData = TEMPLATES.find(t => t.id === selectedTemplate);
      const response = await fetch('/api/trigger-5sec-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          projectId: docRef.id,
          imageUrl: uploadedImageUrl,
          templateId: selectedTemplate,
          templateConfig: templateData ? {
            prompt: templateData.prompt,
            editing: templateData.editing,
            marketing: templateData.marketing,
          } : undefined,
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to start generation');
      }
    } catch (err: any) {
      setError(err.message);
      setProjectId(null);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = TEMPLATES.filter(t => activeCategory === 'All' || t.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      {/* Header & Stepper */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create Video with Templates</h1>
        <p className="text-gray-400 mt-2">Create engaging videos using our pre-designed templates</p>
        
        <div className="flex items-center mt-8 space-x-4">
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Template' },
            { num: 3, label: 'Generate' },
            { num: 4, label: 'Finished' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                  step >= s.num ? "bg-emerald-500 text-white" : "bg-white/10 text-gray-400",
                  step === s.num && "ring-4 ring-emerald-500/20"
                )}>
                  {s.num}
                </div>
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  step >= s.num ? "text-emerald-500" : "text-gray-500"
                )}>
                  {s.label}
                </span>
              </div>
              {i < 3 && <div className="flex-1 h-px bg-white/10 mx-4" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        {/* Left Column: Input & Configuration */}
        <div className="lg:col-span-4 flex flex-col space-y-6 overflow-y-auto pr-2">
          {/* Product Image Card */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload your product image</h3>
            <label className="block w-full aspect-video border-2 border-dashed border-white/20 hover:border-indigo-500 rounded-xl cursor-pointer transition-colors relative overflow-hidden group">
              <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleImageUpload} disabled={step > 2} />
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Click or drag to upload</span>
                </div>
              )}
            </label>
            <p className="text-xs text-gray-500 mt-3">Maximum file size 15 MB. Supported formats - .jpg, .jpeg, .png</p>
          </div>

          {/* Template Selector Card */}
          <div className="bg-[#111111] rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select an appropriate template</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={step > 2}
              className="w-full aspect-[3/1] border-2 border-dashed border-white/20 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedTemplate ? (
                <div className="flex items-center space-x-3">
                  <LayoutTemplate className="w-6 h-6 text-indigo-400" />
                  <div className="text-left">
                    <p className="font-medium text-white text-sm">{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>
                    <p className="text-xs text-gray-500">{TEMPLATES.find(t => t.id === selectedTemplate)?.category}</p>
                  </div>
                </div>
              ) : (
                <>
                  <LayoutTemplate className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Click to browse templates</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-3">Each template is specific to the product type</p>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={handleGenerate}
              disabled={!imageFile || !selectedTemplate || step > 2 || loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/5 disabled:text-gray-500 rounded-xl font-bold text-lg transition-colors flex flex-col items-center justify-center"
            >
              <div className="flex items-center space-x-2">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Generate ⚡ 5</span>}
              </div>
            </button>
            <p className="text-xs text-center text-gray-500 mt-3">1 video generation takes 5 credits</p>
          </div>
        </div>

        {/* Right Column: Output & History */}
        <div className="lg:col-span-8 flex flex-col bg-[#111111] rounded-2xl border border-white/10 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Generated Videos</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
              <History className="w-4 h-4" />
              <span>See Previous Videos</span>
            </button>
          </div>

          <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 relative flex items-center justify-center overflow-hidden">
            {step < 3 ? (
              <div className="text-center text-gray-500">
                <VideoPlaceholder />
                <p className="mt-4">Upload an image and select a template to generate</p>
              </div>
            ) : step === 3 ? (
              <div className="text-center flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-white">Generating your video...</h3>
                <p className="text-sm text-gray-400 mt-2">This will take about 5 seconds.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[360px] aspect-[9/16] bg-black rounded-lg overflow-hidden relative group shadow-2xl">
                  {project?.videoUrl ? (
                    <video src={project.videoUrl} autoPlay loop controls className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-red-400">Video failed to load</div>
                  )}
                  
                  {/* Utility Icons */}
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm text-white transition-colors">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <a 
                      href={project?.videoUrl} 
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-emerald-400 font-medium flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Generation Complete
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Project ID: {projectId}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Select a Template</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 border-b border-white/10 flex space-x-2 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat 
                      ? "bg-indigo-600 text-white" 
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      "group cursor-pointer rounded-xl border-2 overflow-hidden transition-colors",
                      selectedTemplate === template.id
                        ? "border-indigo-500"
                        : "border-transparent hover:border-indigo-500/60",
                    )}
                  >
                    <div className="aspect-[9/16] relative overflow-hidden">
                      <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-10 h-10 text-white" />
                      </div>
                      <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ⚡ {template.creditCost}
                      </span>
                    </div>
                    <div className="p-3 bg-[#1a1a1a]">
                      <h4 className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">{template.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{template.category}</p>
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.marketing.bestFor.slice(0, 2).map(b => (
                          <span key={b} className="text-[10px] bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded-full">{b}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoPlaceholder = () => (
  <svg className="w-16 h-16 mx-auto text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
