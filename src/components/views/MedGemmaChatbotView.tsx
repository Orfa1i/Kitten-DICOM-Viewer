import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { SettingPanel } from '../interactive/SettingPanel';
import { Bot, Send, User, Loader2, FileWarning, Sparkles, FileText, Download } from 'lucide-react';
import { WordDocumentModal } from '../modals/WordDocumentModal';
import { generateAndDownloadWordReport } from '../../services/wordReportGenerator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const MedGemmaChatbotView: React.FC = () => {
  const { setCurrentScreen, activeCaseId, cases } = useMedicalApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am MedGemma, a specialized clinical AI assistant. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wordModalData, setWordModalData] = useState<{
    isOpen: boolean;
    findings: string;
    title?: string;
  }>({ isOpen: false, findings: '', title: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeCase = cases.find(c => c.id === activeCaseId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const historyPayload = messages.filter(m => m.id !== '1').map(m => ({ role: m.role, content: m.content }));
      historyPayload.push({ role: 'user', content: userMsg.content });
      
      const response = await fetch("http://127.0.0.1:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload })
      });
      
      if (!response.ok) throw new Error("Failed to connect to MedGemma service.");
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || "No response received."
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Error**: ${err.message}. Please make sure MedGemma is running.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAllChatToWord = async () => {
    const consultationContent = messages
      .filter(m => m.id !== '1')
      .map(m => `**${m.role === 'user' ? 'Physician / Clinical Question' : 'MedGemma AI Clinical Assessment'}:**\n${m.content}`)
      .join('\n\n---\n\n');

    if (!consultationContent.trim()) {
      alert("No consultation messages to export yet.");
      return;
    }

    await generateAndDownloadWordReport({
      patient: {
        id: activeCase?.id || 'CONSULT-' + Date.now().toString().slice(-4),
        name: activeCase?.patientName || 'Consultation Patient',
        age: String(activeCase?.age || 'N/A'),
        sex: String(activeCase?.sex || 'N/A'),
        studyDate: activeCase?.date || new Date().toLocaleDateString(),
        modality: activeCase?.type || 'Multimodal AI Consultation'
      },
      findings: consultationContent,
      diagnosisTitle: "MedGemma Clinical Consultation Summary"
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <SettingPanel />
      
      <div className="flex-1 h-full bg-[#FDF9F9] flex flex-col p-8 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-[#8D321F]/10 p-2 rounded-xl">
                <Bot className="w-6 h-6 text-[#8D321F]" />
              </div>
              <h1 className="text-3xl font-spartan font-bold text-zinc-900 tracking-tight">MedGemma Chat</h1>
            </div>
            <p className="text-sm text-zinc-500 font-sans ml-12">Conversational interface for the dedicated 4B quantized model</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAllChatToWord}
              className="bg-[#185ABD] hover:bg-[#104a9b] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
              title="Convert entire AI conversation outcome to a Microsoft Word document"
            >
              <FileText className="w-4 h-4" /> Export Consultation to Word (.docx)
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-700 tracking-wider">MEDGEMMA ONLINE</span>
            </div>
          </div>
        </div>
        
        {/* Chat Container */}
        <div className="flex-1 bg-white border border-zinc-200/80 rounded-[32px] shadow-sm flex flex-col overflow-hidden relative">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8D321F] to-orange-400"></div>
          
          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 custom-scrollbar">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-[#8D321F] text-white'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  
                  <div className={`px-6 py-4 rounded-2xl text-[15px] leading-relaxed flex flex-col ${
                    msg.role === 'user' 
                      ? 'bg-zinc-800 text-white rounded-tr-sm' 
                      : 'bg-zinc-50 border border-zinc-100 text-zinc-800 rounded-tl-sm shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Word Formatted Actions for AI Responses */}
                    {msg.role === 'assistant' && msg.id !== '1' && (
                      <div className="mt-4 pt-3 border-t border-zinc-200/70 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setWordModalData({
                            isOpen: true,
                            findings: msg.content,
                            title: "MedGemma Clinical Consultation Report"
                          })}
                          className="bg-white hover:bg-zinc-100 text-[#185ABD] border border-[#185ABD]/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                          title="View this outcome formatted as an MS Word document"
                        >
                          <FileText className="w-3.5 h-3.5" /> Word Formatted View
                        </button>
                        
                        <button
                          onClick={() => generateAndDownloadWordReport({
                            patient: {
                              id: activeCase?.id || 'CONSULT-' + msg.id.slice(-4),
                              name: activeCase?.patientName || 'Consultation Patient',
                              studyDate: new Date().toLocaleDateString()
                            },
                            findings: msg.content,
                            diagnosisTitle: "MedGemma Diagnostic Assessment"
                          })}
                          className="bg-[#185ABD] hover:bg-[#124b9e] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                          title="Download this response as a .docx file"
                        >
                          <Download className="w-3.5 h-3.5" /> Download .DOCX
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex gap-4 max-w-[80%] mr-auto"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-[#8D321F] text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="px-6 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-500 rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8D321F]" />
                  <span>MedGemma is thinking...</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 md:p-6 bg-white border-t border-zinc-100">
            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 focus-within:border-[#8D321F]/40 focus-within:ring-2 focus-within:ring-[#8D321F]/10 transition-all">
              <input 
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask MedGemma a clinical question..."
                className="flex-1 bg-transparent px-4 py-3 outline-none text-[15px] text-zinc-800 placeholder-zinc-400"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-[#8D321F] text-white p-3.5 rounded-xl hover:bg-[#7D2A18] disabled:opacity-50 transition-all active:scale-95 shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-zinc-400 font-spartan">
              <FileWarning className="w-3.5 h-3.5" />
              <span>MedGemma can make mistakes. Outputs are for research and reference only and should not override clinical judgment.</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* MS Word Formatted Document Modal */}
      <WordDocumentModal 
        isOpen={wordModalData.isOpen}
        onClose={() => setWordModalData(prev => ({ ...prev, isOpen: false }))}
        title={wordModalData.title}
        findings={wordModalData.findings}
        patientName={activeCase?.patientName}
        patientId={activeCase?.id}
        age={activeCase?.age ? String(activeCase.age) : undefined}
        sex={activeCase?.sex}
        modality={activeCase?.type}
        thumbnailUrl={activeCase?.id ? `http://127.0.0.1:8000/api/cases/${activeCase.id}/thumbnail` : undefined}
      />
    </div>
  );
};
