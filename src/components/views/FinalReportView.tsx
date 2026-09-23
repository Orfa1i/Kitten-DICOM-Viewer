import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ArrowLeft, Download, FileText, User, Activity, Bone, Layers, Eye, ExternalLink } from 'lucide-react';
import { generateAndDownloadPdfReport } from '../../services/pdfReportGenerator';
import { ClinicalFindingsReport } from '../clinical/ClinicalFindingsReport';

export const FinalReportView: React.FC = () => {
  const { cases, activeCaseId, setActiveCaseId, setCurrentScreen } = useMedicalApp();

  const activeCase = cases.find(c => c.id === activeCaseId);

  if (!activeCase) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        Case not found.
        <button onClick={() => setCurrentScreen('dashboard')} className="ml-4 text-[#8D321F] underline">Go Back</button>
      </div>
    );
  }

  const handleDownload = async () => {
    const findingsArray = Array.isArray(activeCase.findings) ? activeCase.findings : [(activeCase.findings || "No findings recorded.")];
    await generateAndDownloadPdfReport({
      patient: {
        id: activeCase.id,
        name: activeCase.patientName,
        age: activeCase.age || '',
        sex: (activeCase.sex || 'male'),
        studyDate: activeCase.date || '',
        modality: activeCase.type,
        bodyPart: activeCase.typeSub || ''
      },
      report: {
        diagnosis: activeCase.diagnosisTitle || '',
        findings: findingsArray,
        recommendation: activeCase.recommendation || '',
        confidenceGrade: `Grade A1 AI-Verified (${activeCase.confidence}% Confidence)`
      },
      modelType: activeCase.type,
      accuracyScore: activeCase.confidence,
      uploadedImageUrl: `http://127.0.0.1:8000/api/cases/${activeCase.id}/thumbnail`
    });
  };

  return (
    <div className="w-full h-full bg-zinc-950 text-white flex flex-col items-center overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
      <div className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-4 gap-4">
        <button 
          onClick={() => setCurrentScreen('dashboard')}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Worklist
        </button>
        <button 
          onClick={handleDownload}
          className="bg-[#8D321F] hover:bg-[#a03823] text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all font-bold shadow-lg"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>

      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#8D321F]" />
              Final Approved Report
            </h1>
            <p className="text-zinc-400 mt-1">Study completed on {activeCase.date}</p>
          </div>
          <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-bold flex items-center gap-2 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            Final Approved
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Left Column: Image and Details */}
          <div className="flex flex-col space-y-6">
            <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800/50">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Patient Details
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-zinc-500 uppercase">Patient Name</div>
                  <div className="font-medium text-zinc-200">{activeCase.patientName}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase">Patient ID</div>
                  <div className="font-mono text-zinc-300 text-sm">{activeCase.id}</div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Age</div>
                    <div className="font-medium text-zinc-200">{activeCase.age || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Sex</div>
                    <div className="font-medium text-zinc-200 capitalize">{activeCase.sex || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800/50">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Study Details
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-zinc-500 uppercase">Modality</div>
                  <div className="font-medium text-zinc-200">{activeCase.type}</div>
                </div>
                {activeCase.typeSub && (
                  <div>
                    <div className="text-xs text-zinc-500 uppercase">Body Part</div>
                    <div className="font-medium text-zinc-200">{activeCase.typeSub}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Source Image Card with Guaranteed Bottom-Left DICOM Viewer Icon */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50 flex flex-col relative">
              <div className="flex items-center justify-between w-full mb-3">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#8D321F]" /> Source Radiograph
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCaseId(activeCase.id);
                    setCurrentScreen('iframe-viewer');
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#C27364] hover:text-white transition-colors cursor-pointer font-medium"
                  title="Launch interactive workstation"
                >
                  <span>Workstation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div 
                onClick={() => {
                  setActiveCaseId(activeCase.id);
                  setCurrentScreen('iframe-viewer');
                }}
                className="w-full aspect-square md:aspect-auto md:flex-1 min-h-[320px] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center relative group cursor-pointer"
              >
                <img 
                  src={`http://127.0.0.1:8000/api/cases/${activeCase.id}/thumbnail`} 
                  alt="DICOM Thumbnail" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    e.currentTarget.nextElementSibling?.classList.remove('hidden'); 
                  }} 
                />
                
                {/* Fallback placeholder if image is delayed or fails */}
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-6 border border-zinc-800/80">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-[#8D321F]">
                    <Layers className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-bold text-zinc-200">{activeCase.patientName || activeCase.id}</span>
                  <span className="text-xs font-mono text-zinc-500 mt-1">{activeCase.type || 'DICOM'} • {activeCase.id}</span>
                  <span className="text-[11px] text-[#C27364] mt-3 font-semibold px-3 py-1 bg-[#8D321F]/10 rounded-full border border-[#8D321F]/20">
                    Interactive DICOM Viewport
                  </span>
                </div>

                {/* Center Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-[#8D321F]/90 text-white font-semibold text-xs px-3.5 py-2 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-sm transform -translate-y-1 group-hover:translate-y-0 transition-transform">
                    <Eye className="w-4 h-4" />
                    <span>Open in BlueLight Workstation</span>
                  </div>
                </div>

                {/* Dedicated ALWAYS-VISIBLE Bottom-Left DICOM Viewer Icon & Button Badge */}
                <div className="absolute bottom-3 left-3 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCaseId(activeCase.id);
                      setCurrentScreen('iframe-viewer');
                    }}
                    className="flex items-center gap-2 bg-[#8D321F] hover:bg-[#a03823] active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl border border-white/20 backdrop-blur-md transition-all cursor-pointer group/btn"
                    title="Launch BlueLight DICOM Viewer"
                  >
                    <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5 text-white group-hover/btn:rotate-12 transition-transform" />
                    </div>
                    <span>DICOM Viewer</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Column */}
          <div className="col-span-1 flex flex-col h-full">
            <ClinicalFindingsReport
              reportText={activeCase.findings}
              studyTitle={activeCase.diagnosisTitle || (activeCase.type === 'fracture-detection' ? 'Fracture Detection Analysis' : 'Knee Osteoarthritis Analysis')}
              className="flex-1 min-h-[400px]"
            />
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left Workstation Action Bar */}
      <div className="fixed bottom-6 left-6 z-30 hidden sm:block">
        <button
          onClick={() => {
            setActiveCaseId(activeCase.id);
            setCurrentScreen('iframe-viewer');
          }}
          className="flex items-center gap-3 bg-zinc-900/95 hover:bg-[#8D321F] text-zinc-200 hover:text-white px-4 py-3 rounded-2xl border border-zinc-700/80 hover:border-[#8D321F] shadow-2xl backdrop-blur-md transition-all group active:scale-95 cursor-pointer"
          title="Open Study in Interactive DICOM Workstation"
        >
          <div className="w-8 h-8 rounded-xl bg-[#8D321F] group-hover:bg-white/20 flex items-center justify-center transition-colors shadow-inner">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-white">DICOM Viewer</div>
            <div className="text-[11px] text-zinc-400 group-hover:text-white/80 transition-colors">Study: {activeCase.id}</div>
          </div>
        </button>
      </div>
    </div>
  );
};
