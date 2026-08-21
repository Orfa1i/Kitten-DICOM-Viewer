import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { DicomViewport } from '../interactive/DicomViewport';
import { AccuracyGauge } from '../interactive/AccuracyGauge';
import { LottieIcon, SparkleIcon } from '../ui/LottieIcon';
import confetti from 'canvas-confetti';

export const DiagnosticStudioView: React.FC = () => {
  const { 
    patientForm, 
    saveCurrentCase, 
    accuracyScore 
  } = useMedicalApp();

  const handleSave = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#8D321F', '#00BF63', '#FFFFFF']
    });
    saveCurrentCase();
  };

  const handleExportPDF = () => {
    alert("Clinical Report exported to PDF and synchronized with Hospital PACS/RIS.");
  };

  return (
    <div className="flex-1 flex gap-6 w-full max-w-[1360px] mx-auto h-full items-stretch select-none overflow-hidden">
      {/* Column 1: Left Annotated DICOM Viewport */}
      <div className="h-full flex flex-col flex-1 max-w-[390px]">
        <DicomViewport />
      </div>

      {/* Column 2: Center Structured Detection Report */}
      <div className="flex-1 flex flex-col justify-between max-w-[460px] h-full">
        {/* Detection Report Card */}
        <div className="bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header: Detection Report : + Sparkles + Download */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3 px-1 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[19px] font-display font-semibold text-[#1F1F1F] tracking-tight">
                  Detection Report :
                </h3>
                <div className="text-[#8D321F]">
                  <SparkleIcon className="w-5 h-5 text-[#8D321F]" />
                </div>
              </div>

              <button
                onClick={handleExportPDF}
                className="w-7 h-7 rounded-lg border border-zinc-300 hover:border-[#8D321F] hover:bg-[#8D321F]/5 flex items-center justify-center text-zinc-700 transition"
                title="Download Diagnostic Report"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <LottieIcon name="file-download" size={16} />
                </div>
              </button>
            </div>

            {/* Inner Report Container */}
            <div className="bg-[#EBE7E6] rounded-[22px] p-4 text-[13px] text-zinc-800 space-y-3 flex-1 overflow-y-auto custom-scrollbar border border-zinc-300/60 leading-relaxed font-sans">
              <div className="space-y-1">
                <span className="font-bold text-[#8D321F] block uppercase tracking-wide text-[11px]">
                  Clinical Diagnosis
                </span>
                <p className="font-semibold text-zinc-900">
                  Mid-shaft Radial Diaphyseal Fracture (Complete)
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-zinc-600 block uppercase tracking-wide text-[11px]">
                  Lesion Coordinates & Metrics
                </span>
                <ul className="list-disc list-inside text-zinc-700 space-y-1 text-[12.5px]">
                  <li>Displacement: <strong>2.4 mm dorsal cortical shift</strong></li>
                  <li>Angulation: <strong>11.8° radial tilt</strong></li>
                  <li>Articular Extension: <strong>None detected</strong></li>
                  <li>Proximal/Distal Radioulnar Joints: <strong>Preserved</strong></li>
                </ul>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-zinc-600 block uppercase tracking-wide text-[11px]">
                  Impression & Staging
                </span>
                <p className="text-zinc-700 text-[12px]">
                  Isolated complete radial fracture without ulna plastic deformation (Galeazzi equivalent rule-out recommended with orthogonal wrist view).
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-300/80">
                <span className="font-bold text-zinc-700 block text-[11px] uppercase">
                  Confidence Grade:
                </span>
                <span className="text-[12px] text-[#00BF63] font-semibold">
                  Grade A1 AI-Verified (98.6% IoU Match)
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Save Action Button */}
          <div className="pt-4 flex justify-center flex-shrink-0">
            <button
              onClick={handleSave}
              className="w-full max-w-[240px] bg-[#8D321F] hover:bg-[#7D2A18] text-white py-3 px-8 rounded-full flex items-center justify-center gap-3 transition-all duration-200 active:scale-98 shadow-md hover:shadow-lg group"
            >
              <span className="font-display font-semibold text-[22px] tracking-wide">
                Save
              </span>
              <div className="w-6 h-6 flex items-center justify-center filter brightness-0 invert group-hover:scale-110 transition-transform">
                <LottieIcon name="save" size={22} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Column 3: Right Side (Accuracy Gauge + Patient Information) */}
      <div className="w-[310px] flex-shrink-0 flex flex-col justify-between gap-4 h-full">
        {/* Top: Detection Accuracy Card */}
        <div className="bg-[#8D321F] rounded-[32px] p-4 shadow-md flex flex-col flex-shrink-0">
          <div className="bg-white rounded-[24px] p-4 flex flex-col items-center shadow-inner">
            <h4 className="w-full text-left font-semibold text-[15px] text-zinc-900 mb-2">
              Detection Accuracy:
            </h4>
            <div className="py-2 flex items-center justify-center">
              <AccuracyGauge score={accuracyScore} size={150} />
            </div>
          </div>
        </div>

        {/* Bottom: Patient Information Card */}
        <div className="bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] p-4 shadow-sm flex flex-col flex-1 overflow-hidden">
          <h4 className="font-semibold text-[15px] text-zinc-900 mb-2 px-1 flex-shrink-0">
            Patient information :
          </h4>
          <div className="bg-[#EBE7E6] rounded-[22px] p-4 flex-1 flex flex-col justify-between border border-zinc-300/60 text-xs overflow-y-auto custom-scrollbar">
            <div className="space-y-2 text-zinc-700">
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium">Patient ID:</span>
                <span className="font-mono font-bold text-zinc-900">{patientForm.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium">Name:</span>
                <span className="font-semibold text-zinc-900">{patientForm.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium">Age / Sex:</span>
                <span className="font-semibold text-zinc-900">{patientForm.age} y/o ({patientForm.sex})</span>
              </div>
              <div className="flex justify-between border-b border-zinc-300 pb-1">
                <span className="text-zinc-500 font-medium">Study Date:</span>
                <span className="font-mono text-zinc-800">{patientForm.studyDate || '2026-08-21'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-medium">Region:</span>
                <span className="font-semibold text-zinc-800">{patientForm.bodyPart || 'Forearm AP'}</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 font-mono text-center flex-shrink-0">
              Verified by Dr. Hassan (PACS #8821)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
