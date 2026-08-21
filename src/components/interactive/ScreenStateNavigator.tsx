import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon } from '../ui/LottieIcon';

export const ScreenStateNavigator: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useMedicalApp();

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
    </>
  );
};
