import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ArrowLeft, Download, FileText, User, Activity, Bone } from 'lucide-react';
import { generateAndDownloadPdfReport } from '../../services/pdfReportGenerator';

export const FinalReportView: React.FC = () => {
  const { cases, activeCaseId, setCurrentScreen } = useMedicalApp();

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
            
            {/* Thumbnail */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center relative">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 self-start">Source Image</h2>
              <div className="w-full aspect-square md:aspect-auto md:flex-1 min-h-[300px] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative group">
                <img src={`http://127.0.0.1:8000/api/cases/${activeCase.id}/thumbnail`} alt="DICOM Thumbnail" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <div className="hidden absolute inset-0 flex items-center justify-center">
                  <Bone className="w-12 h-12 text-zinc-700" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold tracking-widest text-xs bg-black/0 group-hover:bg-black/50 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                  DICOM
                </div>
              </div>
            </div>
          </div>

          {/* Report Column */}
          <div className="col-span-1 flex flex-col h-full">
            <div className="flex-1 bg-zinc-950 rounded-xl p-6 border border-zinc-800/50 flex flex-col min-h-[400px]">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">Clinical Findings</h2>
              <div className="flex-1 text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif text-[15px] md:text-base overflow-y-auto custom-scrollbar">
                {Array.isArray(activeCase.findings) ? activeCase.findings.join('\n') : (activeCase.findings || "No findings have been recorded for this case.")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
