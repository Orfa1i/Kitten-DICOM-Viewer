import React, { useEffect, useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, X, Edit3, Loader2, ChevronLeft, ChevronRight, FileText, Brain, User, Activity, Bone } from 'lucide-react';

type SidebarTab = 'reporter' | 'models' | 'patient';

export const IframeViewerView: React.FC = () => {
  const { setCurrentScreen, activeCaseId, userProfile, cases, fetchCases, updateCase } = useMedicalApp();
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('reporter');
  
  const [isEditingAge, setIsEditingAge] = useState(false);
  const [editAgeValue, setEditAgeValue] = useState("");

  // AI Reporter State
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Specialized Models State
  const [isRunningModel, setIsRunningModel] = useState<string | null>(null);
  const [modelResults, setModelResults] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GO_BACK') {
        setCurrentScreen('dashboard');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setCurrentScreen]);

  useEffect(() => {
    const c = cases.find(item => item.id === activeCaseId);
    if (c && c.findings) {
      setReport(Array.isArray(c.findings) ? c.findings.join('\n') : c.findings);
    } else {
      setReport("");
    }
  }, [activeCaseId]);

  const activeCase = cases.find(c => c.id === activeCaseId);

  const handleGenerateAI = async () => {
    if (!activeCaseId) {
      setReport("Error: No active case linked. Please load a case from the PACS Worklist first to enable AI reporting.");
      return;
    }
    setIsGenerating(true);
    setReport("");
    setIsEditing(false);
    
    try {
      const formData = new FormData();
      formData.append("clinical_context", `Patient Name: ${activeCase?.patientName || 'Unknown'}, Modality: ${activeCase?.type || 'Unknown'}`);
      
      const res = await fetch(`http://127.0.0.1:8000/api/cases/${activeCaseId}/ai-report`, {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) throw new Error("Failed to generate report");
      
      const data = await res.json();
      setReport(data.report || "No significant findings reported.");
    } catch (err: any) {
      console.error(err);
      setReport("Error generating report: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

      const [modelImages, setModelImages] = useState<{ [key: string]: string }>({});

  const handleRunSpecializedModel = async (modelType: string) => {
    if (!activeCaseId) {
      setModelResults(prev => ({ ...prev, [modelType]: "Error: No active case linked. Please load a case from the PACS Worklist first to enable AI features." }));
      return;
    }
    setIsRunningModel(modelType);
    
    try {
      let endpoint = "";
      if (modelType === 'fracture') endpoint = `http://127.0.0.1:8000/api/cases/${activeCaseId}/detect-fracture`;
      else if (modelType === 'knee') endpoint = `http://127.0.0.1:8000/api/cases/${activeCaseId}/detect-knee-oa`;
      
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Failed to run specialized model");
      
      const data = await res.json();
      setModelResults(prev => ({ ...prev, [modelType]: data.message || "Model executed successfully, but no message returned." }));
      if (data.annotated_image_base64) {
        setModelImages(prev => ({ ...prev, [modelType]: data.annotated_image_base64 }));
      }
    } catch (err: any) {
      console.error(err);
      setModelResults(prev => ({ ...prev, [modelType]: "Error: " + err.message }));
    } finally {
      setIsRunningModel(null);
    }
  };

  const handleSaveReport = async () => {
    if (!activeCaseId) return;
    setIsSaving(true);
    
    const updatedCase = {
      ...activeCase,
      status: "Completed", 
      findings: report
    };
    
    try {
      await fetch("http://127.0.0.1:8000/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCase)
      });
      await fetchCases();
    } catch (err) {
      console.error(err);
    }
    
    setIsSaving(false);
    setIsEditing(false);
    setCurrentScreen('dashboard');
  };

  const baseSrc = "http://localhost:8000/static/blue/bluelight/html/start.html";
  const params = new URLSearchParams();
  if (activeCaseId) params.append("loadCaseId", activeCaseId);
  if (userProfile?.name) params.append("userName", userProfile.name);
  if (userProfile?.avatar) {
    const avatarUrl = new URL(userProfile.avatar, window.location.origin).href;
    params.append("userAvatar", avatarUrl);
  }

  const iframeSrc = params.toString() ? baseSrc + '?' + params.toString() : baseSrc;

  return (
    <div className="w-screen h-screen bg-[#111111] text-white flex relative overflow-hidden">
      
      {/* DICOM Viewer Iframe */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'mr-[420px]' : ''}`}>
        <iframe 
          src={iframeSrc}
          title="DICOM Viewer" 
          className="w-full h-full border-0 bg-[#111111]"
        />
      </div>

      {/* Docked Toggle Tab (when sidebar closed) */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.button
            initial={{ x: 50 }}
            animate={{ x: 0 }}
            exit={{ x: 50 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-zinc-300 hover:text-white py-8 px-2 rounded-l-xl shadow-[-8px_0_20px_rgba(0,0,0,0.5)] border border-r-0 border-zinc-700 flex flex-col items-center gap-4 transition-colors group cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <div className="flex flex-col gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-4 h-4 text-[#8D321F]" />
              <Brain className="w-4 h-4 text-blue-400" />
              <User className="w-4 h-4 text-emerald-400" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out Sidebar Panel */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-[420px] h-full bg-[#1A1A1A] border-l border-zinc-800 shadow-2xl flex flex-col z-40"
          >
            {/* Sidebar Header & Tabs */}
            <div className="flex flex-col bg-[#1F1F1F] border-b border-zinc-800 shrink-0">
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#8D321F]" /> Clinical Workspace
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex w-full border-t border-zinc-800/50">
                <button 
                  onClick={() => setActiveTab('reporter')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'reporter' ? 'bg-[#8D321F]/10 text-[#8D321F] border-b-2 border-[#8D321F]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                >
                  <FileText className="w-4 h-4" /> Report
                </button>
                <button 
                  onClick={() => setActiveTab('models')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'models' ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                >
                  <Brain className="w-4 h-4" /> Models
                </button>
                <button 
                  onClick={() => setActiveTab('patient')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'patient' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                >
                  <User className="w-4 h-4" /> Patient
                </button>
              </div>
            </div>

            {/* Sidebar Content Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col relative bg-[#151515]">
              
              {/* TAB 1: REPORTER */}
              {activeTab === 'reporter' && (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8D321F]" /> MedGemma Analysis
                    </h3>
                    {!isEditing && report && !isGenerating && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs flex items-center gap-1.5 text-[#8D321F] hover:text-[#a03823] font-semibold bg-[#8D321F]/10 px-2.5 py-1 rounded-md"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </div>
                  
                  {!report && !isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                      <Sparkles className="w-12 h-12 text-zinc-600 mb-4" />
                      <p className="text-sm text-zinc-400 mb-6 px-4">Generate an automated diagnostic report using the MedGemma multimodal LLM.</p>
                      <button 
                        onClick={handleGenerateAI}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors border border-zinc-700"
                      >
                        Start Analysis
                      </button>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-70">
                      <div className="w-16 h-16 relative flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-zinc-700 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#8D321F] border-t-transparent rounded-full animate-spin" />
                        <Sparkles className="w-6 h-6 text-[#8D321F]" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-lg mb-1">MedGemma is analyzing...</h3>
                        <p className="text-sm text-zinc-400">Evaluating clinical radiograph structures</p>
                      </div>
                    </div>
                  )}

                  {report && !isGenerating && (
                    <>
                      {isEditing ? (
                        <textarea 
                          value={report}
                          onChange={(e) => setReport(e.target.value)}
                          className="w-full flex-1 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white text-sm leading-relaxed focus:outline-none focus:border-[#8D321F] resize-none"
                        />
                      ) : (
                        <div className="w-full flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap">
                          {report}
                        </div>
                      )}
                      
                      <div className="pt-5 mt-auto shrink-0">
                        <button
                          onClick={handleSaveReport}
                          disabled={isSaving}
                          className="w-full bg-[#8D321F] hover:bg-[#a03823] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {isSaving ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                          ) : (
                            <><Save className="w-5 h-5" /> Save & Finalize Case</>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: MODELS */}
              {activeTab === 'models' && (
                <div className="flex flex-col h-full animate-in fade-in duration-300 gap-6">
                  
                  {/* Fracture Model */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Bone className="w-4 h-4 text-blue-400" /> Fracture Detection
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">YOLO11n Clinical Detector</p>
                      </div>
                      <button 
                        onClick={() => handleRunSpecializedModel('fracture')}
                        disabled={isRunningModel === 'fracture'}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isRunningModel === 'fracture' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Run'}
                      </button>
                    </div>
                    {modelResults['fracture'] && (
                      <div className="mt-3 flex flex-col gap-3">
                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-sm text-zinc-300 leading-relaxed">
                          {modelResults['fracture']}
                        </div>
                        {modelImages['fracture'] && (
                          <div className="rounded-lg overflow-hidden border border-zinc-700">
                            <img src={modelImages['fracture']} alt="Fracture Detection Heatmap" className="w-full h-auto object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Knee OA Model */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-400" /> Knee Osteoarthritis
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">Kellgren-Lawrence Staging Ensemble</p>
                      </div>
                      <button 
                        onClick={() => handleRunSpecializedModel('knee')}
                        disabled={isRunningModel === 'knee'}
                        className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isRunningModel === 'knee' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Run'}
                      </button>
                    </div>
                    {modelResults['knee'] && (
                      <div className="mt-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg text-sm text-zinc-300 leading-relaxed">
                        {modelResults['knee']}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 3: PATIENT DATA */}
              {activeTab === 'patient' && (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="flex items-center justify-center py-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center mb-2">
                      <User className="w-10 h-10 text-emerald-500" />
                    </div>
                  </div>
                  
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-800/30">
                      <h3 className="text-sm font-bold text-white text-center">{activeCase?.patientName || 'Unknown Patient'}</h3>
                      <p className="text-xs text-zinc-500 text-center mt-1 font-mono">{activeCase?.id || 'ID-XXXXXX'}</p>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Age</span>
                        <span className="text-sm text-zinc-200">{activeCase?.age || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Sex</span>
                        <span className="text-sm text-zinc-200 capitalize">{activeCase?.sex || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Modality</span>
                        <span className="text-sm text-zinc-200">{activeCase?.type || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Study Date</span>
                        <span className="text-sm text-zinc-200">{activeCase?.date || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Status</span>
                        <span className="text-xs font-bold px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md">{activeCase?.status || 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
