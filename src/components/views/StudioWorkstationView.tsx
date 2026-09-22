import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ArrowLeft, Beaker } from 'lucide-react';

export const StudioWorkstationView: React.FC = () => {
  const { setCurrentScreen } = useMedicalApp();

  return (
    <div className="w-full h-full bg-[#111111] text-white flex flex-col items-center justify-center p-8 relative">
      <button 
        onClick={() => setCurrentScreen('dashboard')}
        className="absolute top-6 left-6 relative overflow-hidden bg-gradient-to-b from-white/10 to-white/5 text-white/80 hover:text-white w-10 h-10 rounded-full font-medium transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center border border-white/20 hover:bg-white/10 group"
      >
        <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-full" />
        <span className="relative z-10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 drop-shadow-md" />
        </span>
      </button>

      <div className="text-center max-w-lg p-8 border border-white/10 rounded-2xl bg-white/5 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <Beaker className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">DICOM Viewer Removed</h2>
        <p className="text-zinc-400 leading-relaxed text-[15px] mb-6">
          The previous DICOM viewer architecture has been completely removed from the codebase.
        </p>
      </div>
    </div>
  );
};
