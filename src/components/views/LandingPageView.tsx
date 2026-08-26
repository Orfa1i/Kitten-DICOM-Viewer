import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ModelType } from '../../types';
import DitherEffect2 from '../originkit/ui/dither-effect-2-custom-style344';
import { SparkleIcon, LottieIcon } from '../ui/LottieIcon';
import { 
  ArrowRight, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Sliders, 
  Bot, 
  CheckCircle2, 
  Zap, 
  Eye, 
  Download,
  ChevronRight,
  Database
} from 'lucide-react';

export const LandingPageView: React.FC = () => {
  const { 
    setCurrentScreen, 
    setSelectedModel, 
    setIsLlmSettingsOpen, 
    llmConfig 
  } = useMedicalApp();

  const handleLaunchModel = (model: ModelType) => {
    setSelectedModel(model);
    setCurrentScreen('intake-upload');
  };

  const [isScrolledPastHero, setIsScrolledPastHero] = React.useState(false);

  const syringeConfigs = React.useMemo(() => {
    return Array.from({ length: 16 }).map(() => ({
      size: 60 + Math.random() * 100,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * -10,
      duration: 6 + Math.random() * 8,
      opacity: 0.5 + Math.random() * 0.4,
    }));
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.85) {
        setIsScrolledPastHero(true);
      } else {
        setIsScrolledPastHero(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount in case we start scrolled down
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FDF9F9] text-[#1F1F1F] flex flex-col relative overflow-x-hidden selection:bg-[#8D321F] selection:text-white">
      {/* Top Floating Glass Navigation Bar - Apple Vision Pro Style */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-[48px] saturate-[1.2] border-b shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-6 md:px-12 py-4 flex items-center justify-between transition-all duration-300 ${isScrolledPastHero ? 'border-zinc-200/50' : 'border-white/10'}`}>
        {/* Brand */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className={`font-spartan font-bold text-[34px] tracking-tight drop-shadow-sm transition-colors duration-300 ${isScrolledPastHero ? 'text-[#8D321F]' : 'text-white'}`}>
            Kitten
          </span>
          <span className={`border text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block transition-colors duration-300 ${isScrolledPastHero ? 'bg-[#8D321F]/10 border-[#8D321F]/20 text-[#8D321F]' : 'bg-white/15 border-white/20 text-white'}`}>
            2026 Edition
          </span>
        </div>


      </header>

      {/* HERO SECTION WITH DITHER EFFECT SHADER BACKGROUND */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 md:px-8 overflow-hidden bg-[#8D321F]">
        {/* Interactive WebGL2 Dither Swirl Shader Background */}
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
          <DitherEffect2
            background="#3D1007"
            color="#FF8A65"
            size={34}
            speed={40}
            scale={42}
          />
        </div>

        {/* Floating 3D Medical Syringe Animation Cloud (mix-blend-screen for black bg removal) */}
        {syringeConfigs.map((config, i) => (
          <div 
            key={`syringe-${i}`}
            className="absolute pointer-events-none z-0 mix-blend-screen animate-float-syringe md:block hidden"
            style={{
              top: `${config.top}%`,
              left: `${config.left}%`,
              width: `${config.size}px`,
              height: `${config.size}px`,
              opacity: config.opacity,
              animationDuration: `${config.duration}s`,
              animationDelay: `${config.delay}s`,
            }}
          >
            <img 
              src="/assets/images/3d_syringe.jpg" 
              alt="" 
              className="w-full h-full object-contain filter saturate-[1.5] contrast-[1.2]" 
            />
          </div>
        ))}

        {/* Gradient Vignette Overlays for Maximum Text Legibility */}
        <div className="absolute inset-0 z-1 bg-gradient-to-t from-[#8D321F]/90 via-transparent to-[#8D321F]/80 pointer-events-none" />
        <div className="absolute inset-0 z-1 bg-radial from-transparent via-[#8D321F]/40 to-[#8D321F]/80 pointer-events-none" />

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-[1080px] mx-auto text-center flex flex-col items-center space-y-6 md:space-y-8 text-white px-2">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-[13.5px] font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-white">
              <SparkleIcon className="w-5 h-5 text-white" size={20} />
            </div>
            <span>Next-Gen Medical Imaging & Deep Learning Diagnostic Suite</span>
          </div>

          {/* Main Headline with League Spartan */}
          <h1 className="font-spartan font-bold text-[40px] sm:text-[56px] md:text-[72px] leading-[1.04] tracking-tight text-white drop-shadow-md">
            Precision Radiograph AI.<br />
            <span className="text-white/90">Sub-Second Diagnostic Intelligence.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-[760px] text-[16px] sm:text-[19px] md:text-[21px] text-white/85 leading-relaxed font-light font-sans drop-shadow-xs">
            Automated Kellgren-Lawrence osteoarthritis staging, diaphyseal fracture localization, and DICOM PACS workflow automation engineered for modern radiologists.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full justify-center">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-[#8D321F] text-[17px] font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-glow-rust transition-all duration-200 active:scale-95 group font-spartan"
            >
              <span>Enter Diagnostic Studio</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform text-[#8D321F]" />
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 2: CLINICAL AI MODELS SHOWCASE */}
      <section id="models" className="py-20 px-6 md:px-12 max-w-[1360px] mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8D321F]/10 text-[#8D321F] text-[13px] font-bold uppercase tracking-wider font-spartan">
            Clinical Neural Networks
          </div>
          <h2 className="text-[38px] md:text-[48px] font-spartan font-bold text-[#1F1F1F] tracking-tight">
            Specialized Medical Vision Models
          </h2>
          <p className="text-[16px] text-zinc-600 leading-relaxed">
            Multi-model deep learning ensembles calibrated against ground-truth radiologist annotations.
          </p>
        </div>

        {/* 2 Model Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1040px] mx-auto">
          {/* Card 1: Knee Osteoarthritis */}
          <div className="bg-white rounded-[32px] border-[2.5px] border-[#8D321F] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="h-52 bg-black rounded-2xl overflow-hidden flex items-center justify-center relative">
                <img
                  src="/assets/images/model_knee_osteoarthritis.png"
                  alt="Knee Osteoarthritis Detection"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#8D321F] text-white text-[11.5px] font-bold px-3 py-1 rounded-full font-spartan">
                  KL0 – KL4 Staging
                </div>
              </div>

              <div>
                <h3 className="text-[24px] font-spartan font-bold text-zinc-900 tracking-tight">
                  Knee Osteoarthritis
                </h3>
                <p className="text-[14px] text-zinc-500 font-mono mt-0.5">
                  YOLOv8 + ResNet/DenseNet Ensemble
                </p>
              </div>

              <p className="text-[14px] text-zinc-600 leading-relaxed">
                Automated bilateral joint localization and multi-model ensemble grading with joint space narrowing and osteophyte quantification.
              </p>

              <div className="space-y-2 pt-2 border-t border-zinc-100 text-[13px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Accuracy Benchmark:</span>
                  <strong className="text-[#00BF63] font-bold font-spartan">97.8% verified</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Modality:</span>
                  <span className="font-mono text-zinc-800">DX Weight-Bearing AP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchModel('knee-osteoarthritis')}
              className="mt-6 w-full bg-[#8D321F] hover:bg-[#7D2A18] text-white py-3 px-5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition active:scale-95 shadow-sm font-spartan"
            >
              <span>Run Diagnostic Scan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Fracture Detection */}
          <div className="bg-white rounded-[32px] border-[2.5px] border-zinc-300 hover:border-[#8D321F] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="h-52 bg-black rounded-2xl overflow-hidden flex items-center justify-center relative">
                <img
                  src="/assets/images/model_fracture.png"
                  alt="Fracture Detection"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#00BF63] text-white text-[11.5px] font-bold px-3 py-1 rounded-full font-spartan">
                  Cortical Break
                </div>
              </div>

              <div>
                <h3 className="text-[24px] font-spartan font-bold text-zinc-900 tracking-tight">
                  Bone Fracture Detection
                </h3>
                <p className="text-[14px] text-zinc-500 font-mono mt-0.5">
                  Ultralytics YOLO11n Engine
                </p>
              </div>

              <p className="text-[14px] text-zinc-600 leading-relaxed">
                Locates complete and incomplete cortical fractures, computes displacement metrics, and renders activation heatmaps.
              </p>

              <div className="space-y-2 pt-2 border-t border-zinc-100 text-[13px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Accuracy Benchmark:</span>
                  <strong className="text-[#00BF63] font-bold font-spartan">99.1% verified</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Modality:</span>
                  <span className="font-mono text-zinc-800">Digital Radiography (DX)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchModel('fracture-detection')}
              className="mt-6 w-full bg-[#8D321F] hover:bg-[#7D2A18] text-white py-3 px-5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition active:scale-95 shadow-sm font-spartan"
            >
              <span>Run Diagnostic Scan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: 3-STEP PACS DIAGNOSTIC WORKFLOW */}
      <section id="workflow" className="py-20 bg-[#FAF6F6] border-y border-zinc-200/80 px-6 md:px-12">
        <div className="max-w-[1360px] mx-auto w-full">
          <div className="text-center max-w-[720px] mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8D321F]/10 text-[#8D321F] text-[13px] font-bold uppercase tracking-wider font-spartan">
              Diagnostic Pipeline
            </div>
            <h2 className="text-[38px] md:text-[48px] font-spartan font-bold text-[#1F1F1F] tracking-tight">
              Seamless 3-Step Radiologist Workflow
            </h2>
            <p className="text-[16px] text-zinc-600">
              Designed from the ground up for high-throughput hospital reading rooms and emergency triage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-[28px] border border-zinc-300 p-8 shadow-sm relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8D321F] text-white font-spartan font-bold text-[22px] flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-[22px] font-spartan font-bold text-zinc-900">
                DICOM Intake & Ingestion
              </h3>
              <p className="text-[14.5px] text-zinc-600 leading-relaxed">
                Drag-and-drop PACS studies or import DICOM/DCM files with automatic patient metadata parsing (ID, Age, Sex, Modality, Body Part).
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#8D321F]">
                <Layers className="w-4 h-4" />
                <span>Multi-format support (DICOM, PNG, JPEG)</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-[28px] border border-zinc-300 p-8 shadow-sm relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8D321F] text-white font-spartan font-bold text-[22px] flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-[22px] font-spartan font-bold text-zinc-900">
                GPU Ensemble Inference
              </h3>
              <p className="text-[14.5px] text-zinc-600 leading-relaxed">
                Real-time sub-second execution on CUDA hardware. Joint localization, multi-network consensus, and confidence probability grading.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#8D321F]">
                <Zap className="w-4 h-4" />
                <span>Sub-second inference on RTX GPU</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-[28px] border border-zinc-300 p-8 shadow-sm relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8D321F] text-white font-spartan font-bold text-[22px] flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-[22px] font-spartan font-bold text-zinc-900">
                Diagnostic Studio & PACS Sync
              </h3>
              <p className="text-[14.5px] text-zinc-600 leading-relaxed">
                Interactive PACS radiograph viewport with windowing controls, circular accuracy gauge, structured findings, and PDF export.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#8D321F]">
                <Download className="w-4 h-4" />
                <span>One-click PACS Save & Confetti confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: AI COPILOT & LLM SETTINGS SPOTLIGHT */}
      <section id="copilot" className="py-20 px-6 md:px-12 max-w-[1360px] mx-auto w-full">
        <div className="bg-[#8D321F] rounded-[36px] p-8 md:p-14 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-6 max-w-[620px]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white text-[13px] font-bold uppercase tracking-wider font-spartan">
              <SparkleIcon className="w-4 h-4 text-white" />
              Multi-Provider AI Diagnostic Copilot
            </div>
            <h2 className="text-[36px] md:text-[50px] font-spartan font-bold leading-[1.08] tracking-tight">
              Bring Your Own LLM.<br />
              <span className="text-white/90">Gemini, Claude, GPT-4o, or Ollama.</span>
            </h2>
            <p className="text-[16px] md:text-[18px] text-white/85 leading-relaxed font-light">
              Kitten includes a built-in AI copilot capable of explaining Kellgren-Lawrence staging, synthesizing radiologist impression drafts, and providing differential diagnostic suggestions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsLlmSettingsOpen(true)}
                className="bg-white hover:bg-zinc-100 text-[#8D321F] font-bold px-7 py-3 rounded-full text-[15px] transition active:scale-95 shadow-md flex items-center gap-2 font-spartan"
              >
                <Sliders className="w-4.5 h-4.5 text-[#8D321F]" />
                <span>Configure LLM Settings</span>
              </button>
              <button
                onClick={() => setCurrentScreen('ai-assistant')}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-6 py-3 rounded-full text-[15px] transition active:scale-95 font-spartan"
              >
                Open AI Assistant Drawer
              </button>
            </div>
          </div>

          {/* Right Floating Copilot Mockup */}
          <div className="w-full max-w-[420px] bg-white rounded-[28px] p-5 text-zinc-900 shadow-2xl border border-white/20 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2.5">
                <SparkleIcon className="w-5 h-5 text-[#8D321F]" />
                <span className="font-spartan font-bold text-[19px] text-zinc-900">Kitten Clinical Copilot</span>
              </div>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Online
              </span>
            </div>

            <div className="space-y-3 text-[13.5px]">
              <div className="bg-[#F5F2F2] rounded-2xl p-3.5 text-zinc-700">
                <strong className="text-[#8D321F] block text-xs uppercase mb-1 font-spartan">Radiologist Query:</strong>
                "Explain the Kellgren-Lawrence grading criteria for Case #kt-523477."
              </div>

              <div className="bg-[#8D321F]/10 border border-[#8D321F]/20 rounded-2xl p-3.5 text-zinc-800 space-y-1.5">
                <strong className="text-[#8D321F] block text-xs uppercase font-spartan">AI Copilot Analysis:</strong>
                <p className="leading-relaxed text-[12.5px]">
                  Case #kt-523477 presents with marked medial joint space narrowing (&gt;50%), subchondral sclerosis of the tibial plateau, and osteophytes along the femoral condyle, consistent with <strong>KL Grade 3 (Moderate OA)</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center text-[11.5px] text-zinc-400 font-mono">
              Active Provider: {llmConfig?.modelName || 'Google Gemini 2.5 Flash'}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-zinc-200 py-12 px-6 md:px-12 text-zinc-600">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Watermark with League Spartan */}
          <div className="flex items-center gap-3">
            <span className="font-spartan font-bold text-[38px] text-[#8D321F] tracking-tight">
              Kitten
            </span>
            <span className="font-spartan font-bold text-[22px] text-[#8D321F]/70 tracking-tight">
              2026
            </span>
            <span className="text-zinc-300 mx-2">|</span>
            <span className="text-xs text-zinc-500 font-sans">
              Medical Imaging Diagnostic Workstation
            </span>
          </div>

          {/* Lead Radiologist & PACS Info */}
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span>Lead Radiologist: Dr. Hassan</span>
            <span>•</span>
            <span>PACS ID: #8821</span>
            <span>•</span>
            <span>HIPAA Compliant</span>
          </div>

          {/* Quick Enter App CTA */}
          <div>
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="bg-[#8D321F] hover:bg-[#7D2A18] text-white px-6 py-2.5 rounded-full font-bold text-[14px] transition active:scale-95 shadow-sm font-spartan"
            >
              Launch Workstation &rarr;
            </button>
          </div>
        </div>

        <div className="max-w-[1360px] mx-auto mt-8 pt-6 border-t border-zinc-100 text-center text-[11.5px] text-zinc-400 font-spartan">
          © 2026 Kitten Medical Systems. AI Diagnostic Decision Support System — For Research & Clinical Triaging.
        </div>
      </footer>
    </div>
  );
};
