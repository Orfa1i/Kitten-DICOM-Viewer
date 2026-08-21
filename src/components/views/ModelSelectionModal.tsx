import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ModelType } from '../../types';
import { SparkleIcon } from '../ui/LottieIcon';
import { X } from 'lucide-react';

export const ModelSelectionModal: React.FC = () => {
  const { setSelectedModel, setCurrentScreen } = useMedicalApp();

  const handleSelectModel = (model: ModelType) => {
    setSelectedModel(model);
    setCurrentScreen('intake-upload');
  };

  const handleClose = () => {
    setCurrentScreen('dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full max-w-[1240px] mx-auto py-8 px-4 select-none">
      {/* Centered Modal Card Container */}
      <div className="w-full max-w-[840px] bg-white rounded-[32px] border-[2.5px] border-[#1F1F1F] shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-[#8D321F] px-8 py-3.5 flex items-center justify-between text-white">
          <h2 className="text-[24px] font-display font-semibold tracking-tight">
            New case
          </h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition"
          >
            <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center p-0.5">
              <X className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Modal Body: 3 Model Cards */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
          {/* Card 1: Knee Osteoarthritis Detection */}
          <div
            onClick={() => handleSelectModel('knee-osteoarthritis')}
            className="group cursor-pointer rounded-2xl overflow-hidden border-[2.5px] border-[#8D321F] bg-black shadow-sm hover:shadow-glow-rust transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="h-44 bg-black flex items-center justify-center overflow-hidden">
              <img
                src="/assets/images/model_knee_osteoarthritis.png"
                alt="Knee Osteoarthritis Detection"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="bg-[#8D321F] text-white p-3 flex items-center justify-between min-h-[64px]">
              <span className="font-semibold text-[14px] leading-tight pr-2">
                Knee Osteoarthritis<br />Detection
              </span>
              <SparkleIcon className="w-5 h-5 text-white flex-shrink-0" />
            </div>
          </div>

          {/* Card 2: Knee Abnormality */}
          <div
            onClick={() => handleSelectModel('knee-abnormality')}
            className="group cursor-pointer rounded-2xl overflow-hidden border-[2.5px] border-[#8D321F] bg-black shadow-sm hover:shadow-glow-rust transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="h-44 bg-black flex items-center justify-center overflow-hidden">
              <img
                src="/assets/images/model_knee_abnormality.png"
                alt="Knee Abnormality"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="bg-[#8D321F] text-white p-3 flex items-center justify-between min-h-[64px]">
              <span className="font-semibold text-[14px] leading-tight pr-2">
                Knee Abnormality
              </span>
              <SparkleIcon className="w-5 h-5 text-white flex-shrink-0" />
            </div>
          </div>

          {/* Card 3: Fracture Detection */}
          <div
            onClick={() => handleSelectModel('fracture-detection')}
            className="group cursor-pointer rounded-2xl overflow-hidden border-[2.5px] border-[#8D321F] bg-black shadow-sm hover:shadow-glow-rust transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="h-44 bg-black flex items-center justify-center overflow-hidden">
              <img
                src="/assets/images/model_fracture.png"
                alt="Fracture Detection"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="bg-[#8D321F] text-white p-3 flex items-center justify-between min-h-[64px]">
              <span className="font-semibold text-[14px] leading-tight pr-2">
                Fracture Detection
              </span>
              <SparkleIcon className="w-5 h-5 text-white flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
