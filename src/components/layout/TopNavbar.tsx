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
    openNewCaseModal,
    userProfile,
    setIsProfileModalOpen,
    setIsMedGemmaTestOpen
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
          <span className="font-spartan font-bold text-[35px] tracking-tight text-white hover:opacity-95 transition-opacity drop-shadow-sm">
            Kitten
          </span>
        </button>

        {/* MedGemma Test Button */}
        <button
          onClick={() => setIsMedGemmaTestOpen(true)}
          className="relative overflow-hidden bg-gradient-to-b from-amber-400/20 to-amber-500/10 text-amber-100 hover:text-white px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1.5px_1px_rgba(255,255,255,0.2)] border border-amber-400/30 hover:bg-amber-400/20 group"
          title="MedGemma Integration Test"
        >
          <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-full" />
          <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
            <Globe className="w-4 h-4 text-amber-200 drop-shadow-md" />
            <span className="hidden lg:inline">MedGemma</span>
          </span>
        </button>

        {/* Landing Page Link - White Glass Jelly */}
        <button
          onClick={() => setCurrentScreen('landing')}
          className="relative overflow-hidden bg-gradient-to-b from-white/20 to-white/10 text-white/90 hover:text-white px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1.5px_1px_rgba(255,255,255,0.2)] border border-white/20 hover:bg-white/20 group"
          title="View Landing Page"
        >
          <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
          <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
            <Globe className="w-4 h-4 text-white/90 drop-shadow-md" />
            <span className="hidden lg:inline">Landing</span>
          </span>
        </button>


      </div>

      {/* Right Search Input & Profile Action */}
      <div className="flex items-center gap-6">
        {/* Case ID Search Pill */}

        {/* Profile Capsule moved from Settings */}
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          className="border border-white/20 rounded-full px-2 py-1.5 flex items-center gap-3 bg-white hover:bg-zinc-50 transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.2)] group cursor-pointer pr-3"
        >
          <div className="flex items-center gap-3">
            <img
              src={userProfile?.avatar || "/assets/images/doctor_avatar.jpg"}
              alt={userProfile?.name || "Dr.Mohammad"}
              className="w-10 h-10 rounded-full object-cover border border-zinc-200"
            />
            <span className="font-semibold text-[16px] text-zinc-900 tracking-tight hidden md:inline-block">
              {userProfile?.name || "Dr.Mohammad"}
            </span>
          </div>
          <div 
            className="w-6 h-6 text-zinc-400 flex items-center justify-center group-hover:scale-110 transition-transform hover:text-[#8D321F]"
          >
            <LottieIcon name="brush" size={24} />
          </div>
        </div>
      </div>
    </header>
  );
};

