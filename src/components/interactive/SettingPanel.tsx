import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon } from '../ui/LottieIcon';

export const SettingPanel: React.FC = () => {
  const { setIsLlmSettingsOpen, llmConfig } = useMedicalApp();

  return (
    <aside className="w-[315px] flex-shrink-0 relative flex flex-col select-none h-full z-10">
      {/* Outer Card Container */}
      <div className="bg-white/80 backdrop-blur-3xl rounded-[32px] border-[3px] border-[#8D321F]/80 p-3.5 shadow-sm h-full flex flex-col justify-between relative overflow-hidden">
        {/* Inner Dashed Border Guide */}
        <div className="border border-dashed border-[#B8B5B5] rounded-[24px] p-4 flex flex-col justify-between h-full bg-white/60">
          {/* Top Section */}
          <div className="space-y-3.5">
            {/* Header: Setting + Gear Scaled Up to 36px */}
            <div className="flex items-center gap-3 px-1">
              <h2 className="text-[25px] font-display font-semibold text-[#1F1F1F] tracking-tight">
                Setting
              </h2>
              <div className="w-9 h-9 text-[#1F1F1F] flex items-center justify-center">
                <LottieIcon name="setting" size={36} />
              </div>
            </div>

            {/* Profile Capsule */}
            <div className="border border-dashed border-[#8E8280] rounded-full px-3 py-2 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors group cursor-pointer">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/images/avatar_hassan.png"
                  alt="Dr. Hassan"
                  className="w-10 h-10 rounded-full object-cover border border-[#8D321F]/30"
                />
                <span className="font-semibold text-[18px] text-[#1F1F1F] tracking-tight">
                  Hassan
                </span>
              </div>
              <div className="w-8 h-8 text-zinc-700 pr-1 flex items-center justify-center group-hover:scale-115 transition-transform">
                <LottieIcon name="brush" size={30} />
              </div>
            </div>

            {/* Menu Pills */}
            <div className="flex flex-col gap-2.5 pt-0.5">
              <button
                onClick={() => alert("Security Protocol: 256-bit AES DICOM encryption enabled. HIPAA & GDPR Compliant.")}
                className="w-full py-2.5 px-4 rounded-full border border-zinc-400 text-[14px] font-medium text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white shadow-2xs hover:shadow"
              >
                Security
              </button>

              {/* Models Pill -> Opens LLM Settings Modal */}
              <button
                onClick={() => setIsLlmSettingsOpen(true)}
                className="w-full py-2.5 px-4 rounded-full border border-zinc-400 text-[14px] font-semibold text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white shadow-2xs hover:shadow flex items-center justify-center gap-2 group"
                title="Configure LLM Model Name, API Key, and Model Version"
              >
                <span>Models</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 group-hover:scale-125 transition-transform" />
              </button>

              <button
                onClick={() => alert("Appearance Settings: System calibrated for high-contrast radiology monitors.")}
                className="w-full py-2.5 px-4 rounded-full border border-zinc-400 text-[14px] font-medium text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white shadow-2xs hover:shadow"
              >
                Apperance
              </button>

              <button
                onClick={() => alert("Kitten Medical Diagnostics: Lead Radiologist Profile - Dr. Hassan")}
                className="w-full py-2.5 px-4 rounded-full border border-zinc-400 text-[14px] font-medium text-zinc-800 hover:border-[#8D321F] hover:text-[#8D321F] hover:bg-[#8D321F]/5 transition active:scale-98 bg-white shadow-2xs hover:shadow"
              >
                Who am i ?
              </button>
            </div>
          </div>

          {/* Bottom Watermark with League Spartan */}
          <div className="pt-6 pb-2 text-center flex flex-col items-center select-none">
            <h1 className="font-spartan font-bold text-[48px] leading-none text-[#8D321F] tracking-tight">
              Kitten
            </h1>
            <span className="font-spartan font-bold text-[24px] text-[#8D321F] tracking-tight mt-1">
              2026
            </span>
          </div>
        </div>
      </div>

    </aside>
  );
};
