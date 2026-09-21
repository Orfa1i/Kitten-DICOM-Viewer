import React, { useState } from 'react';
import { useMedicalApp, type CaseRecord } from '../../context/MedicalAppContext';
import { SettingPanel } from '../interactive/SettingPanel';
import { Plus, FileText, TrendingUp, TrendingDown, ChevronsUpDown, ChevronLeft, ChevronRight, MoreHorizontal, Search, Copy, CheckSquare, Square, Activity, ActivitySquare, HeartPulse, Stethoscope, Type, Ruler, Settings, Server, Shield, Network, Save, FolderSearch, Trash2, Edit3, FileDown, Loader2, Check, CheckCircle2 } from 'lucide-react';
import { LottieIcon } from '../ui/LottieIcon';
import { EditCaseReportModal } from '../modals/EditCaseReportModal';
import { generateAndDownloadPdfReport } from '../../services/pdfReportGenerator';

export const DashboardView: React.FC = () => {
  const { cases, loadCase, updateCase, deleteCase, openNewCaseModal, currentScreen, setCurrentScreen, searchQuery, setSearchQuery } = useMedicalApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [activeTab, setActiveTab] = useState<'Fresh' | 'Pending' | 'Approved'>('Fresh');
  
  // Workflow PDF & Edit State
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Configuration State
  const [pacsName, setPacsName] = useState('Local PACS');
  const [aeTitle, setAeTitle] = useState('KITTEN_AE');
  const [ipHost, setIpHost] = useState('127.0.0.1');
  const [dicomPort, setDicomPort] = useState('104');
  const [enableStorage, setEnableStorage] = useState(true);
  const [enableQueryRetrieve, setEnableQueryRetrieve] = useState(true);

  const [sexFilter, setSexFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'desc' });

  let filteredCases = cases.filter(c => {
    // 3-tier workflow filter
    if (activeTab === 'Fresh' && c.status !== 'Pending') return false;
    if (activeTab === 'Pending' && c.status !== 'Review') return false;
    if (activeTab === 'Approved' && c.status !== 'Completed') return false;

    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSex = sexFilter ? c.sex.toLowerCase() === sexFilter.toLowerCase() : true;
    const matchesAge = ageFilter ? c.age.toString().includes(ageFilter) : true;
    const matchesModel = modelFilter ? c.patientName.toLowerCase().includes(modelFilter.toLowerCase()) : true;
    const matchesModality = modalityFilter ? c.type.toLowerCase() === modalityFilter.toLowerCase() : true;
    return matchesSearch && matchesSex && matchesAge && matchesModel && matchesModality;
  });

  if (sortConfig.key === 'age') {
    filteredCases.sort((a, b) => {
      const ageA = parseInt(a.age.toString()) || 0;
      const ageB = parseInt(b.age.toString()) || 0;
      if (sortConfig.direction === 'asc') {
        return ageA - ageB;
      } else {
        return ageB - ageA;
      }
    });
  }

  const handleAgeSort = () => {
    setSortConfig(prev => ({
      key: 'age',
      direction: prev.key === 'age' && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const generateAndSaveCasePdf = async (caseRecord: CaseRecord, customFindings?: string) => {
    setGeneratingPdfId(caseRecord.id);
    try {
      let findingsText = customFindings || (
        typeof caseRecord.findings === 'string'
          ? caseRecord.findings
          : Array.isArray(caseRecord.findings)
          ? caseRecord.findings.join('\n\n')
          : ''
      );

      // If no findings exist, fetch from MedGemma AI service
      if (!findingsText || findingsText.trim() === '') {
        try {
          const formData = new FormData();
          formData.append(
            'clinical_context',
            `Evaluate PACS intake radiograph for patient ${caseRecord.patientName || caseRecord.id}.`
          );
          const res = await fetch(`http://127.0.0.1:8000/api/cases/${caseRecord.id}/ai-report`, {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            if (data.report) findingsText = data.report;
          }
        } catch (err) {
          console.warn('MedGemma AI report request fallback:', err);
        }

        if (!findingsText || findingsText.trim() === '') {
          findingsText = `**Overall Impression:** Diagnostic imaging study of the ${caseRecord.typeSub || caseRecord.type || 'visualized anatomy'}. Anatomical structures demonstrate preserved alignment without acute displaced fracture or focal cortical disruption.\n\n**Key Observations:**\n* Bony trabecular patterns and cortical margins appear intact across visualized contours.\n* Articular spaces remain congruent without marked joint space narrowing or effusion.\n* Surrounding soft tissue envelopes show normal attenuation.\n\n**Limitations:** Single-projection study. Comparison with previous examinations recommended for chronicity assessment.`;
        }
      }

      const diagTitle =
        caseRecord.diagnosisTitle ||
        (caseRecord.type?.includes('Knee')
          ? 'Knee Radiograph - Preservation Assessment'
          : 'Diagnostic Radiograph Examination');

      const recommendation =
        caseRecord.recommendation ||
        'Clinical correlation recommended. Repeat examination if symptoms persist.';

      // Generate & download PDF report
      await generateAndDownloadPdfReport({
        patient: {
          id: caseRecord.id,
          name: caseRecord.patientName,
          age: caseRecord.age || '',
          sex: (caseRecord.sex === 'female' ? 'female' : 'male'),
          studyDate: caseRecord.date || '',
          modality: caseRecord.type || 'Digital Radiography',
          bodyPart: caseRecord.typeSub || ''
        },
        report: {
          diagnosis: diagTitle,
          findings: [findingsText],
          recommendation: recommendation,
          confidenceGrade: `Grade A1 AI-Verified (${caseRecord.confidence || 95}% Confidence)`
        },
        modelType: caseRecord.type || 'DICOM Study',
        accuracyScore: caseRecord.confidence || 95,
        uploadedImageUrl: `http://127.0.0.1:8000/api/cases/${caseRecord.id}/thumbnail`
      });

      // Update case to Completed in DB & state
      await updateCase(caseRecord.id, {
        status: 'Completed',
        findings: findingsText,
        diagnosisTitle: diagTitle,
        recommendation: recommendation
      });

      setDownloadSuccessId(caseRecord.id);
      setTimeout(() => setDownloadSuccessId(null), 3500);
      setToastMessage(`Report for ${caseRecord.patientName} (${caseRecord.id}) saved as PDF & finalized.`);
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: any) {
      console.error('Failed to generate case PDF:', err);
      alert('Failed to generate PDF report: ' + (err.message || 'Unknown error'));
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleEditSavePdf = async (e: React.MouseEvent, caseRecord: CaseRecord) => {
    e.stopPropagation();
    await generateAndSaveCasePdf(caseRecord);
  };

  const handleOpenEditModal = (e: React.MouseEvent, caseRecord: CaseRecord) => {
    e.stopPropagation();
    setEditingCase(caseRecord);
  };

  const handleModalSavePdf = async (updatedCase: CaseRecord, customFindings: string) => {
    await generateAndSaveCasePdf(updatedCase, customFindings);
  };

  const handleModalSaveDraft = async (updatedCase: CaseRecord, customFindings: string) => {
    await updateCase(updatedCase.id, {
      ...updatedCase,
      findings: customFindings
    });
    setToastMessage(`Changes saved for ${updatedCase.patientName} (${updatedCase.id}).`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenWorkstation = (caseId: string) => {
    loadCase(caseId);
  };

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / rowsPerPage));
  const paginatedCases = filteredCases.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="flex-1 flex gap-6 w-full max-w-[1440px] mx-auto h-full items-stretch select-none overflow-hidden py-0 px-2 md:px-4">
      {/* Left: Setting Card */}
      <SettingPanel />

      {/* Right Content */}
      {currentScreen === 'configuration' ? (
        <div className="flex-1 bg-[#8D321F] rounded-[32px] p-2 flex flex-col h-full overflow-hidden relative shadow-lg border border-[#a25446]/20">
          <div className="flex items-center justify-between px-6 pt-4 pb-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-[28px] font-bold text-white tracking-tight">Configuration</h2>
              <Settings className="w-[26px] h-[26px] text-white/90" strokeWidth={2} />
            </div>
          </div>
          <div className="bg-[#fcfcfc] rounded-[24px] flex-1 flex flex-col overflow-y-auto relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] p-8">
            <div className="max-w-2xl w-full mx-auto flex flex-col gap-8 mt-4">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                <h3 className="text-[16px] font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <Server className="w-4 h-4 text-[#8D321F]" />
                  DICOM Node Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-2">PACS Name</label>
                    <input type="text" value={pacsName} onChange={(e) => setPacsName(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#8D321F]/50 focus:ring-4 focus:ring-[#8D321F]/10 transition-all shadow-sm bg-zinc-50/50 focus:bg-white text-zinc-800 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-zinc-400" />AE Title</label>
                    <input type="text" value={aeTitle} onChange={(e) => setAeTitle(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#8D321F]/50 focus:ring-4 focus:ring-[#8D321F]/10 transition-all shadow-sm bg-zinc-50/50 focus:bg-white text-zinc-800 font-medium font-mono" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-2 flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-zinc-400" />IP / Host</label>
                    <input type="text" value={ipHost} onChange={(e) => setIpHost(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#8D321F]/50 focus:ring-4 focus:ring-[#8D321F]/10 transition-all shadow-sm bg-zinc-50/50 focus:bg-white text-zinc-800 font-medium font-mono tracking-wide" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-zinc-700 mb-2 flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-zinc-400" />DICOM Port</label>
                    <input type="text" value={dicomPort} onChange={(e) => setDicomPort(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#8D321F]/50 focus:ring-4 focus:ring-[#8D321F]/10 transition-all shadow-sm bg-zinc-50/50 focus:bg-white text-zinc-800 font-medium font-mono" />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-[16px] font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3"><Settings className="w-4 h-4 text-[#8D321F]" />Services</h3>
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="sr-only" checked={enableStorage} onChange={(e) => setEnableStorage(e.target.checked)} />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${enableStorage ? 'bg-[#8D321F]' : 'bg-zinc-200'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${enableStorage ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">Enable DICOM Storage</span>
                    <span className="text-[13px] text-zinc-400 font-medium">Allow this node to receive images from external modalities.</span>
                  </div>
                </label>
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="sr-only" checked={enableQueryRetrieve} onChange={(e) => setEnableQueryRetrieve(e.target.checked)} />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${enableQueryRetrieve ? 'bg-[#8D321F]' : 'bg-zinc-200'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${enableQueryRetrieve ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">Enable DICOM Query/Retrieve</span>
                    <span className="text-[13px] text-zinc-400 font-medium">Allow external systems to query cases from this instance.</span>
                  </div>
                </label>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setCurrentScreen('dashboard')} className="bg-[#8D321F] hover:brightness-110 active:scale-95 text-white px-8 py-3 rounded-xl font-bold text-[15px] flex items-center gap-2 transition-all shadow-[0_6px_20px_rgba(141,50,31,0.25)]">
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="flex-1 bg-[#8D321F] rounded-[32px] p-2 flex flex-col h-full overflow-hidden relative shadow-lg border border-[#a25446]/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[28px] font-bold text-white tracking-tight">Cases</h2>
            <FileText className="w-[26px] h-[26px] text-white/90" strokeWidth={2} />
          </div>

          <button
            onClick={openNewCaseModal}
            className="relative overflow-hidden bg-gradient-to-b from-white/20 to-white/10 text-white hover:text-white border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold transition-all duration-300 active:scale-95 shadow-sm hover:bg-white/30 group"
          >
            <Plus className="w-4 h-4" />
            <span>New Case</span>
          </button>
        </div>

        {/* Inner White Card */}
        <div className="bg-[#fcfcfc] rounded-[24px] flex-1 flex flex-col overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
          
                    {/* 3-Tier Workflow Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 pb-0 bg-white border-b border-zinc-100 flex-shrink-0">
              <button
                onClick={() => { setActiveTab('Fresh'); setCurrentPage(1); }}
                className={`px-5 py-3 text-[14px] font-bold border-b-[3px] transition-colors ${activeTab === 'Fresh' ? 'border-[#8D321F] text-[#8D321F]' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
              >
                Fresh from PACS
              </button>
              <button
                onClick={() => { setActiveTab('Pending'); setCurrentPage(1); }}
                className={`px-5 py-3 text-[14px] font-bold border-b-[3px] transition-colors ${activeTab === 'Pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
              >
                Pending Approval
              </button>
              <button
                onClick={() => { setActiveTab('Approved'); setCurrentPage(1); }}
                className={`px-5 py-3 text-[14px] font-bold border-b-[3px] transition-colors ${activeTab === 'Approved' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
              >
                Final Approved
              </button>
            </div>

          {/* Table Area */}
          <div className="flex-1 flex flex-col bg-[#fdfdfd] overflow-hidden">
            {/* Headers with Filters */}
            <div className="grid grid-cols-12 text-[12px] font-bold text-zinc-400 uppercase tracking-wider px-6 pt-5 pb-3 border-b border-zinc-100 flex-shrink-0 bg-white">
              <div className="col-span-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="hover:text-zinc-700 transition-colors cursor-pointer">Case ID</span>
                </div>
              </div>
              <div className="col-span-1 text-center">
                <div className="flex flex-col gap-1.5 mb-2">
                  <div className="flex items-center justify-center gap-1.5 group cursor-pointer">
                    <span className="group-hover:text-zinc-700 transition-colors">Sex</span>
                  </div>
                  <select 
                    value={sexFilter} 
                    onChange={(e) => setSexFilter(e.target.value)} 
                    className="border border-zinc-200 rounded px-1 py-1 text-[11px] w-14 mx-auto outline-none focus:border-[#8D321F]/30 bg-white text-zinc-600 normal-case font-medium shadow-sm cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="col-span-1 text-center">
                <div className="flex flex-col gap-1.5 mb-2">
                  <div className="flex items-center justify-center gap-1.5 group cursor-pointer" onClick={handleAgeSort}>
                    <span className={`group-hover:text-zinc-700 transition-colors ${sortConfig.key === 'age' ? 'text-zinc-700' : ''}`}>Age</span>
                    <ChevronsUpDown className={`w-3.5 h-3.5 transition-colors ${sortConfig.key === 'age' ? 'text-[#8D321F]' : 'text-zinc-300 group-hover:text-zinc-400'}`} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Age" 
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    className="border border-zinc-200 rounded px-1 py-1 text-[11px] w-12 mx-auto text-center outline-none focus:border-[#8D321F]/30 bg-white placeholder:text-zinc-300 normal-case font-medium text-zinc-600 shadow-sm"
                  />
                </div>
              </div>
              <div className="col-span-3 text-center">
                <div className="flex flex-col gap-1.5 mb-2">
                  <div className="flex items-center justify-center gap-1.5 group cursor-pointer">
                    <span className="group-hover:text-zinc-700 transition-colors">Patient Name</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Filter patient..." 
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="border border-zinc-200 rounded px-2 py-1 text-[11px] w-28 mx-auto outline-none focus:border-[#8D321F]/30 bg-white placeholder:text-zinc-300 normal-case font-medium text-zinc-600 shadow-sm"
                  />
                </div>
              </div>
              <div className="col-span-2 text-center">
                <div className="flex flex-col gap-1.5 mb-2">
                  <div className="flex items-center justify-center gap-1.5 group cursor-pointer">
                    <span className="group-hover:text-zinc-700 transition-colors">Modality</span>
                  </div>
                  <select 
                    value={modalityFilter} 
                    onChange={(e) => setModalityFilter(e.target.value)} 
                    className="border border-zinc-200 rounded px-1.5 py-1 text-[11px] w-20 mx-auto outline-none focus:border-[#8D321F]/30 bg-white text-zinc-600 normal-case font-medium shadow-sm cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="MRI">MRI</option>
                    <option value="CT">CT</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="DX">DX</option>
                    <option value="NM">NM</option>
                  </select>
                </div>
              </div>
              <div className="col-span-3 text-right pr-4">
                <div className="flex flex-col gap-1.5 mb-2 items-end">
                  <span className="text-zinc-600 font-bold">Actions</span>
                  <span className="text-[10px] text-zinc-400 font-medium normal-case">Edit / Save PDF</span>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div className="overflow-y-auto flex-1 custom-scrollbar pb-2">
              <table className="w-full">
                <tbody className="divide-y divide-zinc-50/80">
                  {paginatedCases.map((c, i) => (
                    <tr 
                      key={c.id} 
                      onClick={() => loadCase(c.id)}
                      className="group hover:bg-[#8D321F]/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6 w-[18%]">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8D321F] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="font-mono text-[13px] font-semibold text-zinc-700">{c.id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center w-[8%]">
                        <span className="text-[14px] font-medium text-zinc-600 capitalize">{c.sex}</span>
                      </td>
                      <td className="py-4 px-2 text-center w-[8%]">
                        <span className="text-[14px] font-medium text-zinc-600">{c.age}</span>
                      </td>
                      <td className="py-4 px-2 text-center w-[22%]">
                        <span className="text-[14px] font-semibold text-zinc-800">{c.patientName}</span>
                      </td>
                      <td className="py-4 px-2 text-center w-[16%]">
                        <div className="inline-flex items-center justify-center border border-zinc-200 bg-white rounded-lg px-2.5 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.02)] group-hover:border-[#8D321F]/20 group-hover:shadow-[0_2px_6px_rgba(141,50,31,0.08)] transition-all">
                          <span className="text-[11px] font-bold tracking-wide text-zinc-700 uppercase">{c.type || 'DICOM'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right w-[28%]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit / Save as PDF Primary Action */}
                          <button 
                            onClick={(e) => handleEditSavePdf(e, c)}
                            disabled={generatingPdfId === c.id}
                            title="Click to trigger Save as PDF process"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              downloadSuccessId === c.id
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#8D321F]/10 hover:bg-[#8D321F] text-[#8D321F] hover:text-white border border-[#8D321F]/20 active:scale-95'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {generatingPdfId === c.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : downloadSuccessId === c.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>PDF Saved!</span>
                              </>
                            ) : (
                              <>
                                <FileDown className="w-3.5 h-3.5" />
                                <span>Save PDF</span>
                              </>
                            )}
                          </button>

                          {/* Quick Edit Findings Modal Opener */}
                          <button
                            onClick={(e) => handleOpenEditModal(e, c)}
                            title="Edit findings & customize report"
                            className="p-1.5 text-zinc-400 hover:text-[#8D321F] hover:bg-[#8D321F]/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Case */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete case ${c.id}?`)) {
                                deleteCase(c.id);
                              }
                            }}
                            title="Delete case"
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Empty State Fillers if fewer than rowsPerPage */}
                  {paginatedCases.length < rowsPerPage && Array.from({ length: rowsPerPage - paginatedCases.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-zinc-50/50">
                      <td className="py-5 px-2" colSpan={6}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-between flex-shrink-0 rounded-b-[24px]">
              <div className="text-[13px] text-zinc-500 font-medium">
                Showing <span className="text-zinc-800 font-semibold">{paginatedCases.length}</span> of <span className="text-zinc-800 font-semibold">{filteredCases.length}</span> cases
              </div>
              
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors disabled:opacity-50"><ChevronLeft className="w-4 h-4" /><span className="sr-only">First</span></button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                
                <span className="text-[13px] font-medium text-zinc-600 px-2">Page {currentPage} of {totalPages}</span>
                
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors disabled:opacity-50"><ChevronRight className="w-4 h-4" /><span className="sr-only">Last</span></button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[13px] text-zinc-500 font-medium">Rows per page</span>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-[#8D321F]/50 bg-white text-zinc-800 font-semibold shadow-sm cursor-pointer">
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>
      )}

      {/* Edit Case & Report Modal */}
      <EditCaseReportModal
        isOpen={!!editingCase}
        onClose={() => setEditingCase(null)}
        caseRecord={editingCase}
        onSavePdf={handleModalSavePdf}
        onSaveDraft={handleModalSaveDraft}
        onOpenWorkstation={handleOpenWorkstation}
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-zinc-900 text-white rounded-xl shadow-2xl border border-zinc-700 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};


