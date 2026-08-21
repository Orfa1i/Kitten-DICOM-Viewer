import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { SettingPanel } from '../interactive/SettingPanel';
import { LottieIcon } from '../ui/LottieIcon';

export const DashboardView: React.FC = () => {
  const { cases, searchQuery, loadCase } = useMedicalApp();

  const filteredCases = cases.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex gap-8 w-full max-w-[1240px] mx-auto py-6 px-4 items-stretch select-none">
      {/* Left: Setting Card */}
      <SettingPanel />

      {/* Right: Cases Card */}
      <div className="flex-1 bg-[#8D321F] rounded-[32px] p-6 shadow-md flex flex-col justify-between">
        <div>
          {/* Card Header: Cases + File Icon */}
          <div className="flex items-center gap-2.5 mb-4 px-2">
            <h2 className="text-[26px] font-display font-semibold text-white tracking-tight">
              Cases
            </h2>
            <div className="w-6 h-6 filter brightness-0 invert flex items-center justify-center">
              <LottieIcon name="file" size={24} />
            </div>
          </div>

          {/* Inner Table Card */}
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-dashed border-[#B8B5B5]/80 min-h-[460px] flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-12 text-[14px] font-semibold text-zinc-800 pb-3 border-b border-dashed border-[#B8B5B5] px-4">
              <div className="col-span-3 text-left">Case ID</div>
              <div className="col-span-3 text-center">Patient</div>
              <div className="col-span-2 text-center">Age</div>
              <div className="col-span-2 text-center">Sex</div>
              <div className="col-span-2 text-center">Type</div>
            </div>

            {/* Table Body / Rows */}
            <div className="divide-y divide-zinc-100/80 overflow-y-auto max-h-[380px] pt-1 pr-1 custom-scrollbar">
              {filteredCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => loadCase(caseItem.id)}
                  className="grid grid-cols-12 items-center text-[14px] text-zinc-700 py-3.5 px-3 hover:bg-[#8D321F]/5 rounded-xl cursor-pointer transition-all duration-150 group border border-transparent hover:border-[#8D321F]/20 relative"
                >
                  {/* Left Active Indicator Bar */}
                  <div className="col-span-3 flex items-center gap-2.5 font-medium text-zinc-900">
                    <span className="w-1.5 h-6 bg-[#8D321F] rounded-full group-hover:scale-y-110 transition-transform"></span>
                    <span className="font-mono text-[13.5px] font-semibold">{caseItem.id}</span>
                  </div>

                  {/* Patient Name */}
                  <div className="col-span-3 text-center font-medium text-zinc-800">
                    {caseItem.patientName}
                  </div>

                  {/* Age */}
                  <div className="col-span-2 text-center font-medium text-zinc-600">
                    {caseItem.age}
                  </div>

                  {/* Sex */}
                  <div className="col-span-2 text-center font-medium capitalize text-zinc-600">
                    {caseItem.sex}
                  </div>

                  {/* Type Pill */}
                  <div className="col-span-2 flex justify-center">
                    <div className="border border-zinc-300 rounded-xl px-2.5 py-1 text-center bg-zinc-50 group-hover:bg-white group-hover:border-[#8D321F]/40 transition shadow-2xs">
                      <span className="text-[11px] font-medium leading-tight text-zinc-700 block">
                        {caseItem.type.split(' ').map((word, i) => (
                          <span key={i} className="block">{word}</span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCases.length === 0 && (
                <div className="py-12 text-center text-zinc-400 font-medium">
                  No cases found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
