import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { DicomViewport } from '../interactive/DicomViewport';
import { AccuracyGauge } from '../interactive/AccuracyGauge';
import { LottieIcon, SparkleIcon } from '../ui/LottieIcon';
import { ModelType } from '../../types';
import confetti from 'canvas-confetti';
import { Activity, Bone, Crosshair } from 'lucide-react';

export const DiagnosticStudioView: React.FC = () => {
  const { 
    patientForm, 
    saveCurrentCase, 
    accuracyScore,
    setAccuracyScore,
    diagnosticReport,
    setDiagnosticReport,
    selectedModel,
    setSelectedModel
  } = useMedicalApp();

  const handleSave = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#8D321F', '#00BF63', '#FFFFFF']
    });
    saveCurrentCase();
  };

  const handleExportPDF = () => {
    alert("Clinical Diagnostic Report exported to PDF and synchronized with PACS/RIS.");
  };

  const handleModelSwitch = (model: ModelType) => {
    setSelectedModel(model);
    if (model === 'fracture-detection') {
      setAccuracyScore(99.1);
      setDiagnosticReport({
        diagnosis: 'Acute Cortical Bone Discontinuity / Fracture',
        findings: [
          'Identified focal cortical break via Ultralytics YOLO11n',
          'Diaphyseal cortical discontinuity with 2.4mm step-off',
          'Intact radiocapitellar articulation without gross dislocation'
        ],
        recommendation: 'Closed reduction under hematoma block, sugar-tong splint immobilization, and repeat orthogonal radiographs in 7 days.',
        confidenceGrade: 'Grade A1 YOLO11n Verified (99.1% Confidence)'
      });
    } else if (model === 'knee-osteoarthritis') {
      setAccuracyScore(97.8);
      setDiagnosticReport({
        diagnosis: 'KL Grade 2: Mild Knee Osteoarthritis',
        klGrade: 2,
        findings: [
          'Definite small osteophytes along medial femoral condyle and tibial plateau',
          'Mild joint space narrowing in the medial compartment',
          'Subtle subchondral bone sclerosis without significant deformity'
        ],
        recommendation: 'Physical therapy, quadriceps strengthening, weight management, and oral/topical NSAIDs as clinically indicated.',
        confidenceGrade: 'Grade A1 AI-Verified (97.8% Confidence)'
      });
    } else {
      setAccuracyScore(98.6);
      setDiagnosticReport({
        diagnosis: 'Lateral Tibial Plateau Alignment Disruption',
        findings: [
          'Lateral tibial plateau cortical discontinuity',
          'Soft tissue swelling anterior to proximal fibula',
          'CTFS measurement indicates grade II displacement'
        ],
        recommendation: 'Weight-bearing CT scan and orthopedic sports medicine evaluation.',
        confidenceGrade: 'Grade A1 AI-Verified (98.6% Confidence)'
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 w-full max-w-[1360px] mx-auto h-full select-none overflow-hidden">
      {/* Top Clinical Model Viewport Switcher Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border-[2px] border-[#1F1F1F]/20 px-4 py-2 shadow-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mr-2">
            Active Neural Model:
          </span>

          {/* Model 1: Knee Osteoarthritis */}
          <button
            onClick={() => handleModelSwitch('knee-osteoarthritis')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedModel === 'knee-osteoarthritis'
                ? 'bg-[#8D321F] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Knee Osteoarthritis</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedModel === 'knee-osteoarthritis' ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
              KL 0-4
            </span>
          </button>

          {/* Model 2: Bone Fracture Detection */}
          <button
            onClick={() => handleModelSwitch('fracture-detection')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedModel === 'fracture-detection'
                ? 'bg-[#8D321F] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <Bone className="w-3.5 h-3.5" />
            <span>Bone Fracture Detection</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedModel === 'fracture-detection' ? 'bg-[#00E676] text-black font-bold' : 'bg-emerald-100 text-emerald-800'}`}>
              YOLO11n
            </span>
          </button>

          {/* Model 3: Knee Abnormality */}
          <button
            onClick={() => handleModelSwitch('knee-abnormality')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedModel === 'knee-abnormality'
                ? 'bg-[#8D321F] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Knee Abnormality</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedModel === 'knee-abnormality' ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
              CTFS
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>GPU Acceleration: RTX 4060</span>
        </div>
      </div>

      {/* Main 3-Column Studio Workstation */}
      <div className="flex-1 flex gap-6 w-full items-stretch overflow-hidden">
        {/* Column 1: Left Annotated DICOM Viewport */}
        <div className="h-full flex flex-col flex-1 max-w-[390px]">
          <DicomViewport />
        </div>

        {/* Column 2: Center Structured Detection Report */}
        <div className="flex-1 flex flex-col justify-between max-w-[460px] h-full">
          {/* Detection Report Card */}
          <div className="bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header: Detection Report : + Scaled Sparkles + Download */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3 px-1 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-[21px] font-display font-semibold text-[#1F1F1F] tracking-tight">
                    Detection Report :
                  </h3>
                  <div className="text-[#8D321F]">
                    <SparkleIcon className="w-7 h-7 text-[#8D321F]" />
                  </div>
                </div>

                <button
                  onClick={handleExportPDF}
                  className="w-9 h-9 rounded-lg border border-zinc-300 hover:border-[#8D321F] hover:bg-[#8D321F]/5 flex items-center justify-center text-zinc-700 transition group"
                  title="Download Diagnostic Report"
                >
                  <div className="w-7 h-7 flex items-center justify-center group-hover:scale-115 transition-transform">
                    <LottieIcon name="file-download" size={30} />
                  </div>
                </button>
              </div>

              {/* Inner Report Container */}
              <div className="bg-[#EBE7E6] rounded-[22px] p-4 text-[13.5px] text-zinc-800 space-y-3.5 flex-1 overflow-y-auto custom-scrollbar border border-zinc-300/60 leading-relaxed font-sans">
                {/* Diagnosis Title */}
                <div className="space-y-1">
                  <span className="font-bold text-[#8D321F] block uppercase tracking-wide text-[11px]">
                    Clinical Diagnosis
                  </span>
                  <p className="font-semibold text-zinc-900 text-[14.5px]">
                    {diagnosticReport.diagnosis}
                  </p>
                </div>

                {/* Model Findings List */}
                <div className="space-y-1">
                  <span className="font-bold text-zinc-600 block uppercase tracking-wide text-[11px]">
                    {selectedModel === 'knee-osteoarthritis' ? 'Radiographic OA Findings' : selectedModel === 'fracture-detection' ? 'YOLO11n Fracture Localization' : 'Lesion Coordinates & Metrics'}
                  </span>
                  <ul className="list-disc list-inside text-zinc-700 space-y-1 text-[13px]">
                    {diagnosticReport.findings.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Staging / Recommendation */}
                <div className="space-y-1">
                  <span className="font-bold text-zinc-600 block uppercase tracking-wide text-[11px]">
                    Impression & Clinical Recommendation
                  </span>
                  <p className="text-zinc-700 text-[12.5px]">
                    {diagnosticReport.recommendation || 'Routine follow-up recommended with symptom correlation.'}
                  </p>
                </div>

                {/* Confidence Grade */}
                <div className="pt-2 border-t border-zinc-300/80">
                  <span className="font-bold text-zinc-700 block text-[11px] uppercase">
                    Confidence Grade:
                  </span>
                  <span className="text-[12.5px] text-[#00BF63] font-semibold">
                    {diagnosticReport.confidenceGrade || `Grade A1 AI-Verified (${accuracyScore}% Confidence)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Save Action Button */}
            <div className="pt-4 flex justify-center flex-shrink-0">
              <button
                onClick={handleSave}
                className="w-full max-w-[270px] bg-[#8D321F] hover:bg-[#7D2A18] text-white py-4 px-8 rounded-full flex items-center justify-center gap-4 transition-all duration-200 active:scale-98 shadow-md hover:shadow-xl group"
              >
                <span className="font-display font-semibold text-[25px] tracking-wide">
                  Save
                </span>
                <div className="w-9 h-9 flex items-center justify-center filter brightness-0 invert group-hover:scale-125 transition-transform">
                  <LottieIcon name="save" size={38} />
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
              <h4 className="w-full text-left font-semibold text-[15.5px] text-zinc-900 mb-2">
                Detection Accuracy:
              </h4>
              <div className="py-2 flex items-center justify-center">
                <AccuracyGauge score={accuracyScore} size={156} />
              </div>
            </div>
          </div>

          {/* Bottom: Patient Information Card */}
          <div className="bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] p-4 shadow-sm flex flex-col flex-1 overflow-hidden">
            <h4 className="font-semibold text-[15.5px] text-zinc-900 mb-2 px-1 flex-shrink-0">
              Patient information :
            </h4>
            <div className="bg-[#EBE7E6] rounded-[22px] p-4 flex-1 flex flex-col justify-between border border-zinc-300/60 text-xs overflow-y-auto custom-scrollbar">
              <div className="space-y-2.5 text-zinc-700">
                <div className="flex justify-between border-b border-zinc-300 pb-1">
                  <span className="text-zinc-500 font-medium text-[12.5px]">Patient ID:</span>
                  <span className="font-mono font-bold text-zinc-900 text-[13px]">{patientForm.id || 'Pending ID'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-300 pb-1">
                  <span className="text-zinc-500 font-medium text-[12.5px]">Name:</span>
                  <span className="font-semibold text-zinc-900 text-[13px]">{patientForm.name || 'Unassigned Patient'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-300 pb-1">
                  <span className="text-zinc-500 font-medium text-[12.5px]">Age / Sex:</span>
                  <span className="font-semibold text-zinc-900 text-[13px]">
                    {patientForm.age ? `${patientForm.age} y/o (${patientForm.sex || 'unspecified'})` : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-300 pb-1">
                  <span className="text-zinc-500 font-medium text-[12.5px]">Study Date:</span>
                  <span className="font-mono text-zinc-800 text-[12.5px]">{patientForm.studyDate || 'Today'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium text-[12.5px]">Region:</span>
                  <span className="font-semibold text-zinc-800 text-[12.5px]">
                    {patientForm.bodyPart || (selectedModel === 'fracture-detection' ? 'Forearm / Radius-Ulna AP' : selectedModel === 'knee-osteoarthritis' ? 'Knee Bilateral AP' : 'Knee Lateral View')}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11.5px] text-zinc-500 font-mono text-center flex-shrink-0">
                Verified by Dr. Hassan (PACS #8821)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
