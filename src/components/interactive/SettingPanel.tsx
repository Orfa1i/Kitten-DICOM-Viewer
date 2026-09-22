import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { Eye, Layers, List, Lock, Palette, UserCircle, Settings, BookOpen, Bot, FileText } from 'lucide-react';

export const SettingPanel: React.FC = () => {
  const { setIsProfileModalOpen, setCurrentScreen, setIsWorklistOpen, cases } = useMedicalApp();

  return (
    <aside className="w-[280px] flex-shrink-0 relative flex flex-col select-none h-full py-4 z-10">
      {/* Outer Card Container */}
      <div className="bg-white rounded-[32px] border border-[#a25446] p-5 shadow-sm h-full flex flex-col relative overflow-hidden">
        {/* Inner subtle dotted outline border in the image? Actually it's just a clean box. The image shows a very clean white card with a red-brown border. Inside there's a dotted bounding box around the inner content in the mockup? No, the dotted line is just a Figma selection/layout grid artifact! I will ignore it. */}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-[26px] font-bold text-[#8D321F] tracking-tight">Setting</h2>
          <Settings className="w-5 h-5 text-zinc-600 stroke-[2]" />
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-3">
                    {/* Cases List */}
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 text-[15px] font-medium text-zinc-800 hover:text-[#8D321F] hover:border-zinc-300 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center gap-2.5 group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-full opacity-90" />
            <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
              <FileText className="w-[18px] h-[18px] text-zinc-600 group-hover:text-[#8D321F]" />
              Cases
            </span>
          </button>
          
          {/* DICOM Viewer */}
          <button
            onClick={() => setCurrentScreen('iframe-viewer')}
            className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-blue-600 bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-[15px] font-semibold text-white transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(37,99,235,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-between group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-full opacity-90" />
            <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
              <Eye className="w-[18px] h-[18px]" />
              DICOM Viewer
            </span>
            <Layers className="w-[18px] h-[18px] relative z-10 opacity-90" />
          </button>

          {/* Worklist */}
          <button
            onClick={() => setIsWorklistOpen(true)}
            className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 text-[15px] font-medium text-zinc-800 hover:text-[#8D321F] hover:border-zinc-300 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center justify-between group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-full opacity-90" />
            <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
              <List className="w-[18px] h-[18px] text-zinc-600 group-hover:text-[#8D321F]" />
              Worklist
            </span>
            <span className="relative z-10 bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border border-zinc-200">{cases.length} Files</span>
          </button>

          {/* Security & Access */}
          <button
            onClick={() => {}}
            className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 text-[15px] font-medium text-zinc-800 hover:text-[#8D321F] hover:border-zinc-300 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center gap-2.5 group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-full opacity-90" />
            <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
              <Lock className="w-[18px] h-[18px] text-zinc-600 group-hover:text-[#8D321F]" />
              Security & Access
            </span>
          </button>



          
          
          {/* Knowledge Sources */}
          <button
            onClick={() => setCurrentScreen('knowledge-sources')}
            className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 text-[15px] font-medium text-zinc-800 hover:text-[#8D321F] hover:border-zinc-300 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center gap-2.5 group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-full opacity-90" />
            <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
              <BookOpen className="w-[18px] h-[18px] text-zinc-600 group-hover:text-[#8D321F]" />
              Knowledge Sources
            </span>
          </button>


                      {/* MedGemma Chatbot */}
            <button
              onClick={() => setCurrentScreen('medgemma-chat')}
              className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 text-[15px] font-medium text-zinc-800 hover:text-[#8D321F] hover:border-zinc-300 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center gap-2.5 group"
            >
              <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-full opacity-90" />
              <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
                <Bot className="w-[18px] h-[18px] text-zinc-600 group-hover:text-[#8D321F]" />
                MedGemma Chatbot
              </span>
            </button>

            {/* Configuration */}
          <button
            onClick={() => setCurrentScreen('configuration')}
            className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 text-[15px] font-medium text-zinc-800 hover:text-[#8D321F] hover:border-zinc-300 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center gap-2.5 group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-full opacity-90" />
            <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
              <Settings className="w-[18px] h-[18px] text-zinc-600 group-hover:text-[#8D321F]" />
              Configuration
            </span>
          </button>

          {/* Profile Settings */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="relative overflow-hidden w-full py-3 px-4 rounded-full border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 text-[15px] font-medium text-zinc-800 hover:text-[#8D321F] hover:border-zinc-300 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center gap-2.5 group"
          >
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white to-transparent pointer-events-none rounded-t-full opacity-90" />
            <span className="relative z-10 drop-shadow-sm flex items-center gap-2.5">
              <UserCircle className="w-[18px] h-[18px] text-zinc-600 group-hover:text-[#8D321F]" />
              Profile Settings
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};


