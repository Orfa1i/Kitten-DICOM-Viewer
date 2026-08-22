import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { LottieIcon } from '../ui/LottieIcon';
import { X, Loader2 } from 'lucide-react';

export const IntakeUploadModal: React.FC = () => {
  const { 
    patientForm, 
    setPatientForm, 
    uploadedFile, 
    setUploadedFile, 
    setUploadedFileRaw,
    setUploadedFileName,
    runInference, 
    isDetecting,
    detectionProgress,
    setCurrentScreen 
  } = useMedicalApp();

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
      setUploadedFileRaw(file);
      setUploadedFileName(file.name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(url);
      setUploadedFileRaw(file);
      setUploadedFileName(file.name);
    }
  };

  const handleClose = () => {
    setCurrentScreen('dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full max-w-[1240px] mx-auto py-8 px-4 select-none">
      {/* Modal Container */}
      <div className="w-full max-w-[860px] bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-[#8D321F] px-8 py-4 flex items-center justify-between text-white">
          <h2 className="text-[26px] font-display font-semibold tracking-tight">
            New case
          </h2>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition"
          >
            <div className="w-7 h-7 border-2 border-white rounded-full flex items-center justify-center p-0.5">
              <X className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch bg-white">
          {/* Left Column: Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 rounded-[28px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[340px] relative overflow-hidden group ${
              isDragOver
                ? 'border-[#8D321F] bg-[#8D321F]/5 scale-[0.99]'
                : 'border-zinc-800 hover:border-[#8D321F] bg-white'
            }`}
          >
            <input
              type="file"
              accept="image/*,.dicom,.dcm"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleFileInput}
            />

            {uploadedFile ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-48 h-52 rounded-xl overflow-hidden border border-zinc-300 shadow-inner bg-black flex items-center justify-center">
                  <img
                    src={uploadedFile}
                    alt="Study Preview"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  Click or drag to replace scan
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                {/* Scaled Upload Icon to 96px */}
                <div className="w-28 h-28 text-zinc-500 flex items-center justify-center group-hover:scale-115 transition-transform">
                  <LottieIcon name="file-upload" size={96} />
                </div>
                <span className="text-[18px] font-semibold text-[#C27364] tracking-wide">
                  Upload Or Drag file
                </span>
                <span className="text-[13px] text-zinc-400">
                  Supports DICOM, DCM, JPEG, PNG
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Patient Metadata Form */}
          <div className="flex flex-col justify-between space-y-4">
            {/* Top Fields */}
            <div className="space-y-4">
              {/* Patient ID + Sex row */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-8">
                  <label className="block text-[14px] font-semibold text-zinc-700 mb-1">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={patientForm.id}
                    onChange={(e) => setPatientForm({ ...patientForm, id: e.target.value })}
                    className="w-full rounded-full border border-dashed border-zinc-400 px-4 py-2.5 text-[15px] text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid font-medium bg-zinc-50/50"
                    placeholder="e.g. kt-523476"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-[14px] font-semibold text-zinc-700 mb-1 text-center">
                    Sex
                  </label>
                  <div className="flex items-center justify-center gap-2 border border-dashed border-zinc-400 rounded-full py-1.5 px-2 bg-zinc-50/50">
                    {/* Female Pill Scaled Up */}
                    <button
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, sex: 'female' })}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[19px] transition ${
                        patientForm.sex === 'female'
                          ? 'bg-[#E85B88] text-white shadow-xs scale-105'
                          : 'text-[#E85B88] hover:bg-pink-50'
                      }`}
                      title="Female"
                    >
                      ♀
                    </button>

                    {/* Male Pill Scaled Up */}
                    <button
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, sex: 'male' })}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[19px] transition ${
                        patientForm.sex === 'male'
                          ? 'bg-[#3B82F6] text-white shadow-xs scale-105'
                          : 'text-[#3B82F6] hover:bg-blue-50'
                      }`}
                      title="Male"
                    >
                      ♂
                    </button>
                  </div>
                </div>
              </div>

              {/* Name + Age row */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-8">
                  <label className="block text-[14px] font-semibold text-zinc-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                    className="w-full rounded-full border border-dashed border-zinc-400 px-4 py-2.5 text-[15px] text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid font-medium bg-zinc-50/50"
                    placeholder="e.g. Mohamad"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-[14px] font-semibold text-zinc-700 mb-1 text-center">
                    Age
                  </label>
                  <input
                    type="text"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                    className="w-full rounded-full border border-dashed border-zinc-400 px-3 py-2.5 text-[15px] text-center text-zinc-800 focus:outline-none focus:border-[#8D321F] focus:border-solid font-medium bg-zinc-50/50"
                    placeholder="33"
                  />
                </div>
              </div>
            </div>

            {/* Detect Action Button with Scaled Icon to 42px */}
            <div className="pt-2">
              <button
                disabled={isDetecting}
                onClick={runInference}
                className="w-full bg-[#8D321F] hover:bg-[#7D2A18] text-white py-4 px-8 rounded-full flex items-center justify-center gap-4 transition-all duration-200 active:scale-98 shadow-md hover:shadow-xl disabled:opacity-75 group relative overflow-hidden"
              >
                {/* Glow ring effect */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-full animate-pulse" />

                {isDetecting ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <span className="font-display font-semibold text-[24px] tracking-wide">
                      Analyzing ({detectionProgress}%)...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-display font-semibold text-[30px] tracking-wide">
                      Detect
                    </span>
                    <div className="w-11 h-11 flex items-center justify-center filter brightness-0 invert group-hover:translate-x-2 group-hover:-translate-y-1 group-hover:scale-120 transition-transform">
                      <LottieIcon name="send" size={42} />
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
