import React, { useEffect, useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, X, Edit3, Loader2, ChevronLeft, ChevronRight, FileText, Brain, User, Activity, Bone, FileDown, RotateCcw, AlertTriangle, AlertCircle, Terminal, Settings } from 'lucide-react';
import { generateAndDownloadPdfReport } from '../../services/pdfReportGenerator';

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

  // MedGemma Inference & Simulation State
  const [aiError, setAiError] = useState<{
    error_code?: string;
    message?: string;
    actionable_steps?: string[];
    weights_path?: string;
    hf_token_configured?: boolean;
    simulation_available?: boolean;
  } | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [simulationWarning, setSimulationWarning] = useState<string>("");

  // Model Setup Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [customHfToken, setCustomHfToken] = useState("");
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customWeightsPath, setCustomWeightsPath] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configStatusMessage, setConfigStatusMessage] = useState<string | null>(null);

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
      const findingsText = Array.isArray(c.findings) ? c.findings.join('\n') : c.findings;
      // If findings was previously saved as an old error message, seamlessly regenerate the report
      if (findingsText.startsWith("Error generating report:") || findingsText.startsWith("Error: MedGemma") || findingsText.includes("Local MedGemma model weights")) {
        setReport("");
        setAiError(null);
        handleGenerateAI(true);
      } else {
        setReport(findingsText);
        setAiError(null);
      }
    } else {
      setReport("");
      setAiError(null);
    }
  }, [activeCaseId, cases]);

  const activeCase = cases.find(c => c.id === activeCaseId);

  const handleGenerateAI = async (allowSimulation: boolean = true) => {
    if (!activeCaseId) {
      setAiError({
        message: "No active case linked. Please load a case from the PACS Worklist first to enable AI reporting.",
        simulation_available: false
      });
      return;
    }
    setIsGenerating(true);
    setAiError(null);
    setIsEditing(false);
    
    try {
      const formData = new FormData();
      formData.append("clinical_context", `Patient Name: ${activeCase?.patientName || 'Unknown'}, Modality: ${activeCase?.type || 'Unknown'}`);
      if (allowSimulation) {
        formData.append("allow_simulation", "true");
      }
      
      const res = await fetch(`http://127.0.0.1:8000/api/cases/${activeCaseId}/ai-report`, {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        let errObj: any = { message: "Failed to generate report" };
        if (typeof data.detail === 'object' && data.detail !== null) {
          errObj = data.detail;
        } else if (typeof data.detail === 'string') {
          errObj = { message: data.detail, simulation_available: true };
        }
        setAiError(errObj);
        return;
      }
      
      setReport(data.report || "No significant findings reported.");
      setIsSimulated(Boolean(data.simulated));
      setSimulationWarning(data.warning || "");
      setAiError(null);
      await fetchCases();
    } catch (err: any) {
      console.error("AI report communication error:", err);
      setAiError({
        message: "Failed to communicate with AI Service: " + err.message,
        simulation_available: true
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setConfigStatusMessage(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/ai/configure-medgemma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hf_token: customHfToken || undefined,
          api_url: customApiUrl || undefined,
          weights_path: customWeightsPath || undefined
        })
      });
      const data = await res.json();
      setConfigStatusMessage(data.model_loaded ? "Model weights loaded successfully!" : "Configuration applied successfully.");
      setTimeout(() => {
        setIsConfigModalOpen(false);
        setConfigStatusMessage(null);
        handleGenerateAI(true);
      }, 1200);
    } catch (err: any) {
      setConfigStatusMessage("Failed to update: " + err.message);
    } finally {
      setIsSavingConfig(false);
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

  const handleSaveAsPdf = async () => {
    if (!activeCaseId) return;
    setIsSaving(true);
    
    const updatedCase = {
      ...activeCase,
      status: "Final", 
      findings: report
    };
    
    try {
      // 1. Persist updated report and status in database
      await fetch("http://127.0.0.1:8000/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCase)
      });
      await fetchCases();

      // 2. Generate and trigger download of the PDF report
      const findingsArray = Array.isArray(report) ? report : [report || "No findings recorded."];
      await generateAndDownloadPdfReport({
        patient: {
          id: activeCase?.id || activeCaseId,
          name: activeCase?.patientName || 'Unknown Patient',
          age: activeCase?.age || '',
          sex: (activeCase?.sex === 'female' ? 'female' : 'male'),
          studyDate: activeCase?.date || '',
          modality: activeCase?.type || 'Digital Radiography',
          bodyPart: activeCase?.typeSub || ''
        },
        report: {
          diagnosis: activeCase?.diagnosisTitle || (activeCase?.type?.includes('Knee') ? 'Knee Radiograph - Preservation Assessment' : 'Diagnostic Radiograph Examination'),
          findings: findingsArray,
          recommendation: activeCase?.recommendation || 'Clinical correlation recommended.',
          confidenceGrade: `Grade A1 AI-Verified (${activeCase?.confidence || 95}% Confidence)`
        },
        modelType: activeCase?.type || 'DICOM Study',
        accuracyScore: activeCase?.confidence || 95,
        uploadedImageUrl: `http://127.0.0.1:8000/api/cases/${activeCaseId}/thumbnail`
      });

      setIsSaving(false);
      setIsEditing(false);
      setCurrentScreen('dashboard');
    } catch (err) {
      console.error("Failed to generate and save PDF:", err);
      setIsSaving(false);
    }
  };

  const handleSaveReport = async () => {
    if (!activeCaseId) return;
    setIsSaving(true);
    
    const updatedCase = {
      ...activeCase,
      status: "Final", 
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="text-xs flex items-center gap-1.5 text-zinc-300 hover:text-white font-medium bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-md border border-zinc-700 transition cursor-pointer"
                        title="Configure MedGemma model weights, Hugging Face Token, or API endpoint"
                      >
                        <Settings className="w-3.5 h-3.5 text-teal-400" /> Model Setup
                      </button>
                      {!isEditing && report && !isGenerating && (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="text-xs flex items-center gap-1.5 text-[#8D321F] hover:text-[#a03823] font-semibold bg-[#8D321F]/10 px-2.5 py-1 rounded-md cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Non-blocking AI Error Alert */}
                  {aiError && !isGenerating && (
                    <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 mb-4 text-xs text-red-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-300">{aiError.message || "An error occurred with MedGemma."}</p>
                        {aiError.actionable_steps && (
                          <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-zinc-400 text-[11px]">
                            {aiError.actionable_steps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={() => setIsConfigModalOpen(true)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                          >
                            <Settings className="w-3 h-3 text-teal-400" /> Model Setup
                          </button>
                          <button
                            onClick={() => handleGenerateAI(true)}
                            className="bg-red-900/60 hover:bg-red-800/80 text-white border border-red-700/60 px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Retry Analysis
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. Empty State (No report, not generating) */}
                  {!report && !isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-85">
                      <div className="w-14 h-14 rounded-2xl bg-[#8D321F]/15 border border-[#8D321F]/30 flex items-center justify-center mb-4 text-[#8D321F]">
                        <Sparkles className="w-7 h-7 text-[#8D321F]" />
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">Automated Radiologic Report</h4>
                      <p className="text-xs text-zinc-400 mb-6 px-4 max-w-xs leading-relaxed">
                        Evaluate osseous contours, joint congruity, and soft tissues with the MedGemma diagnostic engine.
                      </p>
                      <button 
                        onClick={() => handleGenerateAI(true)}
                        className="bg-[#8D321F] hover:bg-[#a03823] text-white px-7 py-3 rounded-full text-xs font-bold transition-all border border-[#8D321F]/40 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" /> Start MedGemma Analysis
                      </button>
                    </div>
                  )}

                  {/* 2. Generating Spinner */}
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

                  {/* 3. Report Content Display */}
                  {report && !isGenerating && (
                    <>
                      {/* Simulation Warning Banner */}
                      {(isSimulated || report.includes('[PMC:') || report.includes('Clinical Indication:') || report.includes('Simulated') || report.includes('Clinical Radiologic Decision Support')) && (
                        <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 mb-3 shrink-0 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <span className="font-bold text-amber-200">Simulated Draft Report</span>
                              <span className="text-amber-300/80 ml-1.5 hidden sm:inline">(Clinical Decision Support)</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setIsConfigModalOpen(true)}
                              className="text-[11px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition-colors shrink-0 cursor-pointer"
                              title="Configure model weights or Hugging Face token"
                            >
                              <Settings className="w-3 h-3 text-amber-300" /> Model Setup
                            </button>
                            <button
                              onClick={() => handleGenerateAI(true)}
                              className="text-[11px] bg-amber-900/40 hover:bg-amber-900/70 border border-amber-700/50 text-amber-200 px-2 py-1 rounded-md flex items-center gap-1 font-medium transition-colors shrink-0 cursor-pointer"
                              title="Re-run analysis"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-300" /> Re-run
                            </button>
                          </div>
                        </div>
                      )}

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
                      
                      <div className="pt-4 mt-auto shrink-0 flex flex-col gap-2.5">
                        <button
                          onClick={handleSaveAsPdf}
                          disabled={isSaving}
                          className="w-full bg-[#8D321F] hover:bg-[#a03823] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg cursor-pointer"
                        >
                          {isSaving ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</>
                          ) : (
                            <><FileDown className="w-5 h-5" /> Save as PDF &amp; Finalize</>
                          )}
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveReport}
                            disabled={isSaving}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Save className="w-4 h-4" /> Save Without PDF
                          </button>
                          <button
                            onClick={() => handleGenerateAI(true)}
                            title="Re-run MedGemma inference"
                            className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white py-2.5 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* MedGemma Model Setup Configuration Modal */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">MedGemma Model Setup</h3>
                    <p className="text-[11px] text-zinc-400">Diagnostic Inference &amp; Decision Support</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <p className="text-zinc-400 text-xs leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                  Configure live weights for <span className="text-teal-400 font-mono font-semibold">google/medgemma-1.5-4b-it</span>. When weights are uninitialized, the platform automatically utilizes the built-in clinical decision engine so workflow is never blocked.
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Hugging Face Access Token (HF_TOKEN)
                  </label>
                  <input
                    type="password"
                    placeholder="hf_..."
                    value={customHfToken}
                    onChange={(e) => setCustomHfToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Enables authenticated download directly from Hugging Face Hub.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Custom Local Weights Path (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="C:\models\medgemma-1.5-4b-it"
                    value={customWeightsPath}
                    onChange={(e) => setCustomWeightsPath(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    External Inference API URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://api-inference.huggingface.co/models/google/medgemma-1.5-4b-it"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                {configStatusMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    configStatusMessage.includes("Failed") || configStatusMessage.includes("Error")
                      ? "bg-red-950/40 border border-red-800/60 text-red-300"
                      : "bg-teal-950/40 border border-teal-800/60 text-teal-300"
                  }`}>
                    <Activity className="w-4 h-4 shrink-0" />
                    <span>{configStatusMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  disabled={isSavingConfig}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-950/50 transition cursor-pointer"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving &amp; Initializing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save &amp; Apply</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
