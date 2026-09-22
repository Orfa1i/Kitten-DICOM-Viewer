import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { X, Search, FileText, RefreshCw } from 'lucide-react';

export const WorklistModal: React.FC = () => {
  const { isWorklistOpen, setIsWorklistOpen, cases, loadCase, setCurrentScreen, fetchCases } = useMedicalApp();
  const [localSearch, setLocalSearch] = React.useState('');
  const [isSyncing, setIsSyncing] = React.useState(false);

    const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("http://127.0.0.1:8000/api/pacs/sync", { method: "POST" });
      await fetchCases();
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  if (!isWorklistOpen) return null;

  const filteredCases = cases.filter(c => 
    c.id.toLowerCase().includes(localSearch.toLowerCase()) ||
    c.patientName.toLowerCase().includes(localSearch.toLowerCase()) ||
    c.type.toLowerCase().includes(localSearch.toLowerCase())
  );

  const handleOpenCase = (caseId: string) => {
    loadCase(caseId);
    setIsWorklistOpen(false);
    setCurrentScreen('iframe-viewer'); // Direct them to the DICOM viewer studio
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsWorklistOpen(false)}
      />

      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col p-6 shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[32px] border border-white/50">
        <button 
          onClick={() => setIsWorklistOpen(false)}
          className="absolute top-6 right-6 text-zinc-500 hover:text-[#8D321F] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#8D321F] font-display flex items-center gap-2">
            <FileText className="w-6 h-6" />
            DICOM Worklist
          </h2>
          <p className="text-zinc-600 text-sm mt-1">
            Displaying {cases.length} cases retrieved from local PACS/DICOM directory.
          </p>
        </div>

        {/* Search Bar & Sync Action */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-[#8D321F] transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-white/70 border-2 border-zinc-200 text-zinc-800 rounded-full pl-11 pr-4 py-3 focus:outline-none focus:border-[#8D321F]/50 focus:bg-white transition-all shadow-sm font-medium"
              placeholder="Search by Patient Name, ID, or Modality..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-[#8D321F] hover:bg-[#a03823] active:scale-95 transition-all text-white px-5 py-3.5 rounded-full font-bold shadow-md disabled:opacity-70 disabled:cursor-not-allowed group whitespace-nowrap"
            title="Sync from PACS"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>Sync from PACS</span>
          </button>
        </div>

        {/* Worklist Table */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white/80 rounded-[24px] border border-dashed border-[#B8B5B5] shadow-inner p-2">
          {/* Header */}
          <div className="grid grid-cols-12 text-[14px] font-bold text-zinc-800 pb-3 border-b border-dashed border-[#B8B5B5] px-4 pt-3 flex-shrink-0">
            <div className="col-span-3 text-left">Patient Name</div>
            <div className="col-span-2 text-center">Case ID</div>
            <div className="col-span-2 text-center">Modality</div>
            <div className="col-span-2 text-center">Study Date</div>
            <div className="col-span-1 text-center">Age/Sex</div>
            <div className="col-span-2 text-center">Action</div>
          </div>

          {/* Rows */}
          <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
            {filteredCases.map((c, idx) => (
              <div 
                key={c.id + idx} 
                className="grid grid-cols-12 items-center bg-white/60 hover:bg-white rounded-xl p-3 border border-zinc-100 hover:border-zinc-300 transition-all shadow-sm group"
              >
                <div className="col-span-3 font-semibold text-zinc-800 truncate px-2" title={c.patientName}>
                  {c.patientName}
                </div>
                <div className="col-span-2 text-center text-xs text-zinc-500 font-mono truncate px-1" title={c.id}>
                  {c.id}
                </div>
                <div className="col-span-2 text-center">
                  <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md text-xs font-bold border border-zinc-200">
                    {c.type}
                  </span>
                </div>
                <div className="col-span-2 text-center text-sm text-zinc-600 font-medium">
                  {c.date || 'Unknown'}
                </div>
                <div className="col-span-1 text-center text-sm text-zinc-600">
                  {c.age}{c.sex === 'male' ? 'M' : 'F'}
                </div>
                <div className="col-span-2 flex justify-center">
                  {/* Blue Jelly Button for "Open Viewer" */}
                  <button 
                    onClick={() => handleOpenCase(c.id)}
                    className="relative overflow-hidden bg-gradient-to-b from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1.5px_1px_rgba(255,255,255,0.4)] hover:brightness-110 flex items-center justify-center gap-1 w-full max-w-[100px]"
                  >
                    <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-full" />
                    <span className="relative z-10 drop-shadow-sm">Open</span>
                  </button>
                </div>
              </div>
            ))}
            
            {filteredCases.length === 0 && (
              <div className="w-full h-32 flex items-center justify-center text-zinc-500 italic text-sm">
                No matching DICOM studies found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

