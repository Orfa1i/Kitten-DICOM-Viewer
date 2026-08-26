import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { SettingPanel } from '../interactive/SettingPanel';
import { LottieIcon } from '../ui/LottieIcon';
import { Plus, FolderSearch } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { cases, searchQuery, loadCase, openNewCaseModal } = useMedicalApp();

  const filteredCases = cases.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex gap-8 w-full max-w-[1360px] mx-auto h-full items-stretch select-none overflow-hidden">
      {/* Left: Setting Card */}
      <SettingPanel />

      {/* Right: Cases Card */}
      <div className="flex-1 bg-[#8D321F]/90 backdrop-blur-3xl border border-[#8D321F]/20 rounded-[32px] p-6 shadow-md flex flex-col justify-between h-full overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Card Header: Cases + File Icon Scaled Up to 40px */}
          <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <h2 className="text-[28px] font-display font-semibold text-white tracking-tight">
                Cases
              </h2>
              <div className="w-10 h-10 filter brightness-0 invert flex items-center justify-center">
                <LottieIcon name="file" size={40} />
              </div>
            </div>

            <button
              onClick={openNewCaseModal}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold transition active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Case</span>
            </button>
          </div>

          {/* Inner Table Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[24px] p-5 shadow-sm border border-dashed border-[#B8B5B5]/80 flex-1 flex flex-col overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 text-[14.5px] font-semibold text-zinc-800 pb-3 border-b border-dashed border-[#B8B5B5] px-4 flex-shrink-0">
              <div className="col-span-3 text-left">Case ID</div>
              <div className="col-span-3 text-center">Patient</div>
              <div className="col-span-2 text-center">Age</div>
              <div className="col-span-2 text-center">Sex</div>
              <div className="col-span-2 text-center">Type</div>
            </div>

            {/* Table Body / Rows */}
            <div className="divide-y divide-zinc-100/80 overflow-y-auto flex-1 pt-1 pr-1 custom-scrollbar">
              {filteredCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => loadCase(caseItem.id)}
                  className="grid grid-cols-12 items-center text-[14.5px] text-zinc-700 py-4 px-3 hover:bg-[#8D321F]/5 rounded-xl cursor-pointer transition-all duration-150 group border border-transparent hover:border-[#8D321F]/20 relative"
                >
                  {/* Left Active Indicator Bar */}
                  <div className="col-span-3 flex items-center gap-2.5 font-medium text-zinc-900">
                    <span className="w-1.5 h-6 bg-[#8D321F] rounded-full group-hover:scale-y-110 transition-transform"></span>
                    <span className="font-mono text-[14px] font-semibold">{caseItem.id}</span>
                  </div>

                  {/* Patient Name */}
                  <div className="col-span-3 text-center font-medium text-zinc-800">
                    {caseItem.patientName || 'Anonymous'}
                  </div>

                  {/* Age */}
                  <div className="col-span-2 text-center font-medium text-zinc-600">
                    {caseItem.age || '—'}
                  </div>

                  {/* Sex */}
                  <div className="col-span-2 text-center font-medium capitalize text-zinc-600">
                    {caseItem.sex || '—'}
                  </div>

                  {/* Type Pill */}
                  <div className="col-span-2 flex justify-center">
                    <div className="border border-zinc-300 rounded-xl px-3 py-1.5 text-center bg-zinc-50 group-hover:bg-white group-hover:border-[#8D321F]/40 transition shadow-2xs">
                      <span className="text-[11.5px] font-medium leading-tight text-zinc-700 block">
                        {caseItem.type.split(' ').map((word, i) => (
                          <span key={i} className="block">{word}</span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clean Empty State when zero cases */}
              {filteredCases.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 text-zinc-500">
                  <div className="w-16 h-16 rounded-full bg-[#8D321F]/10 border border-[#8D321F]/20 flex items-center justify-center text-[#8D321F]">
                    <FolderSearch className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-base font-semibold text-zinc-800">
                      {searchQuery ? `No cases matching "${searchQuery}"` : 'No Diagnostic Cases Recorded'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {searchQuery 
                        ? 'Try searching with a different patient name or case ID.'
                        : 'Start a new clinical radiograph evaluation using the button below.'}
                    </p>
                  </div>
                  {!searchQuery && (
                    <button
                      onClick={openNewCaseModal}
                      className="bg-[#8D321F] hover:bg-[#7D2A18] text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition active:scale-95 shadow-sm hover:shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First Case</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
