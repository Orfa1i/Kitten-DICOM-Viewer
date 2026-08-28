import React, { useEffect, useRef } from "react";
import { RenderingEngine, Enums } from "@cornerstonejs/core";
import { useCornerstone } from "../../utils/useCornerstone";

interface CornerstoneViewportProps {
  imageIds: string[];
}

export const CornerstoneViewport: React.FC<CornerstoneViewportProps> = ({ imageIds }) => {
  const { isReady } = useCornerstone();
  const elementRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!isReady || !elementRef.current || runningRef.current || imageIds.length === 0) return;
    runningRef.current = true;

    const renderingEngineId = "myRenderingEngine";
    const viewportId = "CT_AXIAL_STACK";

    const renderingEngine = new RenderingEngine(renderingEngineId);
    
    const viewportInput = {
      viewportId,
      type: Enums.ViewportType.STACK,
      element: elementRef.current,
      defaultOptions: {
        background: [0, 0, 0] as [number, number, number],
      },
    };

    renderingEngine.enableElement(viewportInput);
    const viewport = renderingEngine.getViewport(viewportId) as any;

    const run = async () => {
      try {
        await viewport.setStack(imageIds);
        viewport.render();
      } catch (err) {
        console.error("Failed to load stack:", err);
      }
    };

    run();

    return () => {
      renderingEngine.disableElement(viewportId);
      renderingEngine.destroy();
      runningRef.current = false;
    };
  }, [isReady, imageIds]);

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative border border-zinc-700/50 shadow-inner">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-mono text-sm">
          Initializing WebGL Engine...
        </div>
      )}
      <div 
        ref={elementRef} 
        className="w-full h-full oncontextmenu-none select-none touch-none"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

