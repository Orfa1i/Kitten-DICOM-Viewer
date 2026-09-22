import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { Server } from 'lucide-react';

export const ScreenStateNavigator: React.FC = () => {
  const { setCurrentScreen } = useMedicalApp();

  return (
    <button
      type="button"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentScreen('mock-pacs');
      }}
      className="fixed bottom-6 left-6 w-16 h-16 bg-gradient-to-b from-white to-zinc-100 text-[#1F1F1F] rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,1)] border border-zinc-200 flex items-center justify-center transition-all hover:scale-110 hover:brightness-105 group cursor-pointer"
      title="Mock PACS Server"
    >
      <div className="w-10 h-10 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500 relative z-10">
        <Server className="w-8 h-8 text-[#1F1F1F] group-hover:text-[#8D321F] transition-colors" strokeWidth={2.5} />
      </div>
    </button>
  );
};
