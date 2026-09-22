import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { X, UploadCloud, Cpu, Play } from 'lucide-react';
import { SparkleIcon } from '../ui/LottieIcon';

export const MedGemmaTestModal: React.FC = () => {
  const { isMedGemmaTestOpen, setIsMedGemmaTestOpen } = useMedicalApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clinicalContext, setClinicalContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleTestRun = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("clinical_context", clinicalContext);

    try {
      // Proxying via local MedGemma endpoint directly, ensuring CORS was enabled
      const response = await fetch("http://127.0.0.1:8001/generate-draft-report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data.draft_report || JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || "Failed to connect to MedGemma service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isMedGemmaTestOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-950">MedGemma Integration Test</h2>
                  <p className="text-xs text-amber-700/80 font-medium">Verify local LLM inference on port 8001</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMedGemmaTestOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 text-amber-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Input */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Test Image (Radiograph/MRI)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-300 rounded-xl bg-zinc-50 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors aspect-square relative overflow-hidden"
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <>
                          <UploadCloud className="w-10 h-10 text-zinc-400 mb-3" />
                          <span className="text-sm font-medium text-zinc-500">Click to upload test image</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-zinc-700">Clinical Context (Optional)</label>
                    <textarea 
                      className="w-full border border-zinc-200 rounded-lg p-3 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-none h-24"
                      placeholder="e.g. KL Grade 3 detected, severe joint space narrowing..."
                      value={clinicalContext}
                      onChange={(e) => setClinicalContext(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    onClick={handleTestRun}
                    disabled={isLoading || !selectedFile}
                    className="w-full mt-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Run Inference
                      </>
                    )}
                  </button>
                </div>

                {/* Right: Output */}
                <div className="flex flex-col gap-2 h-full">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <SparkleIcon className="w-4 h-4" /> MedGemma Output
                  </label>
                  <div className="flex-1 border border-zinc-200 rounded-xl bg-zinc-50 p-4 relative min-h-[300px] overflow-auto">
                    {isLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-600/60 font-medium text-sm animate-pulse">
                        <Cpu className="w-8 h-8 mb-3 opacity-50" />
                        Generating Draft Report...
                        <span className="text-xs font-normal mt-1 opacity-70">This typically takes 10-40 seconds</span>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                        {error}
                      </div>
                    ) : result ? (
                      <div className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                        {result}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm font-medium">
                        Waiting for input...
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
