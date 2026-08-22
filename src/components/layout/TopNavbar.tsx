import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon } from '../ui/LottieIcon';
import { Search, Globe } from 'lucide-react';

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
      <div className="flex items-center gap-6 md:gap-8">
        <button
          onClick={() => setCurrentScreen('landing')}
          className="flex items-center gap-2 group focus:outline-none"
          title="Return to Kitten Landing Page"
        >
          <span className="font-spartan font-bold text-[35px] tracking-tight text-white hover:opacity-95 transition-opacity">
            Kitten
          </span>
        </button>

        {/* Landing Page Link */}
        <button
          onClick={() => setCurrentScreen('landing')}
          className="flex items-center gap-2 text-white/80 hover:text-white px-3.5 py-2 rounded-full hover:bg-white/10 text-[14px] font-medium transition"
          title="View Landing Page"
        >
          <Globe className="w-4 h-4 text-white/90" />
          <span className="hidden lg:inline">Landing</span>
        </button>

        {/* Workflow Pill Button with Larger Icon */}
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className={`flex items-center gap-3 px-6 py-2.5 rounded-full font-medium transition-all duration-200 shadow-sm ${
            currentScreen === 'dashboard'
              ? 'bg-white text-[#8D321F] font-semibold ring-2 ring-white/40 shadow-md scale-[1.01]'
              : 'bg-white text-[#2C2B2B] hover:bg-white hover:shadow'
          }`}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <LottieIcon name="home" size={34} />
          </div>
          <span className="font-semibold text-zinc-900 text-[16px]">Workflow</span>
        </button>
      </div>

      {/* Right Search Input & New Case Action */}
      <div className="flex items-center gap-6">
        {/* Case ID Search Pill */}
        <div className="relative flex items-center bg-white rounded-full px-4 py-2 shadow-inner w-64 md:w-84 transition-all focus-within:ring-2 focus-within:ring-white/80">
          <Search className="w-5 h-5 text-[#8D321F] mr-2.5 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Case ID"
            className="w-full bg-transparent text-[15px] text-zinc-800 placeholder-zinc-400 focus:outline-none font-medium"
          />
        </div>

        {/* New Case Button with Larger Icon */}
        <button
          onClick={openNewCaseModal}
          className="flex items-center gap-3 text-white hover:bg-white/10 active:scale-95 px-5 py-2.5 rounded-full font-medium text-[16.5px] transition-all duration-150 group border border-transparent hover:border-white/20"
        >
          <div className="w-9 h-9 flex items-center justify-center filter brightness-0 invert group-hover:scale-115 transition-transform">
            <LottieIcon name="file-add" size={38} />
          </div>
          <span className="font-semibold text-white tracking-wide text-[17px]">
            New case
          </span>
        </button>
      </div>
    </header>
  );
};
