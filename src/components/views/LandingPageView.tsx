import React from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ModelType } from '../../types';
import PixelReveal from '../originkit/ui/pixel-reveal-custom-sred';
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

  return (
    <div className="min-h-screen w-full bg-[#FDF9F9] text-[#1F1F1F] flex flex-col relative overflow-x-hidden selection:bg-[#8D321F] selection:text-white">
      {/* Top Floating Glass Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#8D321F]/90 backdrop-blur-md border-b border-white/10 text-white px-6 md:px-12 py-4 flex items-center justify-between transition-all">
        {/* Brand */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="font-['Fredoka'] font-semibold text-[32px] tracking-normal text-white drop-shadow-sm">
            Kitten
          </span>
          <span className="bg-white/15 border border-white/20 text-white text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
            2026 Edition
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[14.5px] font-medium text-white/80">
          <a href="#models" className="hover:text-white transition-colors">Clinical Models</a>
          <a href="#workflow" className="hover:text-white transition-colors">PACS Workflow</a>
          <a href="#copilot" className="hover:text-white transition-colors">AI Copilot</a>
          <a href="#security" className="hover:text-white transition-colors">Enterprise Security</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* LLM Settings Trigger */}
          <button
            onClick={() => setIsLlmSettingsOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-full text-[13.5px] font-medium transition active:scale-95 shadow-2xs"
            title="Configure LLM Model & API Key"
          >
            <Bot className="w-4 h-4 text-white" />
            <span className="hidden md:inline">LLM Models</span>
            {llmConfig?.provider && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300/40" />
            )}
          </button>

          {/* Launch Workstation CTA */}
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="flex items-center gap-2.5 bg-white hover:bg-zinc-100 text-[#8D321F] font-semibold px-5 py-2 rounded-full text-[14.5px] transition active:scale-95 shadow-md hover:shadow-lg group"
          >
            <span>Launch Workstation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* HERO SECTION WITH PIXELREVEAL CANVAS BACKGROUND */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 md:px-8 overflow-hidden bg-[#8D321F]">
        {/* Interactive Pixel Reveal Canvas Background */}
        <div className="absolute inset-0 z-0 opacity-95">
          <PixelReveal />
        </div>

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

          {/* Main Headline */}
          <h1 className="font-display font-bold text-[38px] sm:text-[54px] md:text-[68px] leading-[1.08] tracking-tight text-white drop-shadow-md">
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
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-[#8D321F] text-[17px] font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-glow-rust transition-all duration-200 active:scale-95 group"
            >
              <span>Enter Diagnostic Studio</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform text-[#8D321F]" />
            </button>

            <button
              onClick={() => handleLaunchModel('knee-osteoarthritis')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md text-white text-[16px] font-semibold px-7 py-4 rounded-full transition-all duration-200 active:scale-95"
            >
              <Activity className="w-5 h-5 text-emerald-300" />
              <span>Test Knee OA Model</span>
            </button>
          </div>

          {/* Live Trust & Hardware Acceleration Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 w-full max-w-[880px]">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-white/60 font-semibold">Hardware</span>
                <span className="text-[13.5px] font-bold text-white leading-tight">RTX 4060 GPU</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-white/60 font-semibold">Accuracy</span>
                <span className="text-[13.5px] font-bold text-white leading-tight">98.6% IoU Match</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-white/60 font-semibold">Security</span>
                <span className="text-[13.5px] font-bold text-white leading-tight">256-bit AES PACS</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-white/60 font-semibold">Latency</span>
                <span className="text-[13.5px] font-bold text-white leading-tight">&lt; 0.4s Inference</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CLINICAL AI MODELS SHOWCASE */}
      <section id="models" className="py-20 px-6 md:px-12 max-w-[1360px] mx-auto w-full">
        {/* Section Header */}
        <div className="text-center max-w-[720px] mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8D321F]/10 text-[#8D321F] text-[13px] font-bold uppercase tracking-wider">
            Clinical Neural Networks
          </div>
          <h2 className="text-[36px] md:text-[44px] font-display font-bold text-[#1F1F1F] tracking-tight">
            Specialized Medical Vision Models
          </h2>
          <p className="text-[16px] text-zinc-600 leading-relaxed">
            Multi-model deep learning ensembles calibrated against ground-truth radiologist annotations.
          </p>
        </div>

        {/* 3 Model Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Knee Osteoarthritis */}
          <div className="bg-white rounded-[32px] border-[2.5px] border-[#8D321F] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="h-52 bg-black rounded-2xl overflow-hidden flex items-center justify-center relative">
                <img
                  src="/assets/images/model_knee_osteoarthritis.png"
                  alt="Knee Osteoarthritis Detection"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#8D321F] text-white text-[11.5px] font-bold px-3 py-1 rounded-full">
                  KL0 – KL4 Staging
                </div>
              </div>

              <div>
                <h3 className="text-[22px] font-display font-semibold text-zinc-900 tracking-tight">
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
                  <strong className="text-[#00BF63] font-bold">97.8% verified</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Modality:</span>
                  <span className="font-mono text-zinc-800">DX Weight-Bearing AP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchModel('knee-osteoarthritis')}
              className="mt-6 w-full bg-[#8D321F] hover:bg-[#7D2A18] text-white py-3 px-5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
            >
              <span>Run Diagnostic Scan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Knee Abnormality */}
          <div className="bg-white rounded-[32px] border-[2.5px] border-zinc-300 hover:border-[#8D321F] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="h-52 bg-black rounded-2xl overflow-hidden flex items-center justify-center relative">
                <img
                  src="/assets/images/model_knee_abnormality.png"
                  alt="Knee Abnormality"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-zinc-800 text-white text-[11.5px] font-bold px-3 py-1 rounded-full">
                  CTFS Alignment
                </div>
              </div>

              <div>
                <h3 className="text-[22px] font-display font-semibold text-zinc-900 tracking-tight">
                  Knee Abnormality
                </h3>
                <p className="text-[14px] text-zinc-500 font-mono mt-0.5">
                  Deep ResNet-FPN Landmark Detection
                </p>
              </div>

              <p className="text-[14px] text-zinc-600 leading-relaxed">
                Evaluates femorotibial joint alignment, soft-tissue effusion markers, and proximal fibular joint morphology.
              </p>

              <div className="space-y-2 pt-2 border-t border-zinc-100 text-[13px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Accuracy Benchmark:</span>
                  <strong className="text-[#00BF63] font-bold">98.6% verified</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Modality:</span>
                  <span className="font-mono text-zinc-800">DX Lateral / AP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchModel('knee-abnormality')}
              className="mt-6 w-full bg-zinc-900 hover:bg-[#8D321F] text-white py-3 px-5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
            >
              <span>Run Diagnostic Scan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Fracture Detection */}
          <div className="bg-white rounded-[32px] border-[2.5px] border-zinc-300 hover:border-[#8D321F] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="h-52 bg-black rounded-2xl overflow-hidden flex items-center justify-center relative">
                <img
                  src="/assets/images/model_fracture.png"
                  alt="Fracture Detection"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#00BF63] text-white text-[11.5px] font-bold px-3 py-1 rounded-full">
                  Cortical Break
                </div>
              </div>

              <div>
                <h3 className="text-[22px] font-display font-semibold text-zinc-900 tracking-tight">
                  Fracture Detection
                </h3>
                <p className="text-[14px] text-zinc-500 font-mono mt-0.5">
                  YOLO-PACS Cortical Break Engine
                </p>
              </div>

              <p className="text-[14px] text-zinc-600 leading-relaxed">
                Locates complete and incomplete diaphyseal fractures, computes dorsal displacement metrics, and grades angulation.
              </p>

              <div className="space-y-2 pt-2 border-t border-zinc-100 text-[13px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Accuracy Benchmark:</span>
                  <strong className="text-[#00BF63] font-bold">99.1% verified</strong>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Modality:</span>
                  <span className="font-mono text-zinc-800">DX Orthogonal</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchModel('fracture-detection')}
              className="mt-6 w-full bg-zinc-900 hover:bg-[#8D321F] text-white py-3 px-5 rounded-full font-semibold text-[15px] flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8D321F]/10 text-[#8D321F] text-[13px] font-bold uppercase tracking-wider">
              Diagnostic Pipeline
            </div>
            <h2 className="text-[36px] md:text-[44px] font-display font-bold text-[#1F1F1F] tracking-tight">
              Seamless 3-Step Radiologist Workflow
            </h2>
            <p className="text-[16px] text-zinc-600">
              Designed from the ground up for high-throughput hospital reading rooms and emergency triage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-[28px] border border-zinc-300 p-8 shadow-sm relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8D321F] text-white font-display font-bold text-[20px] flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-[21px] font-display font-semibold text-zinc-900">
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
              <div className="w-12 h-12 rounded-2xl bg-[#8D321F] text-white font-display font-bold text-[20px] flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-[21px] font-display font-semibold text-zinc-900">
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
              <div className="w-12 h-12 rounded-2xl bg-[#8D321F] text-white font-display font-bold text-[20px] flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-[21px] font-display font-semibold text-zinc-900">
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white text-[13px] font-bold uppercase tracking-wider">
              <SparkleIcon className="w-4 h-4 text-white" />
              Multi-Provider AI Diagnostic Copilot
            </div>
            <h2 className="text-[34px] md:text-[46px] font-display font-bold leading-[1.1] tracking-tight">
              Bring Your Own LLM.<br />
              <span className="text-white/90">Gemini, Claude, GPT-4o, or Ollama.</span>
            </h2>
            <p className="text-[16px] md:text-[18px] text-white/85 leading-relaxed font-light">
              Kitten includes a built-in AI copilot capable of explaining Kellgren-Lawrence staging, synthesizing radiologist impression drafts, and providing differential diagnostic suggestions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsLlmSettingsOpen(true)}
                className="bg-white hover:bg-zinc-100 text-[#8D321F] font-bold px-7 py-3 rounded-full text-[15px] transition active:scale-95 shadow-md flex items-center gap-2"
              >
                <Sliders className="w-4.5 h-4.5 text-[#8D321F]" />
                <span>Configure LLM Settings</span>
              </button>
              <button
                onClick={() => setCurrentScreen('ai-assistant')}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-6 py-3 rounded-full text-[15px] transition active:scale-95"
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
                <span className="font-display font-semibold text-[17px] text-zinc-900">Kitten Clinical Copilot</span>
              </div>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Online
              </span>
            </div>

            <div className="space-y-3 text-[13.5px]">
              <div className="bg-[#F5F2F2] rounded-2xl p-3.5 text-zinc-700">
                <strong className="text-[#8D321F] block text-xs uppercase mb-1">Radiologist Query:</strong>
                "Explain the Kellgren-Lawrence grading criteria for Case #kt-523477."
              </div>

              <div className="bg-[#8D321F]/10 border border-[#8D321F]/20 rounded-2xl p-3.5 text-zinc-800 space-y-1.5">
                <strong className="text-[#8D321F] block text-xs uppercase">AI Copilot Analysis:</strong>
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
          {/* Brand & Watermark */}
          <div className="flex items-center gap-3">
            <span className="font-['Fredoka'] font-semibold text-[36px] text-[#8D321F] tracking-normal">
              Kitten
            </span>
            <span className="font-['Fredoka'] font-semibold text-[20px] text-[#8D321F]/70">
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
              className="bg-[#8D321F] hover:bg-[#7D2A18] text-white px-6 py-2.5 rounded-full font-semibold text-[14px] transition active:scale-95 shadow-sm"
            >
              Launch Workstation &rarr;
            </button>
          </div>
        </div>

        <div className="max-w-[1360px] mx-auto mt-8 pt-6 border-t border-zinc-100 text-center text-[11.5px] text-zinc-400">
          © 2026 Kitten Medical Systems. AI Diagnostic Decision Support System — For Research & Clinical Triaging.
        </div>
      </footer>
    </div>
  );
};
