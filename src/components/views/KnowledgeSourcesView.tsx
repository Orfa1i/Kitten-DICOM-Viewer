import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { SettingPanel } from '../interactive/SettingPanel';
import { BookOpen, Plus, Trash2, Save, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface KnowledgeSource {
  id: string;
  title: string;
  sourceUrl: string;
  type: string;
  version: string;
  effectiveDate: string;
  content: string;
  isActive: boolean;
  testStatus?: 'untested' | 'testing' | 'success' | 'error';
  testResultMessage?: string;
}

export const KnowledgeSourcesView: React.FC = () => {
  const { setCurrentScreen } = useMedicalApp();
  
  const [sources, setSources] = useState<KnowledgeSource[]>([
    {
      id: '1',
      title: 'RxNorm',
      sourceUrl: 'https://rxnav.nlm.nih.gov/REST/',
      type: 'Live API (Normalization)',
      version: 'Latest',
      effectiveDate: 'Current',
      content: 'Exact name match, approximate match (spelling variants), and RxCUI → ingredient/brand resolution. Used synchronously for drug-name normalization before clinical retrieval.',
      isActive: true,
      testStatus: 'untested'
    },
    {
      id: '2',
      title: 'DailyMed',
      sourceUrl: 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=acetaminophen',
      type: 'RAG Database',
      version: 'v2',
      effectiveDate: 'Current',
      content: 'Official prescribing information (SPL/XML). Parsed into labeled sections (Indications, Dosage, Contraindications, Warnings, Adverse Reactions). Used for label indications and warnings.',
      isActive: true,
      testStatus: 'untested'
    },
    {
      id: '3',
      title: 'openFDA',
      sourceUrl: 'https://api.fda.gov/drug/event.json',
      type: 'Hybrid (Live API + RAG)',
      version: 'v1',
      effectiveDate: 'Current',
      content: 'Live API call for real-time safety/recall checks; periodic RAG snapshot for FAERS trend analysis. Treated as a safety overlay.',
      isActive: true,
      testStatus: 'untested'
    },
    {
      id: '4',
      title: 'PubMed (PMC Open Access Subset)',
      sourceUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=osteoarthritis&retmode=json',
      type: 'RAG Database',
      version: 'E-utilities',
      effectiveDate: 'Current',
      content: 'Abstracts for all records; full text only for PMC Open Access subset. Chunked by section (Abstract, Methods, Results, Discussion). Used for evidence-based justification.',
      isActive: true,
      testStatus: 'untested'
    }
  ]);

  const addSource = () => {
    const newSource: KnowledgeSource = {
      id: Date.now().toString(),
      title: '',
      sourceUrl: '',
      type: 'Guideline',
      version: '',
      effectiveDate: '',
      content: '',
      isActive: false,
      testStatus: 'untested'
    };
    setSources([...sources, newSource]);
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const updateSource = (id: string, field: keyof KnowledgeSource, value: any) => {
    setSources(sources.map(s => s.id === id ? { ...s, [field]: value, testStatus: field !== 'isActive' ? 'untested' : s.testStatus } : s));
  };

  const testSource = async (id: string) => {
    const source = sources.find(s => s.id === id);
    if (!source || !source.sourceUrl) {
      updateSource(id, 'testStatus', 'error');
      updateSource(id, 'testResultMessage', 'Invalid URL');
      return;
    }
    
    updateSource(id, 'testStatus', 'testing');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/test-source?url=${encodeURIComponent(source.sourceUrl)}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.status_code < 400) {
        updateSource(id, 'testStatus', 'success');
        updateSource(id, 'testResultMessage', `Status ${data.status_code} (${data.content_type})
Sample: ${data.sample.substring(0, 200)}...`);
      } else {
        updateSource(id, 'testStatus', 'error');
        updateSource(id, 'testResultMessage', data.message || `Status ${data.status_code}`);
      }
    } catch (err: any) {
      updateSource(id, 'testStatus', 'error');
      updateSource(id, 'testResultMessage', err.message);
    }
  };

  const saveAll = () => {
    // In a real app, this would push to backend
    alert("Knowledge sources saved successfully.");
    setCurrentScreen('dashboard');
  };

  return (
    <div className="flex-1 flex gap-6 w-full max-w-[1440px] mx-auto h-full items-stretch select-none overflow-hidden py-0 px-2 md:px-4">
      {/* Left: Setting Card */}
      <SettingPanel />

      {/* Right Content */}
      <div className="flex-1 bg-[#8D321F] rounded-[32px] p-2 flex flex-col h-full overflow-hidden relative shadow-lg border border-[#a25446]/20">
        <div className="flex items-center justify-between px-6 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[28px] font-bold text-white tracking-tight">Knowledge Sources</h2>
            <BookOpen className="w-[26px] h-[26px] text-white/90" strokeWidth={2} />
          </div>
          <button onClick={addSource} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
        
        <div className="bg-[#fcfcfc] rounded-[24px] flex-1 flex flex-col overflow-y-auto relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] p-6 md:p-8">
          <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
            
            {sources.length === 0 ? (
              <div className="text-center text-zinc-400 py-12 flex flex-col items-center gap-3">
                <BookOpen className="w-12 h-12 opacity-20" />
                <p>No knowledge sources configured.</p>
              </div>
            ) : (
              sources.map((source, index) => (
                <div key={source.id} className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <h3 className="text-[16px] font-bold text-zinc-800 flex items-center gap-2">
                      <span className="bg-zinc-100 text-zinc-500 w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                      Source Entry
                    </h3>
                    <button onClick={() => removeSource(source.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Remove Entry">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-zinc-700 mb-1">Title</label>
                      <input type="text" value={source.title} onChange={(e) => updateSource(source.id, 'title', e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#8D321F]/50 transition-all bg-zinc-50 focus:bg-white" placeholder="e.g. Protocol Guidelines" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-zinc-700 mb-1">Source URL</label>
                      <input type="text" value={source.sourceUrl} onChange={(e) => updateSource(source.id, 'sourceUrl', e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#8D321F]/50 transition-all bg-zinc-50 focus:bg-white" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-zinc-700 mb-1">Type</label>
                      <select value={source.type} onChange={(e) => updateSource(source.id, 'type', e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#8D321F]/50 transition-all bg-zinc-50 focus:bg-white">
                        <option value="Guideline">Guideline</option>
                        <option value="Research Paper">Research Paper</option>
                        <option value="Policy Document">Policy Document</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1">Version</label>
                        <input type="text" value={source.version} onChange={(e) => updateSource(source.id, 'version', e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#8D321F]/50 transition-all bg-zinc-50 focus:bg-white" placeholder="1.0" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-zinc-700 mb-1">Effective Date</label>
                        <input type="date" value={source.effectiveDate} onChange={(e) => updateSource(source.id, 'effectiveDate', e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#8D321F]/50 transition-all bg-zinc-50 focus:bg-white" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-semibold text-zinc-700 mb-1">Content (Raw / Summary)</label>
                      <textarea value={source.content} onChange={(e) => updateSource(source.id, 'content', e.target.value)} className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#8D321F]/50 transition-all bg-zinc-50 focus:bg-white min-h-[80px] resize-y" placeholder="Paste relevant excerpts or parameters here..." />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-2">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only" checked={source.isActive} onChange={(e) => updateSource(source.id, 'isActive', e.target.checked)} />
                        <div className={`w-10 h-5 rounded-full transition-colors ${source.isActive ? 'bg-emerald-500' : 'bg-zinc-200'}`}></div>
                        <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${source.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                      <span className="text-[14px] font-semibold text-zinc-700">Activate Source</span>
                    </label>
                    
                    <div className="flex items-center gap-3">
                      {source.testStatus === 'success' && <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Verified</span>}
                      {source.testStatus === 'error' && <span className="flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="w-3 h-3" /> Error</span>}
                      {source.testStatus === 'testing' && <span className="flex items-center gap-1 text-xs font-medium text-blue-600 animate-pulse">Testing...</span>}
                      
                      <button onClick={() => testSource(source.id)} disabled={source.testStatus === 'testing'} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors active:scale-95">
                        <Play className="w-3.5 h-3.5" />
                        {source.testStatus === 'testing' ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Results panel below the buttons */}
                  {source.testResultMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-xs font-mono break-all whitespace-pre-wrap overflow-hidden max-h-[120px] overflow-y-auto ${source.testStatus === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                      {source.testResultMessage}
                    </div>
                  )}
                  </div>
              ))
            )}
            
            <div className="flex justify-end pt-4 pb-12">
              <button onClick={saveAll} className="bg-[#8D321F] hover:brightness-110 active:scale-95 text-white px-8 py-3 rounded-xl font-bold text-[15px] flex items-center gap-2 transition-all shadow-[0_6px_20px_rgba(141,50,31,0.25)]">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
