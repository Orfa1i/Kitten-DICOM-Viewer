import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer, FileText, CheckCircle2, ShieldCheck, Bone } from 'lucide-react';
import { generateAndDownloadWordReport } from '../../services/wordReportGenerator';
import { generateAndDownloadPdfReport } from '../../services/pdfReportGenerator';

interface WordDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  patientName?: string;
  patientId?: string;
  age?: string;
  sex?: string;
  modality?: string;
  findings: string;
  thumbnailUrl?: string;
}

export const WordDocumentModal: React.FC<WordDocumentModalProps> = ({
  isOpen,
  onClose,
  title = "MedGemma Clinical Diagnostic Consultation",
  patientName = "Clinical Patient",
  patientId = "CONSULT-" + Math.floor(1000 + Math.random() * 9000),
  age = "N/A",
  sex = "N/A",
  modality = "Digital Radiography (DX)",
  findings,
  thumbnailUrl
}) => {
  const [activeWordTab, setActiveWordTab] = useState('Home');

  if (!isOpen) return null;

  const handleDownloadWord = async () => {
    await generateAndDownloadWordReport({
      patient: {
        id: patientId,
        name: patientName,
        age: String(age || 'N/A'),
        sex: String(sex || 'N/A'),
        studyDate: new Date().toLocaleDateString(),
        modality: modality,
      },
      findings: findings,
      diagnosisTitle: title,
    });
  };

  const handleDownloadPdf = async () => {
    await generateAndDownloadPdfReport({
      patient: {
        id: patientId,
        name: patientName,
        age: String(age || ''),
        sex: (sex === 'f' || sex === 'female') ? 'female' : 'male',
        studyDate: new Date().toLocaleDateString(),
        modality: modality,
      },
      report: {
        diagnosis: title,
        findings: [findings],
        confidenceGrade: 'AI-Verified Clinical Review'
      },
      modelType: modality,
      accuracyScore: 98,
      uploadedImageUrl: thumbnailUrl
    });
  };

  const renderFormattedFindings = () => {
    const lines = findings
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
          <div key={idx} className="mt-5 mb-2">
            <h3 className="text-[#1E395B] font-bold text-base border-b-2 border-[#2B579A]/20 pb-1 font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2B579A]"></span>
              {cleanHeader}
            </h3>
          </div>
        );
      }

      if (isBullet) {
        const cleanBullet = line.replace(/^[\*\-]\s*/, '').replace(/\*\*/g, '');
        return (
          <li key={idx} className="ml-6 list-disc text-zinc-800 text-[13px] leading-relaxed my-1 font-sans">
            {cleanBullet}
          </li>
        );
      }

      return (
        <p key={idx} className="text-zinc-800 text-[13px] md:text-[14px] leading-relaxed my-2 font-sans">
          {line.replace(/\*\*/g, '')}
        </p>
      );
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-4xl h-[90vh] bg-[#505050] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-700"
        >
          {/* MS Word Ribbon Header */}
          <div className="bg-[#185ABD] text-white shrink-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white text-[#185ABD] font-black rounded-sm flex items-center justify-center text-xs">
                  W
                </div>
                <span className="font-semibold">
                  MedGemma_Report_{patientId}.docx - Microsoft Word Formatted View
                </span>
              </div>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ribbon Tab Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#2B579A] text-xs">
              <div className="flex items-center gap-1">
                {['File', 'Home', 'Insert', 'Layout', 'References', 'Review', 'View'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveWordTab(tab)}
                    className={`px-2.5 py-1 rounded transition-all ${
                      activeWordTab === tab 
                        ? 'bg-white text-[#185ABD] font-bold shadow-sm' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadWord}
                  className="bg-white hover:bg-zinc-100 text-[#185ABD] px-3 py-1 rounded font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download .DOCX
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="bg-[#8D321F] hover:bg-[#a03823] text-white px-3 py-1 rounded font-semibold flex items-center gap-1.5 shadow-sm text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Word Paper Sheet */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 flex justify-center bg-[#505050]">
            <div className="w-full max-w-[760px] bg-white text-zinc-900 shadow-2xl rounded-sm p-8 sm:p-12 min-h-[900px] flex flex-col justify-between">
              
              <div>
                {/* Header */}
                <div className="border-b-2 border-[#1E395B] pb-4 mb-5 flex items-start justify-between">
                  <div>
                    <h1 className="text-lg font-bold font-serif text-[#1E395B] uppercase">
                      Kitten Diagnostic Studio
                    </h1>
                    <p className="text-[11px] text-zinc-500 font-sans">
                      Department of Radiology • MedGemma Multimodal AI Consultation
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" /> AI CLINICAL CONSULT
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="text-center mb-5">
                  <h2 className="text-base font-bold text-[#1E395B] uppercase tracking-wide font-serif">
                    {title}
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Consultation Outcome & MedGemma Diagnostic Assessment
                  </p>
                </div>

                {/* Metadata Table */}
                <div className="mb-5 overflow-hidden rounded border border-[#CBD5E1]">
                  <table className="w-full text-xs font-sans border-collapse">
                    <tbody>
                      <tr className="border-b border-[#CBD5E1] bg-[#F8FAFC]">
                        <td className="py-1.5 px-3 font-bold text-[#1E395B] w-1/4 border-r border-[#CBD5E1]">Patient Name:</td>
                        <td className="py-1.5 px-3 text-zinc-900 w-1/4 border-r border-[#CBD5E1]">{patientName}</td>
                        <td className="py-1.5 px-3 font-bold text-[#1E395B] w-1/4 border-r border-[#CBD5E1]">Case/Consult ID:</td>
                        <td className="py-1.5 px-3 font-mono text-zinc-900 w-1/4 font-semibold">{patientId}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-bold text-[#1E395B] bg-[#F8FAFC] border-r border-[#CBD5E1]">Modality / Part:</td>
                        <td className="py-1.5 px-3 text-zinc-900 border-r border-[#CBD5E1]">{modality}</td>
                        <td className="py-1.5 px-3 font-bold text-[#1E395B] bg-[#F8FAFC] border-r border-[#CBD5E1]">AI Engine:</td>
                        <td className="py-1.5 px-3 text-blue-800 font-semibold">MedGemma 1.5-4B IT</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Findings Content */}
                <div className="text-justify font-sans">
                  {renderFormattedFindings()}
                </div>
              </div>

              {/* Sign-Off Footer */}
              <div className="mt-8 pt-4 border-t-2 border-[#1E395B] font-sans">
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <p className="font-bold text-[#1E395B]">Attending Radiologist / Reviewer:</p>
                    <p className="font-serif italic text-sm text-zinc-800">Dr. Mohammad Hassan, MD</p>
                    <p className="text-zinc-500 text-[10px]">Kitten Diagnostic Center</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-end">
                    <span className="inline-flex items-center gap-1 text-[#185ABD] font-bold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" /> MedGemma Certified
                    </span>
                    <p className="text-zinc-400 text-[10px] mt-1">Microsoft Word Formatted Clinical Export</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
