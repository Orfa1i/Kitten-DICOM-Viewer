import React, { useState, useRef, useEffect } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { Server, UploadCloud, Database, Activity, File, X, CheckCircle2, ChevronLeft, Trash2, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MockPacsView: React.FC = () => {
  const { setCurrentScreen, fetchCases } = useMedicalApp();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File Management State
  const [pacsFiles, setPacsFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  const fetchPacsFiles = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/pacs/files");
      if (res.ok) {
        const data = await res.json();
        setPacsFiles(data);
      }
    } catch (err) {
      console.error("Failed to fetch Mock PACS files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchPacsFiles();
  }, []);

  const handleDeleteFile = async (caseId: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/pacs/files/${caseId}`, { method: "DELETE" });
      setPacsFiles(prev => prev.filter(c => c.id !== caseId));
      fetchCases();
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

    const handleFiles = async (files: FileList) => {
    if (files.length > 5) {
      setErrorMessage("You can only upload up to 5 files at once.");
      setUploadState("error");
      setTimeout(() => setUploadState("idle"), 4000);
      return;
    }

    const filesToUpload = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".dcm"));
    
    if (filesToUpload.length === 0) {
      setErrorMessage("No valid .dcm files found.");
      setUploadState("error");
      setTimeout(() => setUploadState("idle"), 4000);
      return;
    }

    setUploadState("uploading");
    
    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("http://127.0.0.1:8000/api/pacs/upload", {
          method: "POST",
          body: formData
        });
        if (!res.ok) throw new Error("Failed to upload file " + file.name);
      }

      setUploadState("success");
      fetchPacsFiles(); // Refresh list
      fetchCases(); // Refresh global cases list
      setTimeout(() => setUploadState("idle"), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Upload failed");
      setUploadState("error");
      setTimeout(() => setUploadState("idle"), 4000);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col relative overflow-hidden -m-6 md:-m-8 p-8 md:p-12 overflow-y-auto items-center justify-start xl:justify-center">
      <div className="w-full max-w-[1400px] flex flex-col mx-auto my-auto">
      
      {/* Header with Back button */}
      <div className="flex flex-col mb-12">
        <button 
          onClick={() => setCurrentScreen('dashboard')}
          className="self-start flex items-center gap-2 text-zinc-500 hover:text-[#8D321F] transition-colors mb-4 font-semibold text-sm"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#8D321F]/10 rounded-2xl">
            <Database className="w-8 h-8 text-[#8D321F]" />
          </div>
          <div>
            <h1 className="text-4xl font-spartan font-bold text-zinc-900 tracking-tight">Mock PACS Node</h1>
            <p className="text-zinc-500 font-medium mt-1">Local Development & Simulation Environment</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12 w-full">
        
        {/* Left Side: Server Status & Model */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6 flex-shrink-0">
          
          {/* Server "3D" Visualization */}
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 rounded-[32px] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-sm group">
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Online</span>
            </div>
            
            <div className="relative transform transition-transform duration-700 group-hover:-translate-y-2">
              <div className="w-48 h-12 bg-zinc-800 rounded-t-xl border-b border-zinc-600 flex items-center px-4 relative z-20 shadow-lg">
                <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"/><div className="w-2 h-2 rounded-full bg-blue-400"/></div>
              </div>
              <div className="w-48 h-12 bg-zinc-800 border-b border-zinc-600 flex items-center px-4 relative z-20 shadow-lg">
                <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/><div className="w-2 h-2 rounded-full bg-blue-400"/></div>
              </div>
              <div className="w-48 h-16 bg-zinc-800 rounded-b-xl flex items-center justify-between px-4 relative z-20 shadow-xl">
                <Server className="w-6 h-6 text-zinc-500" />
                <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-[#8D321F] animate-ping" />
                </div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-4 bg-black/10 blur-xl rounded-full" />
              <div className="absolute top-0 left-4 w-px h-full bg-gradient-to-b from-white/20 to-transparent z-30" />
            </div>
          </div>

          {/* Connection Details */}
          <div className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#8D321F]" /> Node Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium text-sm">AE Title</span>
                <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg">KITTEN_AE</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium text-sm">IP Address / Host</span>
                <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg">127.0.0.1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium text-sm">DICOM Port</span>
                <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg">104</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Upload Zone & File List */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Upload Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full min-h-[300px] rounded-[32px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-zinc-50/50
              ${isDragging ? 'border-[#8D321F] bg-[#8D321F]/5 scale-[0.98]' : 'border-zinc-300 hover:border-[#8D321F]/50 hover:bg-zinc-50'}
            `}
          >
            <input
              type="file"
              accept=".dcm"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            <AnimatePresence mode="wait">
              {uploadState === "idle" && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center text-center pointer-events-none"
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-zinc-200 flex items-center justify-center mb-4 text-[#8D321F]">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-800 mb-1">Ingest DICOM Files</h3>
                  <p className="text-zinc-500 max-w-sm text-sm font-medium">
                    Drag and drop up to 5 .dcm files here to simulate pushing them from an external modality.
                  </p>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 bg-zinc-900 hover:bg-[#8D321F] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] pointer-events-auto active:scale-95"
                  >
                    Select File
                  </button>
                </motion.div>
              )}

              {uploadState === "uploading" && (
                <motion.div 
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-zinc-200 flex items-center justify-center mb-4 relative">
                    <div className="absolute inset-0 rounded-full border-[3px] border-zinc-100" />
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#8D321F] border-t-transparent animate-spin" />
                    <File className="w-6 h-6 text-[#8D321F]" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800">Processing File...</h3>
                  <p className="text-zinc-500 text-sm mt-1 font-medium">Extracting metadata</p>
                </motion.div>
              )}

              {uploadState === "success" && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-emerald-600"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-full shadow-sm border border-emerald-200 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold">Upload Successful</h3>
                </motion.div>
              )}

              {uploadState === "error" && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-red-600"
                >
                  <div className="w-16 h-16 bg-red-50 rounded-full shadow-sm border border-red-200 flex items-center justify-center mb-4">
                    <X className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold">Ingestion Failed</h3>
                  <p className="text-red-600/80 text-sm mt-1 font-medium">{errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>
            </div>

          {/* File Management List */}
          <div className="w-full bg-white border border-zinc-200 rounded-[24px] shadow-sm flex flex-col flex-1 overflow-hidden min-h-[300px]">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <List className="w-5 h-5 text-zinc-400" /> Currently Stored in Mock Node
              </h3>
              <span className="text-xs font-bold bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">
                {pacsFiles.length} FILES
              </span>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {isLoadingFiles ? (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                  Loading files...
                </div>
              ) : pacsFiles.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2 min-h-[150px]">
                  <Database className="w-8 h-8 text-zinc-200" />
                  <p className="text-sm font-medium">No DICOM files in mock storage.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pacsFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <File className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{file.patientName}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {file.id}  {file.type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete from Mock PACS"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};
