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
      {/* Left Edge Sticky Chevron Tab Scaled Up */}
      <button
        onClick={toggleDrawer}
        className="fixed left-0 top-1/2 -translate-y-1/2 bg-[#8D321F] hover:bg-[#782817] text-white py-4 px-2.5 rounded-r-2xl shadow-xl flex items-center justify-center transition-all duration-200 hover:pl-3.5 z-40 group cursor-pointer border-t border-r border-b border-white/20 active:scale-95"
        title="Toggle AI Assistant & Navigation Panel"
      >
        <div className="w-6 h-6 flex items-center justify-center filter brightness-0 invert group-hover:translate-x-1 transition-transform">
          <LottieIcon name="chevrons-right" size={26} />
        </div>
      </button>

      {/* Bottom Left Floating Gear Icon Scaled Up */}
      <button
        onClick={() => setCurrentScreen('dashboard')}
        className="fixed bottom-6 left-6 w-13 h-13 bg-white/95 hover:bg-white text-[#1F1F1F] rounded-full shadow-lg border border-zinc-300 flex items-center justify-center transition-all hover:scale-110 hover:shadow-xl z-40 group"
        title="Settings & Lead Radiologist Profile"
      >
        <div className="w-8 h-8 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
          <LottieIcon name="setting" size={30} />
        </div>
      </button>
    </>
  );
};
