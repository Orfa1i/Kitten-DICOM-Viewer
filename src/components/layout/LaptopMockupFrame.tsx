import React from 'react';

export const LaptopMockupFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full max-w-[1340px] mx-auto py-4 px-2 flex flex-col items-center select-none">
      {/* Top Screen Lid */}
      <div className="w-full rounded-[28px] p-3.5 screen-bezel bg-[#1D1E22] border-[3px] border-[#2E3035] shadow-2xl relative">
        {/* Webcam dot */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#0D0E10] border border-white/10 flex items-center justify-center">
          <div className="w-0.5 h-0.5 rounded-full bg-blue-500/40"></div>
        </div>

        {/* Display Content */}
        <div className="w-full rounded-[20px] overflow-hidden bg-[#FDF9F9] shadow-inner min-h-[660px] flex flex-col">
          {children}
        </div>
      </div>

      {/* Laptop Keyboard Base & Hinge */}
      <div className="w-[105%] max-w-[1420px] -mt-1 relative flex flex-col items-center">
        {/* Hinge */}
        <div className="w-[30%] h-3 bg-[#18191B] rounded-b-md shadow-inner border-t border-black/40"></div>
        
        {/* Chassis Top Surface */}
        <div className="w-full h-10 laptop-chassis rounded-t-xl rounded-b-[20px] relative flex items-center justify-center border-t border-white/15 px-12">
          {/* Trackpad notch */}
          <div className="w-32 h-1 bg-[#18191B] rounded-full opacity-60"></div>
        </div>

        {/* Chassis Bottom Shadow Edge */}
        <div className="w-[96%] h-2.5 bg-black/40 blur-[3px] -mt-1 rounded-full"></div>
      </div>
    </div>
  );
};
