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
    selectedModel,
    detectedFractures
  } = useMedicalApp();

  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showTools, setShowTools] = useState(false);

  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 640, height: 640 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget;
    if (imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
      setImageDimensions({ width: imgEl.naturalWidth, height: imgEl.naturalHeight });
    }
  };

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

  // Always prioritize the user's actual uploaded file/preview URL
  const imageSrc = (() => {
    if (uploadedFile) return uploadedFile;
    if (annotatedImageUrl) return annotatedImageUrl;
    if (selectedModel === 'fracture-detection') return '/assets/images/model_fracture.png';
    if (selectedModel === 'knee-osteoarthritis') return '/assets/images/model_knee_osteoarthritis.png';
    return '/assets/images/model_knee_abnormality.png';
  })();

  const hudStudyTitle = selectedModel === 'fracture-detection'
    ? 'DX FOREARM / RADIUS AP'
    : selectedModel === 'knee-osteoarthritis'
    ? 'DX KNEE AP BILATERAL'
    : 'DX KNEE LATERAL VIEW';

  const hudModelTag = selectedModel === 'fracture-detection'
    ? 'YOLO11n FRACTURE ACTIVE'
    : selectedModel === 'knee-osteoarthritis'
    ? 'YOLOv8 + KL ENSEMBLE'
    : 'DEEP CTFS ALIGNMENT';

  return (
    <div className="flex-1 max-w-[390px] bg-[#141517] rounded-[32px] border-[2.5px] border-[#1F1F1F] p-4 flex flex-col justify-between relative shadow-md overflow-hidden select-none h-full">
      {/* Top DICOM Overlay HUD */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-zinc-400 text-[11px] font-mono pointer-events-none z-20">
        <div>
          <span className="text-zinc-200 font-bold block text-[12px]">
            {hudStudyTitle}
          </span>
          <span>kVp: 62 | mAs: 4.5 | 0.4s</span>
        </div>
        <div className="text-right">
          <span className="text-[#00BF63] font-bold block text-[12px]">{hudModelTag}</span>
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
          className="relative transition-transform duration-75 flex items-center justify-center h-full max-w-full"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          }}
        >
          <img
            src={imageSrc}
            alt="Clinical Radiograph Viewport"
            onLoad={handleImageLoad}
            className="w-full max-h-[480px] object-contain select-none pointer-events-none rounded-xl"
          />

          {/* Real Dynamic Bounding Box Overlay for Bone Fracture Detection from Server YOLO11n */}
          {showBoundingBoxes && selectedModel === 'fracture-detection' && detectedFractures.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {detectedFractures.map((df, idx) => {
                const left = (df.bounding_box.x1 / imageDimensions.width) * 100;
                const top = (df.bounding_box.y1 / imageDimensions.height) * 100;
                const width = ((df.bounding_box.x2 - df.bounding_box.x1) / imageDimensions.width) * 100;
                const height = ((df.bounding_box.y2 - df.bounding_box.y1) / imageDimensions.height) * 100;

                return (
                  <div
                    key={idx}
                    className="absolute border-2 border-[#00E676] bg-[#00E676]/20 rounded-md shadow-[0_0_15px_rgba(0,230,118,0.5)] animate-pulse"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-0 bg-[#00E676] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                      Fracture ({(df.confidence * 100).toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dynamic Bounding Box Overlay for Knee Osteoarthritis */}
          {showBoundingBoxes && selectedModel === 'knee-osteoarthritis' && !annotatedImageUrl && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute border-2 border-[#FF9800] bg-[#FF9800]/10 rounded-md shadow-[0_0_12px_rgba(255,152,0,0.3)] animate-pulse"
                style={{
                  top: '30%',
                  left: '12%',
                  width: '36%',
                  height: '40%',
                }}
              >
                <span className="absolute -top-6 left-0 bg-[#FF9800] text-black text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                  Right Knee: KL-2
                </span>
              </div>
              <div
                className="absolute border-2 border-[#00E676] bg-[#00E676]/10 rounded-md shadow-[0_0_12px_rgba(0,230,118,0.3)] animate-pulse"
                style={{
                  top: '30%',
                  right: '12%',
                  width: '36%',
                  height: '40%',
                }}
              >
                <span className="absolute -top-6 left-0 bg-[#00E676] text-black text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                  Left Knee: KL-0
                </span>
              </div>
            </div>
          )}

          {/* Dynamic Bounding Box Overlay for Knee Abnormality */}
          {showBoundingBoxes && selectedModel === 'knee-abnormality' && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute border-2 border-[#00B0FF] bg-[#00B0FF]/15 rounded-md shadow-[0_0_12px_rgba(0,176,255,0.3)] animate-pulse"
                style={{
                  top: '34%',
                  left: '20%',
                  width: '60%',
                  height: '35%',
                }}
              >
                <span className="absolute -top-6 left-0 bg-[#00B0FF] text-black text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                  CTFS Grade II (98.6%)
                </span>
              </div>
            </div>
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
