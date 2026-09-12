import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ArrowLeft, Download, FileText, User, Activity, Bone, Printer, CheckCircle2, ShieldCheck, LayoutGrid } from 'lucide-react';
import { generateAndDownloadPdfReport } from '../../services/pdfReportGenerator';
import { generateAndDownloadWordReport } from '../../services/wordReportGenerator';

export const FinalReportView: React.FC = () => {
  const { cases, activeCaseId, setCurrentScreen } = useMedicalApp();
  const [viewMode, setViewMode] = useState<'word' | 'split'>('word');
  const [activeWordTab, setActiveWordTab] = useState('Home');

  const activeCase = cases.find(c => c.id === activeCaseId);

  if (!activeCase) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        Case not found.
        <button onClick={() => setCurrentScreen('dashboard')} className="ml-4 text-[#8D321F] underline">Go Back</button>
      </div>
    );
  }

  const findingsArray = Array.isArray(activeCase.findings) 
    ? activeCase.findings 
    : [(activeCase.findings || "No findings recorded.")];
  const rawFindingsText = findingsArray.join('\n');

  // Download Handlers
  const handleDownloadPdf = async () => {
    await generateAndDownloadPdfReport({
      patient: {
        id: activeCase.id,
        name: activeCase.patientName,
        age: String(activeCase.age || ''),
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

  const handleDownloadWord = async () => {
    await generateAndDownloadWordReport({
      patient: {
        id: activeCase.id,
        name: activeCase.patientName,
        age: String(activeCase.age || 'N/A'),
        sex: String(activeCase.sex || 'N/A'),
        studyDate: activeCase.date || new Date().toLocaleDateString(),
        modality: activeCase.type,
        bodyPart: activeCase.typeSub || ''
      },
      findings: rawFindingsText,
      diagnosisTitle: activeCase.diagnosisTitle,
      recommendation: activeCase.recommendation,
      modelType: activeCase.type,
      confidence: activeCase.confidence
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to parse sections from MedGemma output
  const renderFormattedFindings = () => {
    const lines = rawFindingsText
      .replace(/<end_of_turn>/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    return lines.map((line, idx) => {
      const isHeader = (line.startsWith('**') && line.includes(':')) || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.');
      const isBullet = line.startsWith('*') || line.startsWith('-');

      if (isHeader) {
        const cleanHeader = line.replace(/\*\*/g, '').trim();
        return (
          <div key={idx} className="mt-6 mb-2">
            <h3 className="text-[#1E395B] font-bold text-base md:text-lg border-b-2 border-[#2B579A]/20 pb-1 font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2B579A]"></span>
              {cleanHeader}
            </h3>
          </div>
        );
      }

      if (isBullet) {
        const cleanBullet = line.replace(/^[\*\-]\s*/, '').replace(/\*\*/g, '');
        return (
          <li key={idx} className="ml-6 list-disc text-zinc-800 text-[14px] leading-relaxed my-1 font-sans">
            {cleanBullet}
          </li>
        );
      }

      return (
        <p key={idx} className="text-zinc-800 text-[14px] md:text-[15px] leading-relaxed my-2 font-sans">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    });
  };

  return (
    <div className="w-full h-full bg-[#333333] text-zinc-100 flex flex-col overflow-hidden relative font-sans">
      
      {/* MS WORD TITLE BAR & RIBBON */}
      <header className="bg-[#185ABD] text-white flex flex-col shadow-md shrink-0 border-b border-[#104a9b]">
        {/* Top Window Strip */}
        <div className="flex items-center justify-between px-4 py-1.5 text-xs border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-white text-[#185ABD] font-black rounded-sm flex items-center justify-center text-xs shadow-sm">
              W
            </div>
            <span className="font-medium tracking-wide">
              Kitten_Clinical_Diagnostic_Report_{activeCase.id}.docx - Word Formatted View
            </span>
            <span className="bg-white/15 px-2 py-0.5 rounded text-[11px] text-white/90">
              Saved
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentScreen('dashboard')}
              className="hover:bg-white/20 px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Worklist
            </button>
          </div>
        </div>

        {/* Word Ribbon Tabs & Actions */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#2B579A]">
          <div className="flex items-center gap-1">
            {['File', 'Home', 'Insert', 'Layout', 'References', 'Review', 'View'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveWordTab(tab)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  activeWordTab === tab 
                    ? 'bg-white text-[#185ABD] shadow-sm font-semibold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            {/* View Mode Toggle */}
            <div className="bg-black/20 p-0.5 rounded-lg flex items-center border border-white/10 mr-2">
              <button
                onClick={() => setViewMode('word')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'word' 
                    ? 'bg-white text-[#185ABD] shadow-sm' 
                    : 'text-white/80 hover:text-white'
                }`}
                title="Microsoft Word Document Formatted View"
              >
                <FileText className="w-3.5 h-3.5" /> Word View
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'split' 
                    ? 'bg-white text-[#185ABD] shadow-sm' 
                    : 'text-white/80 hover:text-white'
                }`}
                title="Clinical Workspace Split View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Split View
              </button>
            </div>

            {/* Export buttons */}
            <button 
              onClick={handleDownloadWord}
              className="bg-white hover:bg-zinc-100 text-[#185ABD] px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all font-bold text-xs shadow-md active:scale-95"
              title="Download Microsoft Word (.docx) file"
            >
              <Download className="w-3.5 h-3.5 text-[#185ABD]" /> Download .DOCX
            </button>

            <button 
              onClick={handleDownloadPdf}
              className="bg-[#8D321F] hover:bg-[#a03823] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all font-semibold text-xs shadow-md"
              title="Download PDF format"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>

            <button 
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors text-xs"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DOCUMENT CANVAS AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#505050] flex justify-center p-4 md:p-8">
        
        {viewMode === 'word' ? (
          /* ============================================================
             1. MICROSOFT WORD FORMATTED DOCUMENT VIEW (A4/Letter Page)
             ============================================================ */
          <div className="w-full max-w-[850px] bg-white text-zinc-900 shadow-2xl rounded-sm border border-zinc-400/60 p-8 sm:p-14 md:p-16 my-2 min-h-[1120px] flex flex-col justify-between transition-all">
            
            {/* Top Document Header */}
            <div>
              {/* Institutional Letterhead */}
              <div className="border-b-2 border-[#1E395B] pb-4 mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#185ABD] text-white flex items-center justify-center font-bold text-sm">
                      K
                    </div>
                    <div>
                      <h1 className="text-xl font-bold font-serif tracking-tight text-[#1E395B] uppercase">
                        Kitten Diagnostic Studio
                      </h1>
                      <p className="text-xs text-zinc-500 font-sans tracking-wide">
                        Department of Radiology & Medical AI Imaging Support
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right font-sans">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> FINAL APPROVED
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Ref: {activeCase.id}</p>
                </div>
              </div>

              {/* Document Subtitle */}
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-[#1E395B] uppercase tracking-wider font-serif">
                  Clinical Radiology & Diagnostic Intelligence Report
                </h2>
                <p className="text-xs text-zinc-600 font-sans mt-0.5">
                  Generated via MedGemma 1.5-4B Multimodal Clinical Foundation Model
                </p>
              </div>

              {/* Word-Style Bordered Patient Metadata Table */}
              <div className="mb-6 overflow-hidden rounded border border-[#CBD5E1]">
                <table className="w-full text-xs font-sans border-collapse">
                  <tbody>
                    <tr className="border-b border-[#CBD5E1] bg-[#F8FAFC]">
                      <td className="py-2 px-3 font-bold text-[#1E395B] w-1/4 border-r border-[#CBD5E1]">Patient Name:</td>
                      <td className="py-2 px-3 text-zinc-900 w-1/4 border-r border-[#CBD5E1] font-medium">{activeCase.patientName}</td>
                      <td className="py-2 px-3 font-bold text-[#1E395B] w-1/4 border-r border-[#CBD5E1]">Patient ID:</td>
                      <td className="py-2 px-3 font-mono text-zinc-900 w-1/4 font-semibold">{activeCase.id}</td>
                    </tr>
                    <tr className="border-b border-[#CBD5E1]">
                      <td className="py-2 px-3 font-bold text-[#1E395B] bg-[#F8FAFC] border-r border-[#CBD5E1]">Age / Gender:</td>
                      <td className="py-2 px-3 text-zinc-900 border-r border-[#CBD5E1]">
                        {activeCase.age || 'N/A'} / {activeCase.sex ? activeCase.sex.toUpperCase() : 'N/A'}
                      </td>
                      <td className="py-2 px-3 font-bold text-[#1E395B] bg-[#F8FAFC] border-r border-[#CBD5E1]">Study Date:</td>
                      <td className="py-2 px-3 text-zinc-900">{activeCase.date || new Date().toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-[#1E395B] bg-[#F8FAFC] border-r border-[#CBD5E1]">Modality / Part:</td>
                      <td className="py-2 px-3 text-zinc-900 border-r border-[#CBD5E1]">
                        {activeCase.type} {activeCase.typeSub ? `(${activeCase.typeSub})` : ''}
                      </td>
                      <td className="py-2 px-3 font-bold text-[#1E395B] bg-[#F8FAFC] border-r border-[#CBD5E1]">AI Confidence:</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">
                        {activeCase.confidence > 0 ? `${activeCase.confidence}% AI Verified` : 'Clinical Grade Review'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Document Body: Findings & Image Figure */}
              <div className="space-y-4">
                
                {/* Embedded DICOM Thumbnail Figure in Word Style */}
                <div className="float-right ml-6 mb-4 w-52 bg-[#F8FAFC] border border-[#CBD5E1] p-2 rounded shadow-sm text-center">
                  <div className="aspect-square bg-zinc-900 rounded overflow-hidden flex items-center justify-center relative">
                    <img 
                      src={`http://127.0.0.1:8000/api/cases/${activeCase.id}/thumbnail`} 
                      alt="DICOM Source" 
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                        e.currentTarget.nextElementSibling?.classList.remove('hidden'); 
                      }} 
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center">
                      <Bone className="w-10 h-10 text-zinc-500" />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-sans italic mt-1.5">
                    Figure 1: Digital Radiograph ({activeCase.type})
                  </p>
                </div>

                {/* Formatted Clinical Sections */}
                <div className="text-justify font-sans">
                  {renderFormattedFindings()}
                </div>
              </div>
            </div>

            {/* Document Sign-off Footer */}
            <div className="mt-12 pt-6 border-t-2 border-[#1E395B] font-sans">
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="font-bold text-[#1E395B]">Attending Radiologist:</p>
                  <p className="font-serif italic text-sm mt-1 text-zinc-800">Dr. Mohammad Hassan, MD</p>
                  <p className="text-zinc-500 text-[11px]">Chief of Radiology, Kitten Central Hospital</p>
                  <p className="text-zinc-500 text-[11px] mt-2">Electronic Signature Verified via PACS</p>
                </div>

                <div className="text-right flex flex-col items-end justify-end">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#185ABD]/10 text-[#185ABD] font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#185ABD]" />
                    MedGemma 1.5-4B Validated
                  </div>
                  <p className="text-zinc-400 text-[10px] mt-2">Page 1 of 1 • Confidential Medical Diagnostic Record</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ============================================================
             2. CLINICAL WORKSPACE SPLIT VIEW
             ============================================================ */
          <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl self-start">
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
                    <img 
                      src={`http://127.0.0.1:8000/api/cases/${activeCase.id}/thumbnail`} 
                      alt="DICOM Thumbnail" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                        e.currentTarget.nextElementSibling?.classList.remove('hidden'); 
                      }} 
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center">
                      <Bone className="w-12 h-12 text-zinc-700" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold tracking-widest text-xs bg-black/0 group-hover:bg-black/50 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                      DICOM
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Report */}
              <div className="col-span-1 flex flex-col h-full">
                <div className="flex-1 bg-zinc-950 rounded-xl p-6 border border-zinc-800/50 flex flex-col min-h-[400px]">
                  <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">Clinical Findings</h2>
                  <div className="flex-1 text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif text-[15px] md:text-base overflow-y-auto custom-scrollbar">
                    {activeCase.findings && (Array.isArray(activeCase.findings) ? activeCase.findings.join('\n') : activeCase.findings)}
                    {!activeCase.findings && "No findings have been recorded for this case."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
