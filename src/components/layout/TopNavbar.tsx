import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon } from '../ui/LottieIcon';
import { Search } from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    searchQuery, 
    setSearchQuery, 
    openNewCaseModal 
  } = useMedicalApp();

  return (
    <header className="w-full bg-[#8D321F] text-white px-8 py-3.5 flex items-center justify-between shadow-md select-none relative z-30 flex-shrink-0">
      {/* Left Brand & Workflow Pill */}
      <div className="flex items-center gap-8">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="flex items-center gap-2 group focus:outline-none"
        >
          <span className="font-['Fredoka'] font-semibold text-[34px] tracking-normal text-white hover:opacity-95 transition-opacity">
            Kitten
          </span>
        </button>

        {/* Workflow Pill Button */}
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className={`flex items-center gap-3 px-6 py-2.5 rounded-full font-medium text-[15px] transition-all duration-200 shadow-sm ${
            currentScreen === 'dashboard'
              ? 'bg-white text-[#8D321F] font-semibold ring-2 ring-white/40 shadow-md scale-[1.01]'
              : 'bg-white text-[#2C2B2B] hover:bg-white hover:shadow'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <LottieIcon name="home" size={26} />
          </div>
          <span className="font-semibold text-zinc-900 text-[15.5px]">Workflow</span>
        </button>
      </div>

      {/* Right Search Input & New Case Action */}
      <div className="flex items-center gap-5">
        {/* Case ID Search Pill */}
        <div className="relative flex items-center bg-white rounded-full px-4 py-2 shadow-inner w-60 md:w-80 transition-all focus-within:ring-2 focus-within:ring-white/80">
          <Search className="w-4.5 h-4.5 text-[#8D321F] mr-2.5 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Case ID"
            className="w-full bg-transparent text-[14.5px] text-zinc-800 placeholder-zinc-400 focus:outline-none font-medium"
          />
        </div>

        {/* New Case Button */}
        <button
          onClick={openNewCaseModal}
          className="flex items-center gap-3 text-white hover:bg-white/10 active:scale-95 px-5 py-2.5 rounded-full font-medium text-[16px] transition-all duration-150 group border border-transparent hover:border-white/20"
        >
          {/* File Add Icon Scaled Up 25% */}
          <div className="w-7 h-7 flex items-center justify-center filter brightness-0 invert group-hover:scale-110 transition-transform">
            <LottieIcon name="file-add" size={30} />
          </div>
          <span className="font-semibold text-white tracking-wide text-[16.5px]">
            New case
          </span>
        </button>
      </div>
    </header>
  );
};
