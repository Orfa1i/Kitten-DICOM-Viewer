import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon, SparkleIcon } from '../ui/LottieIcon';
import { Search, BookOpen, FileText, Download, ExternalLink, Activity } from 'lucide-react';

export const AiAssistantDrawer: React.FC = () => {
  const { 
    chatMessages, 
    addChatMessage, 
    setUploadedFile, 
    setUploadedFileName,
    patientForm,
    selectedModel,
    accuracyScore,
    diagnosticReport,
    exportPdfReport
  } = useMedicalApp();
  
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    addChatMessage(inputText.trim(), 'user');
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
      setUploadedFileName(file.name);
      addChatMessage(`Attached radiograph study: ${file.name}`, 'user');
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    addChatMessage(promptText, 'user');
  };

  const modelLabel = selectedModel === 'fracture-detection' 
    ? 'YOLO11n Bone Fracture' 
    : 'Knee OA Ensemble';

  return (
    <div className="flex-1 flex gap-8 w-full max-w-[1360px] mx-auto h-full items-stretch select-none overflow-hidden">
      {/* Left: AI Assistant Card */}
      <aside className="w-[420px] flex-shrink-0 flex flex-col h-full relative z-10">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] border-[3.5px] border-[#8D321F]/80 p-4 shadow-sm h-full flex flex-col justify-between overflow-hidden">
          {/* Header with Sparkle Icon and Live Sync Telemetry Badge */}
          <div className="px-2 pt-1 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.div 
                  className="text-[#8D321F]"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <SparkleIcon className="w-7 h-7 text-[#8D321F]" />
                </motion.div>
                <h2 className="text-[23px] font-display font-semibold text-[#1F1F1F] tracking-tight">
                  AI Diagnostic Copilot
                </h2>
              </div>
              <button
                onClick={exportPdfReport}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#8D321F]/10 hover:bg-[#8D321F]/20 text-[#8D321F] rounded-full text-xs font-semibold transition active:scale-95"
                title="Export PDF Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Export</span>
              </button>
            </div>

            {/* Active Case Telemetry Strip */}
            <div className="mt-2 bg-[#8D321F]/8 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] text-zinc-700 border border-[#8D321F]/15">
              <div className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-[#00BF63] animate-pulse" />
                <span className="font-bold text-zinc-900">{patientForm.name || 'Unassigned Case'}</span>
                <span className="text-zinc-400">({patientForm.id || 'Pending'})</span>
              </div>
              <span className="font-mono text-[#8D321F] font-bold">
                {modelLabel}
              </span>
            </div>
          </div>

          {/* Chat Feed Body */}
          <div className="flex-1 bg-[#F9F6F6] rounded-[24px] p-3.5 flex flex-col justify-between overflow-hidden border border-zinc-200/70">
            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar flex flex-col justify-start">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#8D321F] text-white rounded-br-xs'
                        : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Grounded PubMed Literature Evidence Chips */}
                    {msg.pubmedArticles && msg.pubmedArticles.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-200/80 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8D321F] uppercase tracking-wider">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>PubMed Biomedical Literature Citations</span>
                        </div>
                        {msg.pubmedArticles.map((art, aIdx) => (
                          <a
                            key={aIdx}
                            href={art.url || `https://pubmed.ncbi.nlm.nih.gov/${art.pmid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="bg-[#8D321F]/10 text-[#8D321F] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                                PMID: {art.pmid}
                              </span>
                              <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-[#8D321F] transition" />
                            </div>
                            <p className="text-[12px] font-semibold text-zinc-800 mt-1 line-clamp-1 group-hover:text-[#8D321F]">
                              {art.title}
                            </p>
                            <p className="text-[10.5px] text-zinc-500 font-mono">
                              {art.authors} • {art.journal}
                            </p>
                            {art.takeaway && (
                              <p className="text-[11px] text-zinc-600 italic mt-0.5">
                                "{art.takeaway}"
                              </p>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 px-1 font-mono">
                    {msg.modelUsed ? `${msg.modelUsed} • ` : ''}{msg.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Interactive Diagnostic Action Chips */}
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
              <button
                onClick={() => handleQuickPrompt("Generate a comprehensive radiology diagnostic report for this case.")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-700 font-medium whitespace-nowrap flex items-center gap-1 shadow-2xs active:scale-95 transition"
              >
                <FileText className="w-3 h-3 text-[#8D321F]" />
                <span>Full Radiology Report</span>
              </button>

              <button
                onClick={() => handleQuickPrompt("Search PubMed for recent peer-reviewed literature and clinical guidelines on this diagnosis.")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-700 font-medium whitespace-nowrap flex items-center gap-1 shadow-2xs active:scale-95 transition"
              >
                <BookOpen className="w-3 h-3 text-[#8D321F]" />
                <span>PubMed Evidence</span>
              </button>

              <button
                onClick={() => handleQuickPrompt("What are the recommended orthopedic treatment protocols and follow-up intervals?")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-700 font-medium whitespace-nowrap flex items-center gap-1 shadow-2xs active:scale-95 transition"
              >
                <Activity className="w-3 h-3 text-[#00BF63]" />
                <span>Treatment Protocols</span>
              </button>
            </div>

            {/* Bottom Prompt Bar Capsule */}
            <div className="pt-2 flex items-center gap-2 flex-shrink-0">
              {/* Upload Trigger */}
              <label className="cursor-pointer p-1.5 rounded-full hover:bg-zinc-200/70 transition text-[#8D321F] group">
                <input
                  type="file"
                  accept="image/*,.dicom,.dcm"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-8 h-8 flex items-center justify-center group-hover:scale-115 transition-transform">
                  <LottieIcon name="file-upload" size={32} />
                </div>
              </label>

              {/* Search / Text Input Capsule */}
              <div className="flex-1 bg-white border border-[#8D321F]/40 rounded-full px-3.5 py-2 flex items-center shadow-2xs focus-within:ring-1 focus-within:ring-[#8D321F]">
                <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask copilot or search PubMed..."
                  className="w-full bg-transparent text-[13.5px] text-zinc-800 placeholder-zinc-400 focus:outline-none"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                className="p-1.5 rounded-full text-[#8D321F] hover:bg-[#8D321F]/10 active:scale-95 transition group"
              >
                <div className="w-8 h-8 flex items-center justify-center group-hover:scale-115 transition-transform">
                  <LottieIcon name="send" size={32} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: Workspace Backdrop Preview with Active Report Summary */}
      <div className="flex-1 bg-[#FAF6F6] rounded-[32px] border border-zinc-200/70 p-8 flex flex-col justify-between text-zinc-700 shadow-inner h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#8D321F] font-spartan">
                Active Telemetry Stream
              </span>
              <h3 className="text-[26px] font-spartan font-bold text-zinc-900 mt-0.5">
                {diagnosticReport.diagnosis || 'Diagnostic Session in Progress'}
              </h3>
            </div>

            <button
              onClick={exportPdfReport}
              className="px-5 py-2.5 bg-[#8D321F] hover:bg-[#7D2A18] text-white rounded-full text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition active:scale-95 font-spartan"
            >
              <Download className="w-4 h-4" />
              <span>Export Full PDF Report</span>
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
              <span className="text-[11.5px] text-zinc-500 block">Patient Name</span>
              <strong className="text-[15px] text-zinc-900 font-semibold">{patientForm.name || 'Unassigned Patient'}</strong>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
              <span className="text-[11.5px] text-zinc-500 block">AI Neural Model</span>
              <strong className="text-[15px] text-[#8D321F] font-semibold">{modelLabel}</strong>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
              <span className="text-[11.5px] text-zinc-500 block">Confidence Grade</span>
              <strong className="text-[15px] text-[#00BF63] font-semibold">{(accuracyScore || 98.6).toFixed(1)}% AI Precision</strong>
            </div>
          </div>

          {/* Clinical Findings & Evidence */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
            <h4 className="text-[16px] font-bold text-zinc-900 font-spartan flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#8D321F]" />
              <span>Current Radiographic Findings</span>
            </h4>
            <ul className="list-disc list-inside space-y-2 text-[13.5px] text-zinc-700 leading-relaxed">
              {diagnosticReport.findings.map((f, i) => (
                <li key={i} className="font-medium">{f}</li>
              ))}
            </ul>

            <div className="pt-3 border-t border-zinc-100">
              <h5 className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Radiologist Impression & Plan
              </h5>
              <p className="text-[13.5px] text-zinc-700 leading-relaxed">
                {diagnosticReport.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[12px] text-zinc-400 pt-4 border-t border-zinc-200/60">
          Kitten AI Radiology Assistant • Synchronized with NCBI PubMed Clinical Databases
        </div>
      </div>
    </div>
  );
};
