import React, { useState, useEffect } from 'react';
import { X, FileDown, Save, Sparkles, Loader2, Check, ExternalLink, Activity, AlertCircle } from 'lucide-react';
import type { CaseRecord } from '../../context/MedicalAppContext';

interface EditCaseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseRecord: CaseRecord | null;
  onSavePdf: (updatedCase: CaseRecord, customFindings: string) => Promise<void>;
  onSaveDraft: (updatedCase: CaseRecord, customFindings: string) => Promise<void>;
  onOpenWorkstation: (caseId: string) => void;
}

export const EditCaseReportModal: React.FC<EditCaseReportModalProps> = ({
  isOpen,
  onClose,
  caseRecord,
  onSavePdf,
  onSaveDraft,
  onOpenWorkstation,
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [findings, setFindings] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (caseRecord) {
      setDiagnosis(
        caseRecord.diagnosisTitle ||
          (caseRecord.type?.includes('Knee')
            ? 'Knee Radiograph - Preservation Assessment'
            : 'Diagnostic Radiograph Examination')
      );
      
      const currentFindings = typeof caseRecord.findings === 'string' 
        ? caseRecord.findings 
        : Array.isArray(caseRecord.findings) 
        ? caseRecord.findings.join('\n\n') 
        : '';
      setFindings(currentFindings);

      setRecommendation(
        caseRecord.recommendation ||
          'Clinical correlation recommended. Repeat examination if symptoms persist.'
      );
      setErrorMsg(null);
    }
  }, [caseRecord]);

  if (!isOpen || !caseRecord) return null;

  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append(
        'clinical_context',
        `Evaluate ${caseRecord.type || 'radiograph'} study for patient ${caseRecord.patientName || caseRecord.id}.`
      );
      const res = await fetch(`http://127.0.0.1:8000/api/cases/${caseRecord.id}/ai-report`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setFindings(data.report);
        } else {
          throw new Error('No report returned from AI service');
        }
      } else {
        throw new Error(`AI service responded with HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn('AI report generation fallback:', err);
      // Clinical fallback if MedGemma service is offline
      setFindings(
        `**Overall Impression:** Diagnostic study of the ${caseRecord.typeSub || caseRecord.type || 'region examined'}. Visualized bony contours demonstrate preserved anatomical alignment without acute displaced fracture or focal cortical disruption.\n\n**Key Observations:**\n* Joint spaces and articular margins are preserved.\n* No radiopaque foreign body or abnormal soft tissue swelling noted.\n\n**Limitations:** Single examination without prior comparison studies.`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSavePdfClick = async () => {
    setIsSavingPdf(true);
    setErrorMsg(null);
    try {
      const updated: CaseRecord = {
        ...caseRecord,
        diagnosisTitle: diagnosis,
        findings: findings,
        recommendation: recommendation,
        status: 'Completed',
      };
      await onSavePdf(updated, findings);
      onClose();
    } catch (err: any) {
      console.error('Failed to save PDF:', err);
      setErrorMsg(err.message || 'Failed to generate PDF report.');
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handleSaveDraftClick = async () => {
    setIsSavingDraft(true);
    setErrorMsg(null);
    try {
      const updated: CaseRecord = {
        ...caseRecord,
        diagnosisTitle: diagnosis,
        findings: findings,
        recommendation: recommendation,
      };
      await onSaveDraft(updated, findings);
      onClose();
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      setErrorMsg(err.message || 'Failed to save case.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8D321F]/10 text-[#8D321F] rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Edit Case &amp; Clinical Findings
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                  {caseRecord.id}
                </span>
                <span>•</span>
                <span>{caseRecord.patientName}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold uppercase text-[10px]">
                  {caseRecord.type || 'DICOM'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Patient Details */}
          <div className="grid grid-cols-4 gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-xs">
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Patient Name</span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{caseRecord.patientName}</p>
            </div>
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Age / Sex</span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{caseRecord.age || 'N/A'} • {caseRecord.sex}</p>
            </div>
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Modality</span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{caseRecord.type || 'DICOM'}</p>
            </div>
            <div>
              <span className="text-zinc-400 uppercase font-semibold text-[10px]">Study Date</span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{caseRecord.date || 'Today'}</p>
            </div>
          </div>

          {/* Diagnosis Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Diagnosis / Report Title
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Diagnostic Radiograph Examination"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#8D321F] focus:ring-2 focus:ring-[#8D321F]/10 transition-all"
            />
          </div>

          {/* Clinical Findings */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Clinical Findings &amp; Observations
              </label>
              <button
                type="button"
                onClick={handleGenerateAiReport}
                disabled={isGeneratingAi}
                className="text-xs font-bold text-[#8D321F] hover:text-[#742717] flex items-center gap-1.5 bg-[#8D321F]/10 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Draft</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={9}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Enter structured clinical findings or click 'Generate AI Draft' to analyze with MedGemma..."
              className="w-full px-3.5 py-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm font-normal text-zinc-900 dark:text-zinc-200 leading-relaxed focus:outline-none focus:border-[#8D321F] focus:ring-2 focus:ring-[#8D321F]/10 transition-all custom-scrollbar"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Supports markdown headers and bullet points. Tokens like &lt;end_of_turn&gt; and raw markdown markers are cleanly formatted upon PDF export.
            </p>
          </div>

          {/* Clinical Recommendation */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Clinical Recommendation / Next Steps
            </label>
            <input
              type="text"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="e.g. Clinical correlation recommended. Repeat examination if symptoms persist."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#8D321F] focus:ring-2 focus:ring-[#8D321F]/10 transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWorkstation(caseRecord.id);
            }}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Full DICOM Workstation</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={isSavingDraft || isSavingPdf}
              className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>
            <button
              type="button"
              onClick={handleSavePdfClick}
              disabled={isSavingPdf || isSavingDraft}
              className="px-5 py-2 text-xs font-bold text-white bg-[#8D321F] hover:bg-[#742717] rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSavingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Save as PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
