import React, { useEffect, useRef, useState } from "react";
import { RenderingEngine, Enums, type Types, volumeLoader } from "@cornerstonejs/core";
import * as csTools from "@cornerstonejs/tools";
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
    const toolGroupId = "myToolGroup";

    // 1. Setup ToolGroup
    let toolGroup = csTools.ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) {
      toolGroup = csTools.ToolGroupManager.createToolGroup(toolGroupId)!;
      
      // Add tools
      csTools.addTool(csTools.WindowLevelTool);
      csTools.addTool(csTools.PanTool);
      csTools.addTool(csTools.ZoomTool);
      
      // Add to toolgroup
      toolGroup.addTool(csTools.WindowLevelTool.toolName);
      toolGroup.addTool(csTools.PanTool.toolName);
      toolGroup.addTool(csTools.ZoomTool.toolName);
      
      // Set active tools
      toolGroup.setToolActive(csTools.WindowLevelTool.toolName, {
        bindings: [{ mouseButton: csTools.Enums.MouseBindings.Primary }],
      });
      toolGroup.setToolActive(csTools.PanTool.toolName, {
        bindings: [{ mouseButton: csTools.Enums.MouseBindings.Auxiliary }],
      });
      toolGroup.setToolActive(csTools.ZoomTool.toolName, {
        bindings: [{ mouseButton: csTools.Enums.MouseBindings.Secondary }],
      });
    }

    // 2. Setup Rendering Engine & Viewport
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
    
    // Add viewport to toolgroup
    toolGroup.addViewport(viewportId, renderingEngineId);
    
    const viewport = renderingEngine.getViewport(viewportId) as Types.IStackViewport;

    // 3. Load Images
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
      const tg = csTools.ToolGroupManager.getToolGroup(toolGroupId);
      if (tg) {
        tg.removeViewports(renderingEngineId, viewportId);
      }
      renderingEngine.disableElement(viewportId);
      renderingEngine.destroy();
      runningRef.current = false;
    };
  }, [isReady, imageIds]);

  return (
    <div className="w-full h-full bg-black rounded-[22px] overflow-hidden relative shadow-inner">
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

