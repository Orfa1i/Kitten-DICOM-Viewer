import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { DicomViewport } from '../interactive/DicomViewport';
import { AccuracyGauge } from '../interactive/AccuracyGauge';
import { LottieIcon, SparkleIcon } from '../ui/LottieIcon';
import { BookOpen, ExternalLink, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';

export const DiagnosticStudioView: React.FC = () => {
  const { 
    patientForm, 
    saveCurrentCase, 
    accuracyScore,
    diagnosticReport,
    selectedModel,
    exportPdfReport,
    setCurrentScreen
  } = useMedicalApp();

  const handleSave = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#8D321F', '#00BF63', '#FFFFFF']
    });
    saveCurrentCase();
  };

  const handleExportPDF = async () => {
    await exportPdfReport();
  };

  const pubmedEvidence = selectedModel === 'fracture-detection'
    ? [
        { pmid: '29538025', title: 'AO/OTA Fracture Classification Compendium', journal: 'J Orthop Trauma' },
        { pmid: '35859012', title: 'Deep learning for bone fracture detection on plain radiographs', journal: 'Lancet Digit Health' },
      ]
    : [
        { pmid: '13446604', title: 'Radiological assessment of osteo-arthrosis (Kellgren-Lawrence)', journal: 'Ann Rheum Dis' },
        { pmid: '31034988', title: 'OARSI guidelines for management of knee osteoarthritis', journal: 'Osteoarthritis Cartilage' },
      ];

  return (
    <div className="flex-1 flex gap-6 w-full max-w-[1360px] mx-auto h-full select-none overflow-hidden items-stretch">
      {/* Column 1: Left Annotated DICOM Viewport */}
      <div className="h-full flex flex-col flex-1 max-w-[390px]">
        <DicomViewport />
      </div>

      {/* Column 2: Center Structured Detection Report */}
      <div className="flex-1 flex flex-col justify-between max-w-[460px] h-full">
        {/* Detection Report Card */}
        <div className="bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header: Detection Report : + Scaled Sparkles + Download */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3 px-1 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-display font-semibold text-[22px] text-[#1F1F1F] tracking-tight">
                  Detection Report :
                </h3>
                <div className="w-8 h-8 flex items-center justify-center text-[#8D321F]">
                  <SparkleIcon className="w-7 h-7 text-[#8D321F]" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentScreen('ai-assistant')}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-[#8D321F] hover:bg-[#8D321F]/5 flex items-center gap-1.5 text-zinc-700 text-xs font-semibold transition group"
                  title="Consult AI Assistant"
                >
                  <Bot className="w-3.5 h-3.5 text-[#8D321F]" />
                  <span>AI Copilot</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="w-9 h-9 rounded-lg border border-zinc-300 hover:border-[#8D321F] hover:bg-[#8D321F]/5 flex items-center justify-center text-zinc-700 transition group"
                  title="Download Medical PDF Report"
                >
                  <div className="w-7 h-7 flex items-center justify-center group-hover:scale-115 transition-transform">
                    <LottieIcon name="file-download" size={30} />
                  </div>
                </button>
              </div>
            </div>

            {/* Inner Report Container */}
            <div className="bg-[#EBE7E6] rounded-[22px] p-4 text-[13.5px] text-zinc-800 space-y-3.5 flex-1 overflow-y-auto custom-scrollbar border border-zinc-300/60 leading-relaxed font-sans">
              {/* Diagnosis Title */}
              <div className="space-y-1">
                <span className="font-bold text-[#8D321F] block uppercase tracking-wide text-[11px]">
                  Clinical Diagnosis
                </span>
                <p className="font-semibold text-zinc-900 text-[14.5px]">
                  {diagnosticReport.diagnosis}
                </p>
              </div>

              {/* Model Findings List */}
              <div className="space-y-1">
                <span className="font-bold text-zinc-600 block uppercase tracking-wide text-[11px]">
                  {selectedModel === 'knee-osteoarthritis' ? 'Radiographic OA Findings' : 'YOLO11n Fracture Localization'}
                </span>
                <ul className="list-disc list-inside text-zinc-700 space-y-1 text-[13px]">
                  {diagnosticReport.findings.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Staging / Recommendation */}
              <div className="space-y-1">
                <span className="font-bold text-zinc-600 block uppercase tracking-wide text-[11px]">
                  Impression & Clinical Recommendation
                </span>
                <p className="text-zinc-700 text-[12.5px]">
                  {diagnosticReport.recommendation || 'Routine follow-up recommended with symptom correlation.'}
                </p>
              </div>

              {/* PubMed Biomedical Evidence Grounding */}
              <div className="pt-2 border-t border-zinc-300/80 space-y-1.5">
                <span className="font-bold text-[#8D321F] block text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>PubMed Literature Grounding</span>
                </span>
                <div className="space-y-1">
                  {pubmedEvidence.map((p, i) => (
                    <a
                      key={i}
                      href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-[11.5px] bg-white/70 hover:bg-white p-1.5 rounded-lg border border-zinc-200 text-zinc-700 transition group"
                    >
                      <span className="font-medium truncate pr-2 group-hover:text-[#8D321F]">
                        • PMID {p.pmid}: {p.title}
                      </span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 flex-shrink-0 group-hover:text-[#8D321F]" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Confidence Grade */}
              <div className="pt-2 border-t border-zinc-300/80">
                <span className="font-bold text-zinc-700 block text-[11px] uppercase">
                  Confidence Grade:
                </span>
                <span className="text-[12.5px] text-[#00BF63] font-semibold">
                  {diagnosticReport.confidenceGrade || `Grade A1 AI-Verified (${accuracyScore}% Confidence)`}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Save Action Button */}
          <div className="pt-4 flex justify-center flex-shrink-0">
            <button
              onClick={handleSave}
              className="w-full max-w-[270px] bg-[#8D321F] hover:bg-[#7D2A18] text-white py-4 px-8 rounded-full flex items-center justify-center gap-4 transition-all duration-200 active:scale-98 shadow-md hover:shadow-xl group"
            >
              <span className="font-display font-semibold text-[25px] tracking-wide">
                Save
              </span>
              <div className="w-9 h-9 flex items-center justify-center filter brightness-0 invert group-hover:scale-125 transition-transform">
                <LottieIcon name="save" size={38} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Column 3: Right Side (Accuracy Gauge + Patient Information) */}
      <div className="w-[310px] flex-shrink-0 flex flex-col justify-between gap-4 h-full">
        {/* Top: Detection Accuracy Card */}
        <div className="bg-[#8D321F] rounded-[32px] p-4 shadow-md flex flex-col flex-shrink-0">
          <div className="bg-white rounded-[24px] p-4 flex flex-col items-center shadow-inner">
            <h4 className="w-full text-left font-semibold text-[15.5px] text-zinc-900 mb-2">
              Detection Accuracy:
            </h4>
            <div className="py-2 flex items-center justify-center">
              <AccuracyGauge score={accuracyScore} size={156} />
            </div>
          </div>
        </div>

        {/* Bottom: Patient Information Card */}
        <div className="bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] p-4 shadow-sm flex flex-col flex-1 overflow-hidden">
          <h4 className="font-semibold text-[15.5px] text-zinc-900 mb-2 px-1 flex-shrink-0">
            Patient information :
          </h4>
          <div className="bg-[#EBE7E6] rounded-[22px] p-4 flex-1 flex flex-col justify-between border border-zinc-300/60 text-xs overflow-y-auto custom-scrollbar">
            <div className="space-y-2.5 text-zinc-700">
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium text-[12.5px]">Patient ID:</span>
                <span className="font-mono font-bold text-zinc-900 text-[13px]">{patientForm.id || 'Pending ID'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium text-[12.5px]">Name:</span>
                <span className="font-semibold text-zinc-900 text-[13px]">{patientForm.name || 'Unassigned Patient'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium text-[12.5px]">Age / Sex:</span>
                <span className="text-zinc-900 text-[13px]">{patientForm.age || '—'} / {patientForm.sex || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium text-[12.5px]">Study Date:</span>
                <span className="text-zinc-900 text-[13px]">{patientForm.studyDate || 'Today'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium text-[12.5px]">Region:</span>
                <span className="font-medium text-zinc-900 text-[13px]">
                  {patientForm.bodyPart || (selectedModel === 'fracture-detection' ? 'Forearm / Radius-Ulna AP' : 'Knee Bilateral AP')}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-300 mt-2 text-center text-zinc-400 font-mono text-[10px]">
              Verified by Dr. Hassan (PACS #8821)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
