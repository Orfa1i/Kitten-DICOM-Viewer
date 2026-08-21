import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon } from '../ui/LottieIcon';

export const SettingPanel: React.FC = () => {
  const { openNewCaseModal } = useMedicalApp();

  return (
    <aside className="w-[305px] flex-shrink-0 relative flex flex-col select-none">
      {/* Outer Card Container */}
      <div className="bg-white rounded-[32px] border-[3px] border-[#8D321F] p-3.5 shadow-sm h-full flex flex-col justify-between relative overflow-hidden">
        {/* Inner Dashed Border Guide */}
        <div className="border border-dashed border-[#B8B5B5] rounded-[24px] p-4 flex flex-col justify-between h-full bg-white">
          {/* Top Section */}
          <div className="space-y-3.5">
            {/* Header: Setting + Gear */}
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-[23px] font-display font-semibold text-[#1F1F1F] tracking-tight">
                Setting
              </h2>
              <div className="w-5 h-5 text-[#1F1F1F]">
                <LottieIcon name="setting" size={22} />
              </div>
            </div>

            {/* Profile Capsule */}
            <div className="border border-dashed border-[#8E8280] rounded-full px-2.5 py-1.5 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/images/avatar_hassan.png"
                  alt="Dr. Hassan"
                  className="w-9 h-9 rounded-full object-cover border border-[#8D321F]/30"
                />
                <span className="font-semibold text-[17px] text-[#1F1F1F] tracking-tight">
                  Hassan
                </span>
              </div>
              <div className="w-5 h-5 text-zinc-700 pr-1 flex items-center justify-center">
                <LottieIcon name="brush" size={18} />
              </div>
            </div>

            {/* Menu Pills */}
            <div className="flex flex-col gap-2.5 pt-0.5">
              <button
                onClick={() => alert("Security Protocol: 256-bit AES DICOM encryption enabled. HIPAA & GDPR Compliant.")}
                className="w-full py-2 px-4 rounded-full border border-zinc-400 text-[13.5px] font-medium text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white"
              >
                Security
              </button>
              <button
                onClick={openNewCaseModal}
                className="w-full py-2 px-4 rounded-full border border-zinc-400 text-[13.5px] font-medium text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white"
              >
                Models
              </button>
              <button
                onClick={() => alert("Appearance Settings: System calibrated for high-contrast radiology monitors.")}
                className="w-full py-2 px-4 rounded-full border border-zinc-400 text-[13.5px] font-medium text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white"
              >
                Apperance
              </button>
              <button
                onClick={() => alert("Kitten Medical Diagnostics: Lead Radiologist Profile - Dr. Hassan")}
                className="w-full py-2 px-4 rounded-full border border-zinc-400 text-[13.5px] font-medium text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white"
              >
                Who am i ?
              </button>
            </div>
          </div>

          {/* Bottom Watermark */}
          <div className="pt-6 pb-2 text-center flex flex-col items-center select-none">
            <h1 className="font-['Fredoka'] font-semibold text-[44px] leading-none text-[#8D321F] tracking-normal">
              Kitten
            </h1>
            <span className="font-['Fredoka'] font-semibold text-[22px] text-[#8D321F] tracking-wide mt-1">
              2026
            </span>
          </div>
        </div>
      </div>

      {/* Floating Pointer Arrow from Gear to Card */}
      <div className="absolute -bottom-6 -left-7 pointer-events-none hidden md:block">
        <svg width="40" height="40" viewBox="0 0 50 50" fill="none" className="text-[#1F1F1F]">
          <path
            d="M10 40 Q 25 35 35 15"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M23 12 L 36 14 L 38 27"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </aside>
  );
};
