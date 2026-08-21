import React, { useState } from 'react';
import { useMedicalApp } from '../../context/MedicalAppContext';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Sun } from 'lucide-react';

export const DicomViewport: React.FC = () => {
  const { 
    showBoundingBoxes, 
    setShowBoundingBoxes, 
    brightness, 
    setBrightness, 
    contrast, 
    setContrast, 
    zoomLevel, 
    setZoomLevel,
    uploadedFile,
    annotatedImageUrl,
    selectedModel
  } = useMedicalApp();

  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showTools, setShowTools] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoomLevel(1);
    setBrightness(100);
    setContrast(100);
    setPanPosition({ x: 0, y: 0 });
  };

  const imageSrc = annotatedImageUrl || uploadedFile || (selectedModel === 'knee-osteoarthritis' ? '/assets/images/model_knee_osteoarthritis.png' : '/assets/images/xray_fracture.png');

  return (
    <div className="flex-1 max-w-[390px] bg-[#141517] rounded-[32px] border-[2.5px] border-[#1F1F1F] p-4 flex flex-col justify-between relative shadow-md overflow-hidden select-none h-full">
      {/* Top DICOM Overlay HUD */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-zinc-400 text-[11px] font-mono pointer-events-none z-20">
        <div>
          <span className="text-zinc-200 font-bold block text-[12px]">
            {selectedModel === 'knee-osteoarthritis' ? 'DX KNEE AP BILATERAL' : selectedModel === 'knee-abnormality' ? 'DX KNEE LATERAL' : 'DX FOREARM AP'}
          </span>
          <span>kVp: 62 | mAs: 4.5</span>
        </div>
        <div className="text-right">
          <span className="text-[#00BF63] font-bold block text-[12px]">AI INFERENCE ACTIVE</span>
          <span>ZOOM: {(zoomLevel * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div 
        className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-[24px] cursor-grab active:cursor-grabbing flex-1"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Radiograph Image with CSS filters */}
        <div
          className="relative transition-transform duration-75 flex items-center justify-center h-full"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          }}
        >
          <img
            src={imageSrc}
            alt="Annotated Radiograph"
            className="w-full max-h-[480px] object-contain select-none pointer-events-none"
          />

          {/* Optional Pulse Glow Highlighter when not already annotated */}
          {showBoundingBoxes && !annotatedImageUrl && (
            <div
              className="absolute border border-[#00E676]/40 rounded-xs pointer-events-none animate-pulse"
              style={{
                top: '32%',
                left: '25%',
                width: '52%',
                height: '38%',
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom Floating PACS Tools Pill Scaled */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#232529]/95 backdrop-blur-md border border-white/15 rounded-full px-4 py-2 flex items-center gap-3 z-20 shadow-xl text-white">
        <button
          onClick={() => setZoomLevel(Math.min(zoomLevel + 0.2, 2.5))}
          className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setZoomLevel(Math.max(zoomLevel - 0.2, 0.6))}
          className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
          className={`p-2 rounded-full transition ${showBoundingBoxes ? 'text-[#00E676] bg-[#00E676]/20' : 'hover:bg-white/20'}`}
          title="Toggle Bounding Box Highlighting"
        >
          {showBoundingBoxes ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowTools(!showTools)}
          className={`p-2 rounded-full transition ${showTools ? 'text-[#8D321F] bg-white' : 'hover:bg-white/20'}`}
          title="Windowing Controls"
        >
          <Sun className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition text-zinc-300"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Expandable Windowing Controls Popup */}
      {showTools && (
        <div className="absolute bottom-18 left-1/2 -translate-x-1/2 bg-[#25272B] border border-white/15 rounded-2xl p-4 z-30 shadow-2xl w-68 space-y-3 text-white text-xs">
          <div>
            <div className="flex justify-between mb-1.5 text-[12px]">
              <span>Brightness</span>
              <span>{brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="180"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-[#8D321F]"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5 text-[12px]">
              <span>Contrast</span>
              <span>{contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-[#8D321F]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
