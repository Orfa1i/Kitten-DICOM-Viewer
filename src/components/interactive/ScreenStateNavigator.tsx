import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ScreenState } from '../../types';
import { LottieIcon } from '../ui/LottieIcon';
import { Laptop, Monitor } from 'lucide-react';

export const ScreenStateNavigator: React.FC = () => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    presentationMode, 
    setPresentationMode 
  } = useMedicalApp();

  const screens: { id: ScreenState; label: string; number: number }[] = [
    { id: 'dashboard', label: '1. Dashboard / Cases', number: 1 },
    { id: 'ai-assistant', label: '2. AI Copilot Drawer', number: 2 },
    { id: 'model-select', label: '3. Model Selection', number: 3 },
    { id: 'intake-upload', label: '4. Intake & Upload', number: 4 },
    { id: 'diagnostic-studio', label: '5. Diagnostic Studio', number: 5 },
  ];

  const toggleDrawer = () => {
    if (currentScreen === 'ai-assistant') {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('ai-assistant');
    }
  };

  return (
    <>
      {/* Left Edge Sticky Chevron Tab (Chevrons Right) */}
      <button
        onClick={toggleDrawer}
        className="fixed left-0 top-1/2 -translate-y-1/2 bg-[#8D321F] hover:bg-[#782817] text-white py-3 px-2 rounded-r-2xl shadow-lg flex items-center justify-center transition-all duration-200 hover:pl-3 z-40 group cursor-pointer border-t border-r border-b border-white/20"
        title="Toggle AI Assistant & Navigation Panel"
      >
        <div className="w-5 h-5 flex items-center justify-center filter brightness-0 invert group-hover:translate-x-0.5 transition-transform">
          <LottieIcon name="chevrons-right" size={20} />
        </div>
      </button>

      {/* Bottom Left Floating Gear Icon */}
      <button
        onClick={() => setCurrentScreen('dashboard')}
        className="fixed bottom-6 left-6 w-11 h-11 bg-white/90 hover:bg-white text-[#1F1F1F] rounded-full shadow-md border border-zinc-300 flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg z-40 group"
        title="Settings & Lead Radiologist Profile"
      >
        <div className="w-6 h-6 flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
          <LottieIcon name="setting" size={22} />
        </div>
      </button>

      {/* Bottom Center Floating Auditor Control Bar */}
      <nav
        aria-label="Screen navigator"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1B1B1E]/90 backdrop-blur-md text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl z-50 border border-white/15 text-xs select-none"
      >
        <span className="text-zinc-400 font-mono text-[11px] px-1 hidden sm:inline">
          AUDIT VIEWS:
        </span>

        {screens.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrentScreen(s.id)}
            className={`px-3 py-1.5 rounded-full font-medium transition-all duration-150 flex items-center gap-1.5 ${
              currentScreen === s.id
                ? 'bg-[#8D321F] text-white shadow-md font-semibold ring-1 ring-white/30 scale-105'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="font-mono text-[11px] opacity-75">{s.number}</span>
            <span className="hidden md:inline">{s.label.split('. ')[1]}</span>
          </button>
        ))}

        <div className="w-px h-4 bg-zinc-600 mx-1"></div>

        {/* Presentation Mockup Toggle */}
        <button
          onClick={() => setPresentationMode(!presentationMode)}
          className={`px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition ${
            presentationMode
              ? 'bg-amber-600/90 text-white font-medium ring-1 ring-white/30'
              : 'text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Laptop Presentation Mockup Frame"
        >
          {presentationMode ? <Laptop className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{presentationMode ? 'Laptop Frame' : 'Fullscreen'}</span>
        </button>
      </nav>
    </>
  );
};
